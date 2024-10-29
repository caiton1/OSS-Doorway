import mongoose from "mongoose";

const TaskSchema = mongoose.Schema({
    taskKey: {
        type: String,
        required: true,
    },
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
    }
});

export default mongoose.model("Task", TaskSchema);
