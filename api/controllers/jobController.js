const Job = require('../models/Job');
const path = require('path');
const fs = require('fs');
const { moveFilesToUserDir, cleanupTempFiles, cleanupFiles } = require('../middlewares/Multer');
const { sendToConvertQueue, sendToMergeQueue, sendToSplitQueue } = require('../RabbitMQ');

let archiver;
try {
    archiver = require('archiver');
    console.log('✅ Archiver loaded successfully');
} catch (error) {
    console.error('❌ Archiver not found. Please install: npm install archiver');
    console.error('Error:', error.message);
}

const normalizePath = (filePath) => {
    if (!filePath) return filePath;
    
    // Çift backslash'leri tek backslash'e çevir
    let normalized = filePath.replace(/\\\\/g, '\\');
    
    // Path.normalize kullanarak yolu düzelt
    normalized = path.normalize(normalized);
    
    console.log('🔧 Path normalization:', {
        original: filePath,
        normalized: normalized
    });
    
    return normalized;
};

const queueFunctions = {
    convert: sendToConvertQueue,
    merge: sendToMergeQueue,
    split: sendToSplitQueue
};

const handleFileUpload = async(req, res, operation) => {
    try {
        const userId = req.body.userId;
        const splitStart = req.body.splitStart;
        const splitEnd = req.body.splitEnd;

        if (!userId) {
            cleanupTempFiles(req.files);
            return res.status(400).json({ 
                error: 'userId is required' 
            });
        }

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                error: 'No files uploaded' 
            });
        }

        let finalPaths = [];
        let originalFileNames = [];

        try {
            finalPaths = moveFilesToUserDir(req.files, userId);
            originalFileNames = req.files.map(f => f.originalname);

            const newJob = new Job({
                userId,
                operation,
                originalFileNames,
                inputPaths: finalPaths,
                status: 'pending',
                splitStart,
                splitEnd,
            });

            await newJob.save();

            // Queue'ya gonderilecek data
            const queueData = {
                jobId: newJob._id.toString(),
                userId,
                operation,
                originalFileNames,
                inputPaths: finalPaths,
                status: newJob.status,
                splitStart,
                splitEnd,
            };

            try {
                const queueFunction = queueFunctions[operation];
                if (queueFunction) {
                    //Queue'ya gonderme
                    queueFunction(queueData);
                    console.log(`Job ${newJob._id} sent to ${operation} queue successfully`);
                } else {
                    throw new Error(`Unknown operation: ${operation}`);
                }
            } catch (queueError) {
                console.error('Queue error:', queueError);
                
                newJob.status = 'failed';
                newJob.errorMessage = 'Failed to queue job for processing';
                await newJob.save();
                
                cleanupFiles(finalPaths);
                
                return res.status(500).json({
                    error: 'Failed to queue job for processing',
                    jobId: newJob._id
                });
            }

            res.status(201).json({
                message: `${operation.charAt(0).toUpperCase() + operation.slice(1)} job created and queued successfully`,
                jobId: newJob._id,
                status: newJob.status
            });

        } catch (moveError) {
            console.error('File move error:', moveError);
            
            cleanupTempFiles(req.files);
            cleanupFiles(finalPaths);

            return res.status(500).json({
                error: 'Failed to process uploaded files',
                details: moveError.message
            });
        }

    } catch (error) {
        console.error('Route error:', error);
        cleanupTempFiles(req.files);
        
        res.status(500).json({ 
            error: 'Internal server error' 
        });
    }
};


exports.convertPdf = async(req, res) => {
    await handleFileUpload(req, res, 'convert');
};

exports.merge = async(req, res) => {
    await handleFileUpload(req, res, 'merge');
};

exports.split = async(req, res) => {
    await handleFileUpload(req, res, 'split');
};

exports.streamJobStatus = async(req,res) => {
        const jobId = req.params.id;

        if(!jobId)
            return res.status(400).json({
                message:'Job id is not found.'
            });

        res.setHeader('Content-Type', 'text/event-stream'); //sse akisi oldugunu belirtir
        res.setHeader('Cache-Control', 'no-cache'); //cach yapmamasi icin islem
        res.setHeader('Connection', 'keep-alive'); //baglantiyi acik birakir
        res.flushHeaders(); //hedaerlari aninda gonderir

        let interval = setInterval(async () => {
            const job = await Job.findById(jobId);

            if (!job) {
            res.write(`event: error\ndata: ${JSON.stringify({ error: 'Job not found' })}\n\n`);
            clearInterval(interval); //donguyu kapatma
            res.end(); //sse kapatma
            return;
            }

            // frontende gonderme
            res.write(`event: status\ndata: ${JSON.stringify({ status: job.status, outputPaths: job.outputPaths })}\n\n`);

            // 4️⃣ İş bittiğinde bağlantıyı kes
            if (job.status === 'completed' || job.status === 'failed') {
            clearInterval(interval);
            res.end();
            }
        }, 2000);

    // baglanti kapandiginda sse temizle
    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
}


exports.downloadFile = async (req, res) => {
    try {
        const { jobId, fileIndex } = req.params;
        
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }
        
        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }
        
        console.log('📋 Job found:', { 
            id: job._id, 
            status: job.status, 
            outputPathsCount: job.outputPaths?.length || 0,
            outputPaths: job.outputPaths 
        });
        
        if (job.status !== 'completed') {
            return res.status(400).json({ error: 'Job not completed yet' });
        }
        
        if (!job.outputPaths || job.outputPaths.length === 0) {
            return res.status(404).json({ error: 'No output files found' });
        }
        
        const fileIndex_int = parseInt(fileIndex);
        if (fileIndex_int >= job.outputPaths.length || fileIndex_int < 0) {
            return res.status(404).json({ error: 'File not found' });
        }
        
        const rawFilePath = job.outputPaths[fileIndex_int];
        const filePath = normalizePath(rawFilePath);

        if (!fs.existsSync(filePath)) {
            console.error('❌ File not found on disk:', filePath);
            return res.status(404).json({ error: 'File not found on server' });
        }

        const stats = fs.statSync(filePath);
        const fileName = path.basename(filePath);
        console.log('✅ File info:', { 
            fileName, 
            size: stats.size,
            isFile: stats.isFile()
        });
        
        const ext = path.extname(fileName).toLowerCase();
        let contentType = 'application/octet-stream';
        
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.doc': 'application/msword',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xls': 'application/vnd.ms-excel',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.ppt': 'application/vnd.ms-powerpoint',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        };
        
        if (mimeTypes[ext]) {
            contentType = mimeTypes[ext];
        }
        
        console.log('📄 Content type:', contentType);

        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', stats.size);

        const fileStream = fs.createReadStream(filePath);
        
        fileStream.on('error', (error) => {
            console.error('❌ File stream error:', error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'File stream error' });
            }
        });
        
        fileStream.on('open', () => {
            console.log('📤 File stream opened, sending file...');
        });
        
        fileStream.on('end', () => {
            console.log('✅ File sent successfully');
        });
        
        fileStream.pipe(res);
        
    } catch (error) {
        console.error('❌ Download error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed: ' + error.message });
        }
    }
};


exports.downloadAllFiles = async (req, res) => {
    try {
        console.log('🔽 Download all files request:', req.params);
        const { jobId } = req.params;
        
        if (!jobId) {
            console.error('❌ Job ID missing');
            return res.status(400).json({ error: 'Job ID is required' });
        }
        
        const job = await Job.findById(jobId);
        if (!job) {
            console.error('❌ Job not found:', jobId);
            return res.status(404).json({ error: 'Job not found' });
        }
        
        console.log('📋 Job found:', { 
            id: job._id, 
            status: job.status, 
            outputPathsCount: job.outputPaths?.length || 0,
            outputPaths: job.outputPaths 
        });
        
        if (job.status !== 'completed') {
            console.error('❌ Job not completed:', job.status);
            return res.status(400).json({ error: 'Job not completed yet' });
        }
        
        if (!job.outputPaths || job.outputPaths.length === 0) {
            console.error('❌ No output paths found');
            return res.status(404).json({ error: 'No files to download' });
        }

        if (job.outputPaths.length === 1) {
            console.log('📄 Single file download');
            const rawFilePath = job.outputPaths[0];
            const filePath = normalizePath(rawFilePath);
            console.log('📁 Normalized file path:', filePath);
            
            if (!fs.existsSync(filePath)) {
                console.error('❌ File not found on disk:', filePath);
                return res.status(404).json({ error: 'File not found on server' });
            }

            const stats = fs.statSync(filePath);
            const fileName = path.basename(filePath);
            console.log('✅ Single file info:', { 
                fileName, 
                size: stats.size,
                isFile: stats.isFile()
            });

            const ext = path.extname(fileName).toLowerCase();
            let contentType = 'application/octet-stream';
            
            const mimeTypes = {
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                '.xls': 'application/vnd.ms-excel',
                '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                '.ppt': 'application/vnd.ms-powerpoint',
                '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                '.txt': 'text/plain',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png'
            };
            
            if (mimeTypes[ext]) {
                contentType = mimeTypes[ext];
            }
            
            res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', stats.size);
            
            const fileStream = fs.createReadStream(filePath);
            
            fileStream.on('error', (error) => {
                console.error('❌ File stream error:', error);
                if (!res.headersSent) {
                    res.status(500).json({ error: 'File stream error' });
                }
            });
            
            fileStream.on('open', () => {
                console.log('📤 Single file stream opened, sending file...');
            });
            
            fileStream.on('end', () => {
                console.log('✅ Single file sent successfully');
            });
            
            fileStream.pipe(res);
            return;
        }

        if (!archiver) {
            console.error('❌ Archiver not available');
            return res.status(500).json({ error: 'Archive functionality not available. Please install archiver package.' });
        }
        
        console.log('📦 Creating ZIP for multiple files');
        const zipName = `converted_files_${jobId}.zip`;
        res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);
        res.setHeader('Content-Type', 'application/zip');
        
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });
        
        archive.on('error', (err) => {
            console.error('❌ Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Archive creation failed' });
            }
        });
        
        archive.on('warning', (err) => {
            if (err.code === 'ENOENT') {
                console.warn('⚠️ Archive warning:', err);
            } else {
                console.error('❌ Archive warning (critical):', err);
            }
        });
        
        archive.pipe(res);

        let addedFiles = 0;
        for (let i = 0; i < job.outputPaths.length; i++) {
            const rawFilePath = job.outputPaths[i];
            const filePath = normalizePath(rawFilePath);
            console.log(`📁 Checking normalized file ${i + 1}:`, filePath);
            
            if (fs.existsSync(filePath)) {
                const fileName = path.basename(filePath);
                console.log(`✅ Adding to ZIP: ${fileName}`);
                archive.file(filePath, { name: fileName });
                addedFiles++;
            } else {
                console.warn(`File not found, skipping: ${filePath}`);
            }
        }
        
        if (addedFiles === 0) {
            return res.status(404).json({ error: 'No files available for download' });
        }
        
        archive.finalize();
        
    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: 'Download failed: ' + error.message });
        }
    }
};