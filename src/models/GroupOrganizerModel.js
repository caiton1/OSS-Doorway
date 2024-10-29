const mongoose = require("mongoose")

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

module.exports = mongoose.model("GroupOrganizer", GroupOrganizerSchema)