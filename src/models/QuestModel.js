const mongoose = require("mongoose");

const QuestSchema = mongoose.Schema({
    metaData:{
        title: {
            type: String,
            required: [true, "Please provide quest name"]
        },
        prerequisite: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Quest",
            default: null
        }
    },
    tasks: {
        type: Map,
        of: TaskSchema
    }
})

module.exports = mongoose.model("Quest", QuestSchema)

//! Example of adding a new quest from ChatGPT:
// const newQuest = new Quest({
//     metaData: {
//         title: "Exploring the GitHub World",
//         prerequisite: null // No prerequisite // added default: null so i dont believe this is necessary !
//     },
//     tasks: new Map([
//         ["T1", { desc: "Explore the issue tracker", points: 20, xp: 20 }],
//         ["T2", { desc: "Create a pull request", points: 30, xp: 30 }]
//     ])
// });
// (and then we have to save it to the db)