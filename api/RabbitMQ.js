const amqp = require('amqplib');

let channel;

async function connectRabbit() {
    const connetion  = await amqp.connect('amqp://localhost');
    channel = await connetion.createChannel();

    //Queue tanimlama 
    await channel.assertQueue('pdf_convert_queue',{
        durable:true
    });

    await channel.assertQueue('pdf_merge_queue',{
        durable:true
    });

    await channel.assertQueue('pdf_merge_split',{
        durable:true
    })

    console.log("✅ RabbitMQ connected & queue ready."); 
};

function sendToConvertQueue(data){
    channel.sendToQueue('pdf_convert_queue',Buffer.from(JSON.stringify(data)),{
        persistent:true
    });
};

function sendToMergeQueue(data){
    channel.sendToQueue('pdf_merge_queue', Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

function sendToSplitQueue(data) {
    channel.sendToQueue('pdf_split_queue', Buffer.from(JSON.stringify(data)), {
        persistent: true
    });
}

module.exports = {
    connectRabbit,
    sendToConvertQueue,
    sendToMergeQueue,
    sendToSplitQueue,
};