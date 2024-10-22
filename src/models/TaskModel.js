const mongoose = require("mongoose")

const TaskSchema = mongoose.Schema({
    questId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    desc:{
        type: String,
        required: [true, "please provide a description for the task"]
    },
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
        hintImage: {},
        hintVideo: {},
        hintText: {}
    }],
    responses: [{
        responseImage: {},
        responseVideo: {},
        responseText: {}
    }],
    hintPenalty: {
        type: Number,
        default: 5
    }
})

module.exports = mongoose.model("Task", TaskSchema)