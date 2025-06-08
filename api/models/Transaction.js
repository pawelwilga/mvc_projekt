const { getDatabase } = require("../database");
const { ObjectId } = require('mongodb');

const COLLECTION_NAME = "transactions";
const ACCOUNTS_COLLECTION_NAME = "accounts"; 

class Transaction {
  constructor(accountId, type, category, amount, currency, description, relatedTransactionId = null, senderAccountId = null, receiverAccountId = null) {
    this.accountId = new ObjectId(accountId);
    this.type = type; 
    this.category = category; 
    this.amount = amount;
    this.currency = currency;
    this.date = new Date(); 
    this.description = description;
    this.relatedTransactionId = relatedTransactionId ? new ObjectId(relatedTransactionId) : null;
    this.senderAccountId = senderAccountId ? new ObjectId(senderAccountId) : null;
    this.receiverAccountId = receiverAccountId ? new ObjectId(receiverAccountId) : null;
  }

  static async getAll(accountId) {
    const db = getDatabase();
    try {
      const transactions = await db.collection(COLLECTION_NAME)
                                   .find({ accountId: new ObjectId(accountId) })
                                   .sort({ date: -1 }) 
                                   .toArray();
      return transactions;
    } catch (error) {
      console.error("Error occurred while fetching transactions for account:", error);
      return [];
    }
  }

  static async findById(transactionId, accountId) {
    const db = getDatabase();
    try {
      const transaction = await db.collection(COLLECTION_NAME).findOne({
        _id: new ObjectId(transactionId),
        accountId: new ObjectId(accountId)
      });
      return transaction;
    } catch (error) {
      console.error("Error occurred while searching transaction by ID:", error);
      return null;
    }
  }

  static async add(transactionData) {
    const db = getDatabase();
    const session = db.client.startSession();

    try {
      session.startTransaction();

      
      const transactionResult = await db.collection(COLLECTION_NAME).insertOne(transactionData, { session });
      const insertedTransactionId = transactionResult.insertedId;

      
      const accountId = transactionData.accountId;
      const amount = transactionData.amount;
      const type = transactionData.type;

      let balanceUpdate = 0;
      if (type === 'income') {
        balanceUpdate = amount;
      } else if (type === 'expense') {
        balanceUpdate = -amount;
      } else if (type === 'transfer' && transactionData.senderAccountId && transactionData.senderAccountId.equals(accountId)) {
        
        balanceUpdate = -amount;
      } else if (type === 'transfer' && transactionData.receiverAccountId && transactionData.receiverAccountId.equals(accountId)) {
        
        balanceUpdate = amount;
      } else {
        
        throw new Error("Invalid transaction type or incomplete transfer data.");
      }

      const accountUpdateResult = await db.collection(ACCOUNTS_COLLECTION_NAME).updateOne(
        { _id: new ObjectId(accountId) },
        { $inc: { balance: balanceUpdate } },
        { session }
      );

      if (accountUpdateResult.modifiedCount === 0) {
        throw new Error("Account balance update failed.");
      }

      await session.commitTransaction();
      return insertedTransactionId; 

    } catch (error) {
      await session.abortTransaction();
      console.error("Error occurred while adding transaction or updating account balance:", error);
      return null;
    } finally {
      session.endSession();
    }
  }

  static async updateById(transactionId, accountId, updateData) {
    const db = getDatabase();
    const session = db.client.startSession();

    try {
      session.startTransaction();

      
      const originalTransaction = await db.collection(COLLECTION_NAME).findOne({
        _id: new ObjectId(transactionId),
        accountId: new ObjectId(accountId)
      }, { session });

      if (!originalTransaction) {
        throw new Error("Original transaction not found.");
      }

      
      let originalBalanceRevert = 0;
      if (originalTransaction.type === 'income') {
        originalBalanceRevert = -originalTransaction.amount;
      } else if (originalTransaction.type === 'expense') {
        originalBalanceRevert = originalTransaction.amount;
      } else if (originalTransaction.type === 'transfer' && originalTransaction.senderAccountId && originalTransaction.senderAccountId.equals(accountId)) {
        originalBalanceRevert = originalTransaction.amount; 
      } else if (originalTransaction.type === 'transfer' && originalTransaction.receiverAccountId && originalTransaction.receiverAccountId.equals(accountId)) {
        originalBalanceRevert = -originalTransaction.amount; 
      }

      if (originalBalanceRevert !== 0) {
        await db.collection(ACCOUNTS_COLLECTION_NAME).updateOne(
          { _id: new ObjectId(accountId) },
          { $inc: { balance: originalBalanceRevert } },
          { session }
        );
      }

      
      const updateResult = await db.collection(COLLECTION_NAME).updateOne(
        { _id: new ObjectId(transactionId), accountId: new ObjectId(accountId) },
        { $set: updateData },
        { session }
      );

      
      if (updateResult.modifiedCount > 0) {
        const updatedTransaction = await db.collection(COLLECTION_NAME).findOne({ _id: new ObjectId(transactionId) }, { session });
        if (!updatedTransaction) {
            throw new Error("Updated transaction not found after modification.");
        }

        let newBalanceChange = 0;
        if (updatedTransaction.type === 'income') {
          newBalanceChange = updatedTransaction.amount;
        } else if (updatedTransaction.type === 'expense') {
          newBalanceChange = -updatedTransaction.amount;
        } else if (updatedTransaction.type === 'transfer' && updatedTransaction.senderAccountId && updatedTransaction.senderAccountId.equals(accountId)) {
          newBalanceChange = -updatedTransaction.amount;
        } else if (updatedTransaction.type === 'transfer' && updatedTransaction.receiverAccountId && updatedTransaction.receiverAccountId.equals(accountId)) {
          newBalanceChange = updatedTransaction.amount;
        } else {
            
            throw new Error("Invalid updated transaction type or incomplete transfer data for balance update.");
        }

        await db.collection(ACCOUNTS_COLLECTION_NAME).updateOne(
          { _id: new ObjectId(accountId) },
          { $inc: { balance: newBalanceChange } },
          { session }
        );
      }

      await session.commitTransaction();
      return updateResult.modifiedCount > 0; 

    } catch (error) {
      await session.abortTransaction();
      console.error("Error occurred while updating transaction or account balance:", error);
      return false;
    } finally {
      session.endSession();
    }
  }

  static async deleteById(transactionId, accountId) {
    const db = getDatabase();
    const session = db.client.startSession();

    try {
      session.startTransaction();

      
      const transactionToDelete = await db.collection(COLLECTION_NAME).findOne({
        _id: new ObjectId(transactionId),
        accountId: new ObjectId(accountId)
      }, { session });

      if (!transactionToDelete) {
        throw new Error("Transaction to delete not found.");
      }

      
      const deleteResult = await db.collection(COLLECTION_NAME).deleteOne(
        { _id: new ObjectId(transactionId), accountId: new ObjectId(accountId) },
        { session }
      );

      if (deleteResult.deletedCount > 0) {
        
        let balanceRevert = 0;
        if (transactionToDelete.type === 'income') {
          balanceRevert = -transactionToDelete.amount;
        } else if (transactionToDelete.type === 'expense') {
          balanceRevert = transactionToDelete.amount;
        } else if (transactionToDelete.type === 'transfer' && transactionToDelete.senderAccountId && transactionToDelete.senderAccountId.equals(accountId)) {
          balanceRevert = transactionToDelete.amount; 
        } else if (transactionToDelete.type === 'transfer' && transactionToDelete.receiverAccountId && transactionToDelete.receiverAccountId.equals(accountId)) {
          balanceRevert = -transactionToDelete.amount; 
        }

        await db.collection(ACCOUNTS_COLLECTION_NAME).updateOne(
          { _id: new ObjectId(accountId) },
          { $inc: { balance: balanceRevert } },
          { session }
        );
      }

      await session.commitTransaction();
      return deleteResult.deletedCount > 0; 

    } catch (error) {
      await session.abortTransaction();
      console.error("Error occurred while deleting transaction or updating account balance:", error);
      return false;
    } finally {
      session.endSession();
    }
  }
}

module.exports = Transaction;