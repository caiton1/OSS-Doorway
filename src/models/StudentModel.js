const mongoose = require("mongoose")

const StudentSchema = mongoose.Schema({
    username:{
        type:String,
        required: [true, "User does not have a username"]
    },
    user_data:{
        xp:{
            type: Number,
            default: 0
        },
        points:{
            type: Number,
            default: 0
        },
        completion:{
            type: Number,
            default: 0
        },
        streakCount:{
            type: Number,
            default: 0
        },
        currentStreak:{
            type: Number,
            default: 0
        },
        completed:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "QuestCompletion"
        },
        accepted: QuestCompletionSchema,
        current: {
            quest: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Quest"
            },
            task:{
                type: mongoose.Schema.Types.ObjectId,
                ref: "Task"
            }
        }
    },
    groupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }
})

module.exports = mongoose.model("Student", StudentSchema)
