const mongoose = require('mongoose')

const AnswerSchema = new mongoose.Schema({
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref: Task
    },
    content:{
        type: String
    }
})

module.exports = mongoose.model("Answer", AnswerSchema)