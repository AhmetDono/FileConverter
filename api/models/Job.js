const mongoose = require('mongoose');

const jobSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    operation:{
        type: String,
        enum: ['convert', 'merge', 'split'],
        required: true
    },
    originalFileNames:[{
        type: String
    }],
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    outputPaths: [{
        type: String
    }],
    splitStart:{
        type:Number,
    },
    splitEnd:{
        type:Number,
    },
},{ timestamps: true });

module.exports = mongoose.model("Job",jobSchema);