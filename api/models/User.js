const mongoose = require('mongoose');


const userSchema = mongoose.Schema({
    userName:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        reuqired:true,
        trim:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
        trim:true
    },
    roles:{
        type: [String],
        default: ['user']
    },
},{ timestamps: true });

module.exports = mongoose.model("User",userSchema);