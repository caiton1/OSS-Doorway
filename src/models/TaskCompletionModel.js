const mongoose = require("mongoose")

const TaskCompletionSchema = mongoose.Schema({
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Task",
        required: [true, "Please add task to taskCompletion"]
    },
    completed: {
        type: Boolean,
        required: [true, "Please provide completion status for task"]
    },
    attemps: {
        type: Number
    },
    timeStart: {
        type: Date //! not sure this is the accurate data type?
    },
    timeEnd: {
        type: Date
    },
    hintsUsed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Hint"
    }]

    //! ask connor what this is for 
    // issueNum: {
    //     type: Number
    // }
})

module.exports = mongoose.model("TaskCompletion", TaskCompletionSchema)