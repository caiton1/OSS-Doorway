import mongoose from "mongoose";

const GroupSchema = mongoose.schema({
    groupName:{
        type: String,
        required: [true, "Group has no name"]
    },
    members:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],
    admin:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Student"
    }],
    organizer:{
        //describes teacher/professor/organization/etc...
        type: mongoose.Schema.Types.ObjectId,
        ref: "GroupOrganizer"
    },
    quests:[{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    }]
})

export default mongoose.model("Group", GroupSchema)