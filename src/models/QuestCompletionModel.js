const mongoose = require("mongoose")

const QuestCompletionSchema = mongoose.Schema({
    quest: {
        type: mongoose.Schema.Types.ObjectId,
        ref:"Quest",
        required: [true, "Please add quest to questCompletion"]
    },
    tasks: {
        type: Map,
        of: TaskCompletionSchema
    }
})

module.exports = mongoose.model("QuestCompletion", QuestCompletionSchema)