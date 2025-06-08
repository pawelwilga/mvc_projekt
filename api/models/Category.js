const { getDatabase } = require("../database");
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = "categories";

class Category {
  constructor(name, userId, description = null, color = null) { 
    this.name = name;
    this.userId = userId;
    this.description = description; 
    this.color = color;           
  }

  static async getAll(userId) {
    const db = getDatabase();
    try {
      const categories = await db.collection(COLLECTION_NAME).find({ userId: new ObjectId(userId) }).toArray();
      return categories;
    } catch (error) {
      console.error("Error occurred while searching for all categories:", error);
      return [];
    }
  }

  static async add(category) {
    const db = getDatabase();
    try {
      
      const categoryToSave = { ...category, userId: new ObjectId(category.userId) };
      const result = await db.collection(COLLECTION_NAME).insertOne(categoryToSave);
      return result.insertedId;
    } catch (error) {
      console.error("Error occurred while adding category:", error);
      return null;
    }
  }

  static async findById(id, userId) {
    const db = getDatabase();
    try {
      const searchedCategory = await db
        .collection(COLLECTION_NAME)
        .findOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
      return searchedCategory;
    } catch (error) {
      console.error("Error occurred while searching category by ID:", error);
      return null;
    }
  }

  static async findByName(name, userId) {
    const db = getDatabase();
    try {
      const searchedCategory = await db
        .collection(COLLECTION_NAME)
        .findOne({ name: name, userId: new ObjectId(userId) });
      return searchedCategory;
    } catch (error) {
      console.error("Error occurred while searching category by name:", error);
      return null;
    }
  }

  static async updateById(id, userId, updates) { 
    const db = getDatabase();
    try {
      const result = await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(id), userId: new ObjectId(userId) },
        { $set: updates } 
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error("Error occurred while updating category by ID:", error);
      return false;
    }
  }

  static async deleteById(id, userId) {
    const db = getDatabase();
    try {
      const result = await db.collection(COLLECTION_NAME).deleteOne({ _id: new ObjectId(id), userId: new ObjectId(userId) });
      return result.deletedCount > 0;
    } catch (error) {
      console.error("Error occurred while deleting category by ID:", error);
      return false;
    }
  }
}

module.exports = Category;