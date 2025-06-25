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

async function startSplit(params) {
    await connectMongoDB();

        const connection = await amqp.connect('amqp://localhost');
        const channel = await connection.createChannel();
    
        await channel.assertQueue('pdf_split_queue',{
            durable: true,
        });
    
        console.log(`[✔] Worker listening on pdf_split_queue...`);
    
        await channel.prefetch(1);

        channel.consume('pdf_split_queue', async(msg) => {
            if(msg!=null){
                try {
                    const job = JSON.parse(msg.content.toString());
                    console.log('[➡] Job received:', job)

                    await updateJob(job.jobId, 'processing');

                    const inputDir = path.dirname(job.inputPaths[0]);
                    const uniqueName = `${'donoSplited'}-${uuidv4()}`;
                    const outputPath = path.join(inputDir, `${uniqueName}.pdf`);

                    const inputBytes = fs.readFileSync(job.inputPaths[0]);
                    const inputPdf = await PDFDocument.load(inputBytes);
                    const totalPages = inputPdf.getPageCount();

                    const start = Math.max(0,job.splitStart - 1);
                    const end = Math.min(job.splitEnd-1, totalPages -1);

                    if(start > end)
                        throw new Error('❌ Başlangıç sayfası bitişten büyük olamaz.');

                    const newPdf = await PDFDocument.create();

                    for (let i = start; i <= end; i++) {
                        const [copiedPage] = await newPdf.copyPages(inputPdf, [i]);
                        newPdf.addPage(copiedPage);
                    }

                    const newBytes = await newPdf.save();
                    fs.writeFileSync(outputPath, newBytes);

                    console.log(`✅ Sayfalar ${start} - ${end} arası çıkarıldı: ${outputPath}`);

                    await updateJob(job.jobId, 'completed',outputPath);
                    channel.ack(msg);

                } catch (error) {
                    console.error('[❌] Job processing failed:', error);
                }
            }
        });
};

startSplit().catch((err) => {
  console.error('Worker startup failed:', err);
});