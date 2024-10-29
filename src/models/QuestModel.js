import mongoose from "mongoose";

const QuestSchema = mongoose.Schema({
    questKey: {
        type: String,
        required: true,
        unique: true
    },
    questTitle: {
        type: String,
        required: [true, "Please provide quest name"]
    },
    prerequisite: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest",
        default: null
    }],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }]
});

export default mongoose.model("Quest", QuestSchema);
