import mongoose from "mongoose";

const AnswerSchema = new mongoose.Schema({
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref: Task
    },
    content:{
        type: String
    }
})

export default mongoose.model("Answer", AnswerSchema)