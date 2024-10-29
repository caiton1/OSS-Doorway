const mongoose = require("mongoose");

const QuestSchema = mongoose.Schema({
    questTitle: {
        type: String,
        required: [true, "Please provide quest name"]
    },
    prerequisite: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest",
        default: null
    }],
    tasks: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    }
})

module.exports = mongoose.model("Quest", QuestSchema)
