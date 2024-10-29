//const mongoose = require("mongoose")
import mongoose from "mongoose";


const HintSchema = mongoose.Schema({
    quest:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Quest"
    },
    task:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task"
    },
    sequence:{
        type: Number,
        required: [true, "Please provide a sequence for the hint"]
    },
    penalty: {
        type: Number,
        default: 0
    },
    content: {
        video:{},
        text:{},
        image:{}
    }
})

// At the end of HintModel.js
export const HintModel = mongoose.model("Hint", HintSchema);

