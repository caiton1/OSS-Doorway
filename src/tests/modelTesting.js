import { MongoClient } from "mongodb";
const StudentModel = require("../models/StudentModel")
const HintModel = require("../models/HintModel")

import dotenv from "dotenv";
dotenv.config();

// TODO: implement timer

export class MongoDB {
  constructor() {
    this.uri = process.env.URI;
    this.client = new MongoClient(this.uri);
    this.dbName = "gamificationUpdate";
    this.collectionName = "user_data";
  }

  async connect() {
    try {
      this.db = this.client.db(this.dbName);
      this.collection = this.db.collection(this.collectionName);
      console.log("Mongo DB successfully connected. ");
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
  }

  async closeConnection() {
    try {
      await this.client.close();
    } catch (error) {
      console.error("Error closing MongoDB connection:", error);
    }
  }

  async createGroup(groupname) {

  }

  async createUser(userName) {
    console.log(`Creating user: ${userName}.`);
    try {
        let newUser = new StudentModel({
            username,
        })
        newUser = await newUser.save();
        
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
    const filterQuery = { _id: userData._id };
    const updateQuery = { $set: userData };
    try {
      await this.collection.updateOne(filterQuery, updateQuery, {
        upsert: true,
      });
    } catch (error) {
      console.error("Error updating user data:", error);
    }
  }

  async downloadUserData(user) {
    try {
      // Fetch all points sorted in descending order
      const points = await this.collection
        .find({}, { projection: { '_id': 0, 'user_data.points': 1 } })
        .toArray();
      
      // Map points array to just points values, handling undefined user_data or points
      const sortedPoints = points
        .map(doc => (doc.user_data && doc.user_data.points) || 0) // Fallback to 0 if undefined
        .sort((a, b) => b - a); // Sort in descending order
    
      // Get the specific user
      const userDoc = await this.collection.findOne({ _id: user });
      const userScore = userDoc && userDoc.user_data ? userDoc.user_data.points : null;
    
      if (userDoc) {
        // Find the user's position in the sorted array
        const userPosition = sortedPoints.indexOf(userScore);
        const nextUserScore = userPosition > 0 ? sortedPoints[userPosition - 1] : null; // Previous score in sorted array
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

  async createHint(comment) { //need to distinguish each part
    try {
        // let sequence = 
        // let penalty = 
        // let content =
        let newHint = new HintModel({
            sequence,
            penalty,
            content,
        })
        newHint = await newHint.save();
        
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

  async updateHint(hintData) {
    const filterQuery = { _id: hintData._id };
    const updateQuery = { $set: hintData };
    try {
      this.collectionName = "hint_data";
      await this.collection.updateOne(filterQuery, updateQuery, {
        upsert: true,
      });
    } catch (error) {
      console.error("Error updating hint data:", error);
    }
  }
}

