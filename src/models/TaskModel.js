const mongoose = require("mongoose")


//!handle the case of images or videos being in here
const TaskSchema = mongoose.Schema({
    questId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    desc:{
        type: String,
        required: [true, "please provide a description for the task"]
    },
    //! difference between points and xp
    points:{
        type: Number,
        required: [true, "Please provide the number of points for this task"]
    },
    xp:{
        type: Number,
        required: [true, "Please provide the xp for this task"]
    },
    //! would like some feedback on the hint and response bit below
    hints: [{
        type: Map,
        of: HintSchema
    }],
    responses: [{
        responseImage: {},
        responseVideo: {},
        responseText: {}
    }],
    //! make this a part of the hint model
    hintPenalty: {
        type: Number,
        default: 5
    },
    //!
    answer: {}
})

module.exports = mongoose.model("Task", TaskSchema)