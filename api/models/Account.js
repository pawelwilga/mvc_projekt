const { getDatabase } = require("../database");
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = "accounts";

class Account {
  constructor(name, balance, currency, ownerId, accountNumber = null, description = null, type = 'personal', sharedWith = []) {
    this.name = name;
    this.balance = balance; 
    this.currency = currency;
    this.ownerId = ownerId; 
    this.accountNumber = accountNumber; 
    this.description = description;   
    this.type = type;                 
    
    this.sharedWith = sharedWith;
  }

  
  static _convertSharedWithUserIds(sharedWithArray) {
    if (!Array.isArray(sharedWithArray)) return [];
    return sharedWithArray.map(item => ({
      userId: new ObjectId(item.userId),
      accessLevel: item.accessLevel 
    }));
  }

  static async getAll(userId) {
    const db = getDatabase();
    try {
      
      const accounts = await db.collection(COLLECTION_NAME).find({
        $or: [
          { ownerId: new ObjectId(userId) },
          { "sharedWith.userId": new ObjectId(userId) }
        ]
      }).toArray();
      return accounts;
    } catch (error) {
      console.error("Error occurred while searching for all accounts:", error);
      return [];
    }
  }

  static async add(account) {
    const db = getDatabase();
    try {
      const accountToSave = {
        ...account,
        ownerId: new ObjectId(account.ownerId),
        sharedWith: Account._convertSharedWithUserIds(account.sharedWith)
      };
      const result = await db.collection(COLLECTION_NAME).insertOne(accountToSave);
      return result.insertedId;
    } catch (error) {
      console.error("Error occurred while adding account:", error);
      return null;
    }
  }

  static async findById(id, userId) {
    const db = getDatabase();
    try {
      
      const account = await db.collection(COLLECTION_NAME).findOne({
        _id: new ObjectId(id),
        $or: [
          { ownerId: new ObjectId(userId) },
          { "sharedWith.userId": new ObjectId(userId) }
        ]
      });
      return account;
    } catch (error) {
      console.error("Error occurred while searching account by ID:", error);
      return null;
    }
  }

  static async updateById(id, userId, updates) {
    const db = getDatabase();
    try {
      
      const updateDoc = {};
      if (updates.name !== undefined) updateDoc.name = updates.name;
      if (updates.balance !== undefined) updateDoc.balance = updates.balance;
      if (updates.currency !== undefined) updateDoc.currency = updates.currency;
      if (updates.accountNumber !== undefined) updateDoc.accountNumber = updates.accountNumber;
      if (updates.description !== undefined) updateDoc.description = updates.description;
      if (updates.type !== undefined) updateDoc.type = updates.type;

      const result = await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(id), ownerId: new ObjectId(userId) },
        { $set: updateDoc }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error occurred while updating account by ID:", error);
      return false;
    }
  }

  static async deleteById(id, userId) {
    const db = getDatabase();
    try {
      
      const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id), ownerId: new ObjectId(userId) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error occurred while deleting account by ID:", error);
      return false;
    }
  }

  
  static async addSharedUser(accountId, ownerId, sharedUserId, accessLevel) {
    const db = getDatabase();
    try {
      
      const result = await db.collection(COLLECTION_NAME).updateOne(
        {
          _id: new ObjectId(accountId),
          ownerId: new ObjectId(ownerId),
          "sharedWith.userId": { $ne: new ObjectId(sharedUserId) } 
        },
        { $push: { sharedWith: { userId: new ObjectId(sharedUserId), accessLevel: accessLevel } } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error occurred while adding shared user to account:", error);
      return false;
    }
  }

  static async updateSharedUserAccess(accountId, ownerId, sharedUserId, newAccessLevel) {
    const db = getDatabase();
    try {
      
      const result = await db.collection(COLLECTION_NAME).updateOne(
        {
          _id: new ObjectId(accountId),
          ownerId: new ObjectId(ownerId),
          "sharedWith.userId": new ObjectId(sharedUserId)
        },
        { $set: { "sharedWith.$.accessLevel": newAccessLevel } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error occurred while updating shared user access level:", error);
      return false;
    }
  }

  static async removeSharedUser(accountId, ownerId, sharedUserId) {
    const db = getDatabase();
    try {
      
      const result = await db.collection(COLLECTION_NAME).updateOne(
        {
          _id: new ObjectId(accountId),
          ownerId: new ObjectId(ownerId)
        },
        { $pull: { sharedWith: { userId: new ObjectId(sharedUserId) } } }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error occurred while removing shared user from account:", error);
      return false;
    }
  }

  
  static getAccessLevel(account, userId) {
    if (account.ownerId.equals(new ObjectId(userId))) {
      return 'owner';
    }
    const sharedEntry = account.sharedWith.find(entry => entry.userId.equals(new ObjectId(userId)));
    return sharedEntry ? sharedEntry.accessLevel : null;
  }
}

module.exports = Account;