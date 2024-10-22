const mongoose = require("mongoose")

const GroupOrganizerSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "Group needs an owner"]
    },
    ownedGroups: [{
        type: Map,
        of: GroupSchema
    }]
})

module.exports = mongoose.model("GroupOrganizer", GroupOrganizerSchema)