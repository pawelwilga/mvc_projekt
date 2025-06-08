const Category = require("../models/Category");
const { STATUS_CODE } = require("../constants/statusCode");
const { authenticateToken } = require("./userController");

exports.getCategories = async (request, response) => {

  const userId = request.user._id;

  try {
    const categories = await Category.getAll(userId);
    response.status(STATUS_CODE.OK).json(categories);
  } catch (error) {
    console.error("Error occurred while fetching categories:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve categories" });
  }
};

exports.addCategory = async (request, response) => {
  const { name, description, color } = request.body; 
  const userId = request.user._id;

  if (!name) {
    return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Category name is required." });
  }

  try {
    const existingCategory = await Category.findByName(name, userId);
    if (existingCategory) {
      return response.status(STATUS_CODE.CONFLICT).json({ message: "Category with this name already exists for this user." });
    }

    
    const newCategory = { name, userId, description: description || null, color: color || null };
    const insertedId = await Category.add(newCategory);

    if (insertedId) {
      response.status(STATUS_CODE.CREATED).json({ message: "Category added successfully", _id: insertedId, category: { name, userId, description, color } });
    } else {
      response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to add category." });
    }
  } catch (error) {
    console.error("Error occurred while adding category:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to add category" });
  }
};

exports.getCategory = async (request, response) => {
  const { id } = request.params;
  const userId = request.user._id;

  try {
    const category = await Category.findById(id, userId);
    if (category) {
      response.status(STATUS_CODE.OK).json(category);
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Category not found or does not belong to the user." });
    }
  } catch (error) {
      console.error("Error occurred while fetching category by ID:", error);
      response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve category" });
  }
};

exports.updateCategory = async (request, response) => {
  const { id } = request.params;
  const { name, description, color } = request.body; 
  const userId = request.user._id;

  if (!name && !description && !color) { 
    return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "At least one field (name, description, or color) is required for update." });
  }

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (color !== undefined) updates.color = color;


  try {
    
    if (name !== undefined) {
      const existingCategory = await Category.findByName(name, userId);
      if (existingCategory && existingCategory._id.toString() !== id) {
        return response.status(STATUS_CODE.CONFLICT).json({ message: "Another category with this name already exists for this user." });
      }
    }

    const updated = await Category.updateById(id, userId, updates);
    if (updated) {
      response.status(STATUS_CODE.OK).json({ message: "Category updated successfully" });
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Category not found or not updated (perhaps no changes, or it does not belong to the user)." });
    }
  } catch (error) {
    console.error("Error occurred while updating category by ID:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to update category" });
  }
};

exports.deleteCategory = async (request, response) => {
  const { id } = request.params;
  const userId = request.user._id;

  try {
    const deleted = await Category.deleteById(id, userId);
    if (deleted) {
      response.status(STATUS_CODE.OK).json({ message: "Category deleted successfully" });
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Category not found or not deleted (perhaps it does not belong to the user)." });
    }
  } catch (error) {
    console.error("Error occurred while deleting category by ID:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete category" });
  }
};