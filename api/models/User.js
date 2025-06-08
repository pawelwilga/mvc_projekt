const { getDatabase } = require("../database");
const { ObjectId } = require('mongodb');
const bcrypt = require('bcrypt'); 

const COLLECTION_NAME = "users";
const SALT_ROUNDS = 10; 

class User {
  constructor(login, password, email, defaultCurrency) {
    this.login = login;
    this.password = password; 
    this.email = email;
    this.defaultCurrency = defaultCurrency;
  }

  static async add(user) {
    const db = getDatabase();
    try {
      
      const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
      const userToSave = { ...user, password: hashedPassword };

      const result = await db.collection(COLLECTION_NAME).insertOne(userToSave);
      return result.insertedId;
    } catch (error) {
      console.error("Error occurred while adding user:", error);
      return null;
    }
  }

  static async findByLogin(login) {
    const db = getDatabase();
    try {
      const user = await db.collection(COLLECTION_NAME).findOne({ login });
      return user;
    } catch (error) {
      console.error("Error occurred while searching user by login:", error);
      return null;
    }
  }

  static async findById(id) {
    const db = getDatabase();
    try {
      const user = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(id) });
      return user;
    } catch (error) {
      console.error("Error occurred while searching user by ID:", error);
      return null;
    }
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  static async updateById(id, updates) {
    const db = getDatabase();
    try {
      
      if (updates.password) {
        updates.password = await bcrypt.hash(updates.password, SALT_ROUNDS);
      }
      const result = await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(id) },
        { $set: updates }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error occurred while updating user by ID:", error);
      return false;
    }
  }

  static async deleteById(id) {
    const db = getDatabase();
    try {
      const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error occurred while deleting user by ID:", error);
      return false;
    }
  }
}

module.exports = User;