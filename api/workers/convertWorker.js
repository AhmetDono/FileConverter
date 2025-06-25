const amqp = require('amqplib');
const path = require('path');
const docxConverter = require('docx-pdf');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const Job = require('../models/Job');
const mongoose = require('mongoose');

async function connectMongoDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/converter');
        console.log('✅ Worker MongoDB connected');
    } catch (error) {
        console.error('❌ Worker MongoDB connection failed:', error);
        throw error;
    }
}

function generateOutputPath(inputPath) {
    const inputDir = path.dirname(inputPath); // uploads/userId klasörü
    const inputFileName = path.basename(inputPath, path.extname(inputPath)); // uzantısız dosya adı
    return path.join(inputDir, `${inputFileName}.pdf`); // aynı klasör + .pdf uzantısı
}

function convertDocxToPdf(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        // Dosyanın var olduğunu ve okunabilir olduğunu kontrol et
        if (!fs.existsSync(inputPath)) {
            reject(new Error(`Input file does not exist: ${inputPath}`));
            return;
        }

        // Dosya boyutunu kontrol et
        const stats = fs.statSync(inputPath);
        if (stats.size === 0) {
            reject(new Error(`Input file is empty: ${inputPath}`));
            return;
        }

        console.log(`📄 Converting DOCX file (${stats.size} bytes): ${inputPath}`);

        docxConverter(inputPath, outputPath, (err, result) => {
            if (err) {
                console.error('❌ DOCX Conversion Error:', err);
                reject(new Error(`DOCX conversion failed: ${err.message || err}`));
            } else {
                // PDF dosyasının oluştuğunu kontrol et
                if (fs.existsSync(outputPath)) {
                    const outputStats = fs.statSync(outputPath);
                    console.log(`✅ PDF oluşturuldu: ${outputPath} (${outputStats.size} bytes)`);
                    resolve(result);
                } else {
                    reject(new Error('PDF dosyası oluşturulamadı'));
                }
            }
        });
    });
}

async function updateJob(jobId,status,outputPaths = null){
    try {
        const updateData = { 
            status:status,
            outputPaths:outputPaths,
            updatedAt: new Date()
        };

        await Job.findByIdAndUpdate(jobId, updateData);
        console.log(`📝 Job ${jobId} status updated to: ${status}`);
    } catch (error) {
        console.error(`❌ Error updating job ${jobId} status:`, error);
        throw error;
    }
}

async function startConverter() {

    await connectMongoDB();

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue('pdf_convert_queue',{
        durable: true,
    });

    console.log(`[✔] Worker listening on pdf_convert_queue...`);

    await channel.prefetch(1);

    // consume tuketmek yani kullanmak
    channel.consume('pdf_convert_queue', async(msg) =>{
        if(msg!=null){
            try {
                const job = JSON.parse(msg.content.toString());
                console.log('[➡] Job received:', job)

                await updateJob(job.jobId, 'processing');

                // Uzanti alma islemi
                const fileExtension = path.extname(job.inputPaths[0]);
                console.log(fileExtension);

                let allConverted = true;
                const outputPaths = [];
                const doc = new PDFDocument();

                switch(fileExtension){
                    case '.docx':
                        for(const inputPath of job.inputPaths){
                            try {
                                const outputPath = generateOutputPath(inputPath);
                                console.log(`Converting: ${inputPath} -> ${outputPath}`);
                                
                                await convertDocxToPdf(inputPath, outputPath);
                                outputPaths.push(outputPath);
                                console.log('Dönüştürme tamamlandı!');
                            } catch (error) {
                                console.error('Dönüştürme hatası:', error);
                                allConverted = false;
                            }
                        }
                        break;
                    case '.txt':
                        for(const inputPath of job.inputPaths){
                            try {
                                const outputPath = generateOutputPath(inputPath);
                                console.log(`Converting: ${inputPath} -> ${outputPath}`);
                                
                               //txt to  pdf
                               const writeStream = fs.createWriteStream(outputPath);
                               doc.pipe(writeStream);

                               const content = fs.readFileSync(inputPath, 'utf-8');
                               doc.font('Times-Roman').fontSize(12).text(content, {
                                    align: 'left',
                                    lineGap: 4
                                });

                                doc.end();

                                writeStream.on('finish', () => {
                                    console.log(`PDF oluşturuldu: ${outputPath}`);
                                });

                                outputPaths.push(outputPath);
                                console.log('Dönüştürme tamamlandı!');
                            } catch (error) {
                                console.error('Dönüştürme hatası:', error);
                                allConverted = false;
                            }
                        }
                        break;
                    case '.jpg':
                    case '.jpeg':
                    case '.png':
                        for(const inputPath of job.inputPaths){
                            try {
                                const outputPath = generateOutputPath(inputPath);
                                console.log(`Converting: ${inputPath} -> ${outputPath}`);
                                
                               //image t o pdf
                                const writeStream = fs.createWriteStream(outputPath);
                                doc.pipe(writeStream);

                                const image = doc.openImage(fs.readFileSync(inputPath));
                                const {width, height} = image;

                                doc.image(image, 0, 0, { width, height });

                                doc.end();

                                writeStream.on('finish', () => {
                                    console.log(`PDF oluşturuldu: ${outputPath}`);
                                });

                                outputPaths.push(outputPath);
                                console.log('Dönüştürme tamamlandı!');
                            } catch (error) {
                                console.error('Dönüştürme hatası:', error);
                                allConverted = false;
                            }
                        }
                }
                await updateJob(job.jobId, 'completed',outputPaths);

                //Acknowledge islemi rabbit in mesaji silmesi  
                channel.ack(msg);


            } catch (err) {
                console.error('[❌] Job processing failed:', err);
            }
        }
    })
}

startConverter().catch((err) => {
  console.error('Worker startup failed:', err);
});