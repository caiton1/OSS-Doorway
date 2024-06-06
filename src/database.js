import { MongoClient } from 'mongodb';

import dotenv from 'dotenv';
dotenv.config();

// TODO: implement timer 

export class MongoDB {
    constructor() {
        this.uri = process.env.URI;
        this.client = new MongoClient(this.uri);
        this.dbName = 'gamification';
        this.collectionName = 'user_data';
    }

    async connect() {
        try {
            this.db = this.client.db(this.dbName);
            this.collection = this.db.collection(this.collectionName);
            console.log("Mongo DB successfully connected. ");
        } catch (error) {
            console.error('Error connecting to MongoDB:', error);
        }
    }

    async closeConnection() {
        try {
            await this.client.close();
        } catch (error) {
            console.error('Error closing MongoDB connection:', error);
        }
    }

    async createUser(userName) {
        console.log(`Creating user: ${userName}.`);
        const newUser = {
            _id: userName,
            user_data: {
                xp: 0,
                points: 0
            }
        };
        try {
            await this.collection.insertOne(newUser);
            return true
        } catch (error) {
            if (error.code === 11000) {
                console.log('User already exists!');
            } else {
                console.error('Error creating user:', error);
            }
            return false;
        }
    }
    async wipeUser(userName) {
        console.log(`Wiping user: ${userName}.`);
        try {
            const result = await this.collection.deleteOne({ _id: userName });
            if (result.deletedCount === 1) {
                console.log('User successfully deleted.');
                return true;
            } else {
                console.log('User not found.');
                return false;
            }
        } catch (error) {
            console.error('Error wiping user:', error);
            return false;
        }
    }
    async updateData(userData) {
        const filterQuery = { _id: userData._id };
        const updateQuery = { $set: userData };
        try {
            await this.collection.updateOne(filterQuery, updateQuery, { upsert: true });
        } catch (error) {
            console.error('Error updating user data:', error);
        }
    }

    async downloadUserData(user) {
        try {
            const userDocument = await this.collection.findOne({ _id: user });
            return userDocument;
        } catch (error) {
            console.error('Error downloading user data:', error);
        }
    }
}
