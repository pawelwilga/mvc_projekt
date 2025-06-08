const User = require("../models/User");
const jwt = require('jsonwebtoken'); 
const { STATUS_CODE } = require("../constants/statusCode");


exports.authenticateToken = (request, response, next) => {
  const authHeader = request.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    return response.status(STATUS_CODE.UNAUTHORIZED).json({ message: "No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "Invalid or expired token." });
    }
    request.user = user; 
    next(); 
  });
};

exports.registerUser = async (request, response) => {
  const { login, password, email, defaultCurrency } = request.body;

  if (!login || !password || !email) {
    return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Login, password, and email are required." });
  }

  try {
    const existingUser = await User.findByLogin(login);
    if (existingUser) {
      return response.status(STATUS_CODE.CONFLICT).json({ message: "User with this login already exists." });
    }

    const newUser = { login, password, email, defaultCurrency: defaultCurrency || "PLN" };
    const insertedId = await User.add(newUser);

    if (insertedId) {
      response.status(STATUS_CODE.CREATED).json({ message: "User registered successfully", _id: insertedId });
    } else {
      response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to register user." });
    }
  } catch (error) {
    console.error("Error occurred during user registration:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to register user." });
  }
};

exports.loginUser = async (request, response) => {
  const { login, password } = request.body;

  if (!login || !password) {
    return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Login and password are required." });
  }

  try {
    const user = await User.findByLogin(login);
    if (!user) {
      return response.status(STATUS_CODE.UNAUTHORIZED).json({ message: "Invalid credentials." });
    }

    const isPasswordValid = await User.verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return response.status(STATUS_CODE.UNAUTHORIZED).json({ message: "Invalid credentials." });
    }

    
    const token = jwt.sign(
      { _id: user._id, login: user.login, email: user.email }, 
      process.env.JWT_SECRET, 
      { expiresIn: '1h' } 
    );

    response.status(STATUS_CODE.OK).json({ message: "Login successful", token: token, user: { _id: user._id, login: user.login, email: user.email, defaultCurrency: user.defaultCurrency } });
  } catch (error) {
    console.error("Error occurred during user login:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to log in." });
  }
};


exports.getUserProfile = async (request, response) => {
  
  const userId = request.user ? request.user._id : request.params.id; 

  try {
    const user = await User.findById(userId);
    if (user) {
      const { password, ...userWithoutPassword } = user;
      response.status(STATUS_CODE.OK).json(userWithoutPassword);
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "User not found" });
    }
  } catch (error) {
    console.error("Error occurred while fetching user profile:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve user profile" });
  }
};


exports.updateUserProfile = async (request, response) => {
  
  const userId = request.user ? request.user._id : request.params.id;
  const updates = request.body;

  try {
    const updated = await User.updateById(userId, updates);
    if (updated) {
      response.status(STATUS_CODE.OK).json({ message: "User profile updated successfully" });
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "User not found or not updated" });
    }
  } catch (error) {
    console.error("Error occurred while updating user profile:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to update user profile" });
  }
};

exports.deleteUser = async (request, response) => {
  
  const userId = request.user ? request.user._id : request.params.id;

  try {
    const deleted = await User.deleteById(userId);
    if (deleted) {
      response.status(STATUS_CODE.OK).json({ message: "User deleted successfully" });
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "User not found or not deleted" });
    }
  } catch (error) {
    console.error("Error occurred while deleting user:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete user" });
  }
};