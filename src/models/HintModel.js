const mongoose = require("mongoose")

//! HINT video type/image type/text type command that students can run to choose
//! on hint creation- hints can be defined as either video, image, or text


//! hints have video, image, and text attributes and those can be customized
//!hints are split to sections: quest completion, current progress, hints used, etc
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