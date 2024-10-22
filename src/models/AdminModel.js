const mongoose = require("mongoose")

const AdminSchema = mongoose.Schema({
    username: {
        type: String,
        required: [true, "Please provide an admin username"]
    },
    permissions: {
        type: [String],
        enum: ["can do this", "can do that"],
        required: ["Please provide admin permissions"]
    },
    adminOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Group"
    }
})

module.exports = mongoose.model("Admin", AdminSchema)
