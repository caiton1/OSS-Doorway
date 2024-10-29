const mongoose = require("mongoose")

const HintSchema = mongoose.Schema({
    quest:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    sequence:{
        type: Number,
        required: [true, "Please provide a sequence for the hint"]
    },
    penalty: {
        type: Number,
        default: 0
    },
    content: {
        video:{},
        text:{},
        image:{}
    }
})

module.exports = mongoose.model("Hint", HintSchema)