const mongoose = require("mongoose")


const TaskSchema = mongoose.Schema({
    taskTitle: {
        type: String,
        required: [true, "Please provide a task title"]
    },
    questId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    desc:{
        type: String,
        required: [true, "Please provide a description for the task"]
    },
    points:{
        type: Number,
        required: [true, "Please provide the number of points for this task"]
    },
    xp:{
        type: Number,
        required: [true, "Please provide the xp for this task"]
    },
    hints: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hint"
    }],
    responses: {
        accept: {
            type: String,
            required: [true, "Response must include 'accept' case"]
        },
        error: {
            type: String,
            required: [true, "Response must include 'error' case"],
        },
        success: {
            type: String,
            required: [true, "Response must include 'success' case"]
        }
    },
    answer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Answer"
    }
})

module.exports = mongoose.model("Task", TaskSchema)


//xp stays linear you cant subtract
// used to calculate level

//points is currency
// can be used to pay for hints

