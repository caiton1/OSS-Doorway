import mongoose from "mongoose";
import fs from "fs";
import dotenv from "dotenv"; // NOTE: assume execution from directory with .env 
import Quest from "../models/QuestModel.js"; 
import Task from "../models/TaskModel.js";

dotenv.config();

// connect
async function connectToDatabase() {
  try {
    await mongoose.connect(`${process.env.URI}/${process.env.DB_NAME}`, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("Database connected successfully");
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1); // fail code
  }
}


// parse
async function parseAndUploadData() {
  const questConfig = JSON.parse(fs.readFileSync("./src/config/quest_config.json", "utf-8"));
  const responseConfig = JSON.parse(fs.readFileSync("./src/config/response.json", "utf-8"));

  for (const questKey in questConfig) {
      if (questKey === "oss_repo" || questKey === "map_repo_link") {
          continue;
      }
      console.log(questKey);
      const questData = questConfig[questKey];

      // Find prerequisite by quest ID
      let prerequisiteId = null;
      if (questData.metadata.prerequisite) {
          const prerequisiteQuest = await Quest.findOne({ questKey: questData.metadata.prerequisite });
          if (prerequisiteQuest) {
              prerequisiteId = prerequisiteQuest._id;
          } else {
              console.warn(`Prerequisite quest titled '${questData.metadata.prerequisite}' not found.`);
          }
      }

      // Create Quest document
      let quest;
      try {
          quest = new Quest({
              questKey: questKey,
              questTitle: questData.metadata.title,
              prerequisite: prerequisiteId ? [prerequisiteId] : [],
          });
          await quest.save();
      } catch (err) {
          if (err.code === 11000) {
              console.warn(`Duplicate Quest detected: ${questKey}, skipping.`);
              quest = await Quest.findOne({ questKey: questKey }); // Retrieve existing quest
          } else {
              throw err;
          }
      }

      // Process Tasks
      for (const taskKey in questData) {
          if (taskKey.startsWith("T")) { // Ensure it's a task
              const taskData = questData[taskKey];
              const responseData = responseConfig[questKey]?.[taskKey];

              if (responseData) {
                  try {
                      const task = new Task({
                          taskKey: taskKey,
                          taskTitle: taskData.desc,
                          questId: quest._id,
                          desc: taskData.desc,
                          points: taskData.points,
                          xp: taskData.xp,
                          responses: {
                              accept: responseData.accept,
                              error: responseData.error,
                              success: responseData.success
                          }
                      });
                      await task.save();
                      quest.tasks.push(task._id); // Add task ID to quest
                  } catch (err) {
                      if (err.code === 11000) {
                          console.warn(`Duplicate Task detected: ${taskKey}, skipping.`);
                      } else {
                          throw err;
                      }
                  }
              } else {
                  console.warn(`No response data found for ${questKey} ${taskKey}`);
              }
          }
      }

      // Save the quest with updated tasks
      try {
          await quest.save();
      } catch (err) {
          console.error(`Error updating quest ${questKey}:`, err);
      }
  }

  console.log("Data parsing and upload completed.");
}
  

// execute
async function main() {
  await connectToDatabase(); 
  await parseAndUploadData(); 
  mongoose.disconnect(); 
}

// main
main().catch(err => {
  console.error("Error in main execution:", err);
  mongoose.disconnect(); 
});
