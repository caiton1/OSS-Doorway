import { MongoClient } from "mongodb";
import Quest from "./models/QuestModel.js";
import Task from "./models/TaskModel.js";
import Hint from "./models/HintModel.js";

import fs from "fs";
import readline from "readline"
import dotenv from "dotenv";
dotenv.config();

const askQuestion = (query) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => rl.question(query, (ans) => { rl.close(); resolve(ans); }));
};

export class MongoDB {
  constructor() {
    // Check if URI and DB_NAME are already in environment variables
    this.uri = process.env.URI;
    this.dbName = process.env.DB_NAME;
    this.collectionName = "user_data";

    // Check for missing env variables
    if (!this.uri || !this.dbName) {
      console.log("❗ Missing required environment variables: URI or DB_NAME.");
    }

    // Initialize MongoClient only if URI and DB_NAME exist in env
    if (this.uri && this.dbName) {
      this.client = new MongoClient(this.uri);
    }
  }

  // Method to check and prompt for missing env variables
  async checkAndSetupEnv() {
    let updatedEnv = false;

    // Prompt for MongoDB URI if not set in env
    if (!this.uri) {
      this.uri = await askQuestion("Enter your MongoDB URI: ");
      updatedEnv = true;
    }

    // Prompt for DB_NAME if not set in env
    if (!this.dbName) {
      this.dbName = await askQuestion("Enter your MongoDB Database Name: ");
      updatedEnv = true;
    }

    // If any values were provided, save them to .env
    if (updatedEnv) {
      const envContent = `\n
URI="${this.uri}"
DB_NAME="${this.dbName}"
      `.trim() + "\n";

      fs.appendFileSync(".env", envContent);
      console.log("\n✅ MongoDB configuration saved to .env file!");
    }

    // Now initialize MongoClient after env is set
    this.client = new MongoClient(this.uri);
  }

  // Connect to MongoDB
  async connect() {
    try {
      // Ensure MongoClient is initialized after checkAndSetupEnv
      if (!this.client) {
        await this.checkAndSetupEnv(); // Ensure client is initialized
      }

      // Connect to MongoDB and access the database/collection
      this.db = this.client.db(this.dbName);
      this.collection = this.db.collection(this.collectionName);

      console.log("✅ MongoDB successfully connected.\n");
    } catch (error) {
      console.error("❌ Error connecting to MongoDB:\n", error);
    }
  }

  async closeConnection() {
    try {
      await this.client.close();
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }

  async createUser(userName) {
    console.log(`Creating user: ${userName}.`);
    const newUser = {
      _id: userName,
      user_data: {
        xp: 0,
        points: 0,
      },
    };
    try {
      await this.collection.insertOne(newUser);
      return true;
    } catch (error) {
      if (error.code === 11000) {
        console.log("User already exists!");
      } else {
        console.error("Error creating user:", error);
      }
      return false;
    }
  }
  async wipeUser(userName) {
    console.log(`Wiping user: ${userName}.`);
    try {
      const result = await this.collection.deleteOne({ _id: userName });
      if (result.deletedCount === 1) {
        console.log("User successfully deleted.");
        return true;
      } else {
        console.log("User not found.");
        return false;
      }
    } catch (error) {
      console.error("Error wiping user:", error);
      return false;
    }
  }

  async updateData(userData) {
    if (!userData || !userData._id) {
      console.error("Invalid user data. _id cannot be null or undefined.");
      return;
    }

    const filterQuery = { _id: userData._id };
    const updateQuery = { $set: userData };

    try {
      await this.collection.updateOne(filterQuery, updateQuery, {
        upsert: true, // This will create a new user if not found
      });
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  }

  async downloadUserData(user) {
    try {
      // Fetch all points sorted in descending order
      const points = await this.collection
        .find({}, { projection: { _id: 0, "user_data.points": 1 } })
        .toArray();

      // Map points array to just points values, handling undefined user_data or points
      const sortedPoints = points
        .map((doc) => (doc.user_data && doc.user_data.points) || 0) // Fallback to 0 if undefined
        .sort((a, b) => b - a); // Sort in descending order

      // Get the specific user
      const userDoc = await this.collection.findOne({ _id: user });
      const userScore =
        userDoc && userDoc.user_data ? userDoc.user_data.points : null;

      if (userDoc) {
        // Find the user's position in the sorted array
        const userPosition = sortedPoints.indexOf(userScore);
        const nextUserScore =
          userPosition > 0 ? sortedPoints[userPosition - 1] : null; // Previous score in sorted array
        const maxUserScore = sortedPoints[0]; // Highest score

        // Add additional properties to the userDoc
        userDoc.userPosition = userPosition + 1; // Adjust for 1-based index
        userDoc.nextUserScore = nextUserScore;
        userDoc.maxUserScore = maxUserScore;
      }

      return userDoc; // Return the user document with additional fields
    } catch (error) {
      console.error("Error downloading user data:", error);
    }
  }

  async userExists(userName) {
    try {
      const userDocument = await this.collection.findOne({ _id: userName });
      return userDocument !== null;
    } catch (error) {
      console.error("Error checking if user exists:", error);
      return false;
    }
  }

  async findHintResponse(questKey, taskKey, sequence) {
    try {
      const tempID = questKey + taskKey;
      var response = ""
      const hints = await Hint.find({ temporaryID: tempID, sequence: sequence });
      if (hints.length > 0) {
        if (hints[0].image != null) {
          response = hints[0].content + `\n![image](${hints[0].image})`
        }
        else {
          response = hints[0].content
        }
        return response;
      } else {
        return null;
      }
    } catch (error) {
      console.error("Error finding hint response:", error);
      return null;
    }
  }

  async findTaskResponse(questKey, taskKey) {
    try {
      const quest = await Quest.findOne({ questKey }).populate("tasks");
      if (!quest) {
        throw new Error(`Quest with questKey ${questKey} not found`);
      }

      const task = await Task.findOne({ questId: quest._id, taskKey });
      if (!task) {
        throw new Error(
          `Task with taskKey ${taskKey} not found in Quest ${questKey}`
        );
      }
      return task.responses;
    } catch (error) {
      console.error("Error finding task response:", error);
    }
  }
}
