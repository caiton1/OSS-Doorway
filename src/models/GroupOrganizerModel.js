import mongoose from "mongoose";

const GroupOrganizerSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "Group needs an owner"]
    },
    ownedGroups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }]
})

export default mongoose.model("GroupOrganizer", GroupOrganizerSchema)