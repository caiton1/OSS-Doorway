import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import prompt from "prompt-sync";
import { HintModel } from "../models/HintModel.js"; // Correct import


dotenv.config();

export class Hints
{
    constructor() {
        this.uri = process.env.URI;
        this.client = new MongoClient(this.uri);
        this.dbName = "gamification";
        this.collectionName = "hint_data";
        }

        async connect() {
        try {
            await this.client.connect();
            this.db = this.client.db(this.dbName);
            this.collection = this.db.collection(this.collectionName);
            console.log("Mongo DB successfully connected. ");
        } catch (error) {
            console.error("Error connecting to MongoDB:", error);
        }
    }

    async addHint(quest, task, sequence, penalty, content) 
    { 
        try {
            console.log(quest);
            let newHint = new HintModel({
                quest,
                task,
                sequence,
                penalty,
                content,
            });
            console.log(newHint);
            await newHint.save();
            
            return true;
        } catch (error) {
          if (error.code === 11000) {
            console.log("Student already exists!");
          } else {
            console.error("Error creating hint:", error);
          }
          return false;
        }
    }

    async close()
    {
        await this.client.close();
        console.log("MongoDB connection has closed.");
    }

    //! make a get request to test for errors
}

const input = prompt();

(async () => {
    const hint = new Hints();
    await hint.connect();

    //get input
    const quest = input("Enter the Quest ID the hint is for: ");
    const task = input("Enter the Task ID the hint is for: ");
    const sequence = input("Enter the sequence number for the hint: ");
    const penalty = input("Enter the penalty for the hint (default is 0): ");
    const contentText  = input("Enter the text content of the hint: ");
    const contentVideo  = input("Enter the video URL (leave blank if none): ");
    const contentImage = input("Enter the image URL (leave blank if none): ");

    // Update quest and task to only ask for the quest in the form 'Q1' 
    // then do a db search for a quest with that name

    const content = {
        text: contentText,
        video: contentVideo || undefined, // Set to undefined if blank
        image: contentImage || undefined, // Set to undefined if blank
    };

    const success = await hint.addHint(quest, task, parseInt(sequence, 10), parseInt(penalty, 10), content);

    if (success) {
        console.log("Hint added successfully!");
    } else {
        console.log("Failed to add hint.");
    }

    await hint.close();
})();




