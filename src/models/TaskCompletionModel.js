const mongoose = require("mongoose")

const TaskCompletionSchema = mongoose.Schema({
    completed: {
        type: Boolean,
        required: [true, "Please provide completion status"]
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
    issueNum: {
        type: Number
    }
})

module.exports = mongoose.model("TaskCompletion", TaskCompletionSchema)