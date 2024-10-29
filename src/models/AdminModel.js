import mongoose from "mongoose";

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

export default mongoose.model("Admin", AdminSchema)
