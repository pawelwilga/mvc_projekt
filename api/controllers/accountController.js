const Account = require("../models/Account");
const User = require("../models/User"); 
const { STATUS_CODE } = require("../constants/statusCode");
const { authenticateToken } = require("./userController"); 

exports.authenticateToken = authenticateToken; 


const canWrite = (accessLevel) => accessLevel === 'owner' || accessLevel === 'full';

exports.getAccounts = async (request, response) => {
  const userId = request.user._id;

  try {
    const accounts = await Account.getAll(userId);
    response.status(STATUS_CODE.OK).json(accounts);
  } catch (error) {
    console.error("Error occurred while fetching accounts:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve accounts" });
  }
};

exports.addAccount = async (request, response) => {
  const { name, balance, currency, accountNumber, description, type } = request.body;
  const ownerId = request.user._id;

  if (!name || balance === undefined || !currency) {
    return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Name, balance, and currency are required." });
  }

  try {
    
    

    const newAccount = {
      name,
      balance,
      currency,
      ownerId,
      accountNumber: accountNumber || null,
      description: description || null,
      type: type || 'personal', 
      sharedWith: [] 
    };

    const insertedId = await Account.add(newAccount);

    if (insertedId) {
      response.status(STATUS_CODE.CREATED).json({ message: "Account added successfully", _id: insertedId, account: newAccount });
    } else {
      response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to add account." });
    }
  } catch (error) {
    console.error("Error occurred while adding account:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to add account" });
  }
};

exports.getAccount = async (request, response) => {
  const { id } = request.params;
  const userId = request.user._id;

  try {
    const account = await Account.findById(id, userId);
    if (account) {
      response.status(STATUS_CODE.OK).json(account);
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Account not found or you do not have access." });
    }
  } catch (error) {
    console.error("Error occurred while fetching account by ID:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve account" });
  }
};

exports.updateAccount = async (request, response) => {
  const { id } = request.params;
  const { name, balance, currency, accountNumber, description, type } = request.body;
  const userId = request.user._id;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (balance !== undefined) updates.balance = balance;
  if (currency !== undefined) updates.currency = currency;
  if (accountNumber !== undefined) updates.accountNumber = accountNumber;
  if (description !== undefined) updates.description = description;
  if (type !== undefined) updates.type = type;

  if (Object.keys(updates).length === 0) {
    return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "No fields provided for update." });
  }

  try {
    const account = await Account.findById(id, userId);
    if (!account) {
      return response.status(STATUS_CODE.NOT_FOUND).json({ message: "Account not found or you do not have access." });
    }

    const accessLevel = Account.getAccessLevel(account, userId);
    if (!canWrite(accessLevel)) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "You do not have sufficient permissions to update this account." });
    }

    const updated = await Account.updateById(id, userId, updates);
    if (updated) {
      response.status(STATUS_CODE.OK).json({ message: "Account updated successfully" });
    } else {
      response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to update account (no changes or internal error)." });
    }
  } catch (error) {
    console.error("Error occurred while updating account:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to update account" });
  }
};

exports.deleteAccount = async (request, response) => {
  const { id } = request.params;
  const userId = request.user._id;

  try {
    const account = await Account.findById(id, userId);
    if (!account) {
      return response.status(STATUS_CODE.NOT_FOUND).json({ message: "Account not found or you do not have access." });
    }

    
    if (!account.ownerId.equals(userId)) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "You are not the owner of this account and cannot delete it." });
    }

    const deleted = await Account.deleteById(id, userId);
    if (deleted) {
      response.status(STATUS_CODE.OK).json({ message: "Account deleted successfully" });
    } else {
      response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete account." });
    }
  } catch (error) {
    console.error("Error occurred while deleting account:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete account" });
  }
};



exports.shareAccount = async (request, response) => {
  const { id } = request.params; 
  const { sharedWithUserId, accessLevel } = request.body; 
  const ownerId = request.user._id; 

  if (!sharedWithUserId || !['read', 'full'].includes(accessLevel)) {
    return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "sharedWithUserId and a valid accessLevel ('read' or 'full') are required." });
  }

  try {
    const account = await Account.findById(id, ownerId); 
    if (!account || !account.ownerId.equals(ownerId)) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "You are not the owner of this account and cannot share it." });
    }

    const userToShareWith = await User.findById(sharedWithUserId);
    if (!userToShareWith) {
      return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "User to share with not found." });
    }
    if (userToShareWith._id.equals(ownerId)) {
      return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Cannot share an account with yourself." });
    }

    const added = await Account.addSharedUser(id, ownerId, sharedWithUserId, accessLevel);
    if (added) {
      response.status(STATUS_CODE.OK).json({ message: "Account shared successfully." });
    } else {
      
      response.status(STATUS_CODE.CONFLICT).json({ message: "Failed to share account (user might already have access or account not found)." });
    }
  } catch (error) {
    console.error("Error occurred while sharing account:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to share account" });
  }
};

exports.updateSharedAccess = async (request, response) => {
  const { id, sharedUserId } = request.params; 
  const { newAccessLevel } = request.body; 
  const ownerId = request.user._id;

  if (!['read', 'full'].includes(newAccessLevel)) {
    return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "A valid newAccessLevel ('read' or 'full') is required." });
  }

  try {
    const account = await Account.findById(id, ownerId);
    if (!account || !account.ownerId.equals(ownerId)) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "You are not the owner of this account and cannot modify sharing." });
    }

    const userToUpdate = await User.findById(sharedUserId);
    if (!userToUpdate) {
      return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Shared user not found." });
    }

    const updated = await Account.updateSharedUserAccess(id, ownerId, sharedUserId, newAccessLevel);
    if (updated) {
      response.status(STATUS_CODE.OK).json({ message: "Shared user access updated successfully." });
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Shared user not found in this account or access not updated." });
    }
  } catch (error) {
    console.error("Error occurred while updating shared access:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to update shared access" });
  }
};

exports.unshareAccount = async (request, response) => {
  const { id, sharedUserId } = request.params; 
  const ownerId = request.user._id;

  try {
    const account = await Account.findById(id, ownerId);
    if (!account || !account.ownerId.equals(ownerId)) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "You are not the owner of this account and cannot unshare it." });
    }

    const userToRemove = await User.findById(sharedUserId);
    if (!userToRemove) {
      return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "User to unshare not found." });
    }

    const removed = await Account.removeSharedUser(id, ownerId, sharedUserId);
    if (removed) {
      response.status(STATUS_CODE.OK).json({ message: "Account unshared successfully." });
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Shared user not found in this account or account not unshared." });
    }
  } catch (error) {
    console.error("Error occurred while unsharing account:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to unshare account" });
  }
};