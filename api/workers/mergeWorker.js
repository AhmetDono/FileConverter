const amqp = require('amqplib');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument } = require('pdf-lib');
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


async function startMerge(){
    await connectMongoDB();

    const connection = await amqp.connect('amqp://localhost');
    const channel = await connection.createChannel();

    await channel.assertQueue('pdf_merge_queue',{
        durable: true,
    });

    console.log(`[✔] Worker listening on pdf_merge_queue...`);

    await channel.prefetch(1);

    channel.consume('pdf_merge_queue',async(msg) => {
        if(msg!=null){
            try {
                const job = JSON.parse(msg.content.toString());
                console.log('[➡] Job received:', job)

                await updateJob(job.jobId, 'processing');

                const inputDir = path.dirname(job.inputPaths[0]);
                const uniqueName = `${'donoMerged'}-${uuidv4()}`;
                const outputPath = path.join(inputDir, `${uniqueName}.pdf`);

                const mergedPdf = await PDFDocument.create();

                for (const inputPath of job.inputPaths) {
                    const pdfBytes = fs.readFileSync(inputPath);
                    const pdf = await PDFDocument.load(pdfBytes);
                    const copiedPages = await mergedPdf.copyPages(pdf,pdf.getPageIndices());

                    copiedPages.forEach(page => mergedPdf.addPage(page));
                }

                const mergedPdfBytes = await mergedPdf.save();
                fs.writeFileSync(outputPath,mergedPdfBytes);

                console.log(`✅ Merged PDF created: ${outputPath}`);

                await updateJob(job.jobId, 'completed',outputPath);
                channel.ack(msg);
                    
            } catch (error) {
                console.error('[❌] Job processing failed:', error);
            }
        }
    })
}

startMerge().catch((err) => {
  console.error('Worker startup failed:', err);
});