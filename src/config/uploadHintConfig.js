import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import QuestModel from "../models/QuestModel.js";
import TaskModel from "../models/TaskModel.js";
import HintModel from "../models/HintModel.js";

dotenv.config();

const { URI, DB_NAME } = process.env;

async function uploadHints() {
  try {
    await mongoose.connect(URI, {
      dbName: DB_NAME,
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to the database");

    const hintConfig = JSON.parse(fs.readFileSync("./src/config/hint_config.json", "utf-8"));

    //          key     , value
    for (const [questKey, tasks] of Object.entries(hintConfig)) {
      const quest = await QuestModel.findOne({ questKey });
      if (!quest) {
        console.log(`Quest with key ${questKey} not found.`);
        continue;
      }

      for (const [taskKey, hints] of Object.entries(tasks)) {
        const task = await TaskModel.findOne({ taskKey });
        if (!task) {
          console.log(`Task with key ${taskKey} not found.`);
          continue;
        }

        for (const [hintKey, hintData] of Object.entries(hints)) {
          try {
            const hint = new HintModel({
              quest: quest._id,
              task: task._id,
              temporaryID: `${questKey}${taskKey}`,
              sequence: hintData.sequence,
              penalty: hintData.penalty || 0,
              content: hintData.content,
              image: hintData.image,
              video: hintData.video
            });

            await hint.save();
            console.log(
              `Saved hint ${hintKey} for task ${taskKey} in quest ${questKey}`
            );
          } catch (hintError) {
            console.error(
              `Error saving hint ${hintKey} for task ${taskKey}:`,
              hintError
            );
          }
        }
      }
    }

    console.log("All hints uploaded successfully.");
  } catch (error) {
    console.error("Failed to upload hints:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from the database");
  }
}

uploadHints();
