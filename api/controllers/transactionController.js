const Transaction = require("../models/Transaction");
const Account = require("../models/Account"); 
const { STATUS_CODE } = require("../constants/statusCode");
const { ObjectId } = require('mongodb');

async function checkAccountAccess(accountId, userId, accessLevel = 'read') {
    
    const account = await Account.findById(accountId, userId);

    console.log(account);
    if (!account) {
        return false; 
    }

    const userObjectId = new ObjectId(userId);

    console.log(`porównuję ${account.ownerId} do ${userObjectId}`);

    if (account.ownerId.equals(userObjectId)) {
        return true;
    }

    const sharedAccess = account.sharedWith.find(s => s.userId.equals(userObjectId));
    if (sharedAccess) {
        if (accessLevel === 'read' && (sharedAccess.accessLevel === 'read' || sharedAccess.accessLevel === 'full')) {
            return true;
        }
        if (accessLevel === 'full' && sharedAccess.accessLevel === 'full') {
            return true;
        }
    }
    return false;
}

exports.getTransactions = async (request, response) => {
  const { accountId } = request.params;
  const userId = request.user._id; 

  try {
    if (!(await checkAccountAccess(accountId, userId, 'read'))) {
      const cRes = await checkAccountAccess(accountId, userId, 'read');
      console.log(`wynik sprawdzenia: ${cRes}`);
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "Access denied to this account's transactions." });
    }

    const transactions = await Transaction.getAll(accountId);
    response.status(STATUS_CODE.OK).json(transactions);
  } catch (error) {
    console.error("Error occurred while fetching transactions:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve transactions" });
  }
};

exports.getTransaction = async (request, response) => {
  const { accountId, transactionId } = request.params;
  const userId = request.user._id;

  try {
    if (!(await checkAccountAccess(accountId, userId, 'read'))) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "Access denied to this transaction." });
    }

    const transaction = await Transaction.findById(transactionId, accountId);
    if (transaction) {
      response.status(STATUS_CODE.OK).json(transaction);
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Transaction not found" });
    }
  } catch (error) {
    console.error("Error occurred while fetching transaction by ID:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to retrieve transaction" });
  }
};

exports.addTransaction = async (request, response) => {
  const { accountId } = request.params;
  const userId = request.user._id;
  const { type, category, amount, currency, description, targetAccountId } = request.body; 

  try {
    if (!(await checkAccountAccess(accountId, userId, 'full'))) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "Access denied: You need full access to add transactions to this account." });
    }

    if (type === 'transfer') {
      if (!targetAccountId || accountId === targetAccountId) {
        return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "For transfers, 'targetAccountId' must be provided and different from 'accountId'." });
      }

      
      const targetAccountExists = await Account.findById(targetAccountId);
      if (!targetAccountExists) {
          return response.status(STATUS_CODE.NOT_FOUND).json({ message: "Target account for transfer not found." });
      }
      
      
      

      
      const senderTransactionData = {
          accountId: accountId,
          type: 'transfer',
          category: category, 
          amount: amount,
          currency: currency,
          description: `Transfer to account ${targetAccountId}: ${description || ''}`,
          senderAccountId: accountId,
          receiverAccountId: targetAccountId
      };
      const receiverTransactionData = {
          accountId: targetAccountId,
          type: 'transfer',
          category: category, 
          amount: amount,
          currency: currency,
          description: `Transfer from account ${accountId}: ${description || ''}`,
          senderAccountId: accountId,
          receiverAccountId: targetAccountId
      };

      
      
      
      
      
      

      const insertedSenderTransactionId = await Transaction.add(senderTransactionData);
      if (!insertedSenderTransactionId) {
          return response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to create sender transaction for transfer." });
      }

      
      receiverTransactionData.relatedTransactionId = insertedSenderTransactionId;
      senderTransactionData.relatedTransactionId = insertedSenderTransactionId; 
                                                                                
                                                                                
                                                                                
                                                                                

      
      
      

      
      
      

      
      
      

      
      
      
      
      /*
        static async performTransfer(senderAccountId, receiverAccountId, amount, currency, description, category) {
            const db = getDatabase();
            const session = db.client.startSession();
            try {
                session.startTransaction();

                
                await db.collection(ACCOUNTS_COLLECTION_NAME).updateOne(
                    { _id: new ObjectId(senderAccountId) },
                    { $inc: { balance: -amount } },
                    { session }
                );

                
                await db.collection(ACCOUNTS_COLLECTION_NAME).updateOne(
                    { _id: new ObjectId(receiverAccountId) },
                    { $inc: { balance: amount } },
                    { session }
                );

                
                const senderTransaction = {
                    accountId: new ObjectId(senderAccountId),
                    type: 'transfer',
                    category: category,
                    amount: amount,
                    currency: currency,
                    date: new Date(),
                    description: `Transfer to ${receiverAccountId}: ${description}`,
                    senderAccountId: new ObjectId(senderAccountId),
                    receiverAccountId: new ObjectId(receiverAccountId)
                };
                const senderResult = await db.collection(COLLECTION_NAME).insertOne(senderTransaction, { session });

                
                const receiverTransaction = {
                    accountId: new ObjectId(receiverAccountId),
                    type: 'transfer',
                    category: category,
                    amount: amount,
                    currency: currency,
                    date: new Date(),
                    description: `Transfer from ${senderAccountId}: ${description}`,
                    senderAccountId: new ObjectId(senderAccountId),
                    receiverAccountId: new ObjectId(receiverAccountId)
                };
                const receiverResult = await db.collection(COLLECTION_NAME).insertOne(receiverTransaction, { session });

                
                await db.collection(COLLECTION_NAME).updateOne(
                    { _id: senderResult.insertedId },
                    { $set: { relatedTransactionId: receiverResult.insertedId } },
                    { session }
                );
                await db.collection(COLLECTION_NAME).updateOne(
                    { _id: receiverResult.insertedId },
                    { $set: { relatedTransactionId: senderResult.insertedId } },
                    { session }
                );

                await session.commitTransaction();
                return { senderTransactionId: senderResult.insertedId, receiverTransactionId: receiverResult.insertedId };
            } catch (error) {
                await session.abortTransaction();
                console.error("Error during transfer:", error);
                return null;
            } finally {
                session.endSession();
            }
        }
      */
      
      

      return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Transfer transactions require a dedicated endpoint for atomic multi-account operations." });

    } else if (type === 'income' || type === 'expense') {
        const newTransactionData = {
            accountId: new ObjectId(accountId),
            type: type,
            category: category,
            amount: amount,
            currency: currency,
            description: description
        };

        const insertedId = await Transaction.add(newTransactionData);
        if (insertedId) {
            response.status(STATUS_CODE.CREATED).json({ message: "Transaction added successfully", transactionId: insertedId });
        } else {
            response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to add transaction" });
        }
    } else {
      return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Invalid transaction type. Must be 'income', 'expense', or 'transfer'." });
    }

  } catch (error) {
    console.error("Error occurred while adding transaction:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to add transaction" });
  }
};

exports.updateTransaction = async (request, response) => {
  const { accountId, transactionId } = request.params;
  const userId = request.user._id;
  const updateData = request.body; 

  try {
    if (!(await checkAccountAccess(accountId, userId, 'full'))) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "Access denied: You need full access to update transactions for this account." });
    }

    
    
    if (updateData.accountId || updateData.type || updateData.senderAccountId || updateData.receiverAccountId) {
        return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Changing 'accountId', 'type', 'senderAccountId', or 'receiverAccountId' is not allowed via update. Please delete and re-add the transaction." });
    }

    const updated = await Transaction.updateById(transactionId, accountId, updateData);
    if (updated) {
      response.status(STATUS_CODE.OK).json({ message: "Transaction updated successfully" });
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Transaction not found or not updated" });
    }
  } catch (error) {
    console.error("Error occurred while updating transaction by ID:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to update transaction" });
  }
};

exports.deleteTransaction = async (request, response) => {
  const { accountId, transactionId } = request.params;
  const userId = request.user._id;

  try {
    if (!(await checkAccountAccess(accountId, userId, 'full'))) {
      return response.status(STATUS_CODE.FORBIDDEN).json({ message: "Access denied: You need full access to delete transactions from this account." });
    }

    const deleted = await Transaction.deleteById(transactionId, accountId);
    if (deleted) {
      response.status(STATUS_CODE.OK).json({ message: "Transaction deleted successfully" });
    } else {
      response.status(STATUS_CODE.NOT_FOUND).json({ message: "Transaction not found or not deleted" });
    }
  } catch (error) {
    console.error("Error occurred while deleting transaction by ID:", error);
    response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to delete transaction" });
  }
};


exports.performTransfer = async (request, response) => {
    const { senderAccountId, receiverAccountId } = request.params; 
    const userId = request.user._id;
    const { amount, currency, description, category } = request.body;

    try {
        
        if (!amount || amount <= 0 || !currency || !description || !category) {
            return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Amount, currency, description, and category are required for a transfer." });
        }
        if (senderAccountId === receiverAccountId) {
            return response.status(STATUS_CODE.BAD_REQUEST).json({ message: "Sender and receiver accounts cannot be the same." });
        }

        
        const hasSenderAccess = await checkAccountAccess(senderAccountId, userId, 'full');
        const hasReceiverAccess = await checkAccountAccess(receiverAccountId, userId, 'read'); 

        if (!hasSenderAccess) {
            return response.status(STATUS_CODE.FORBIDDEN).json({ message: "Access denied: You need full access to the sender account to perform a transfer." });
        }
        if (!hasReceiverAccess) {
            return response.status(STATUS_CODE.FORBIDDEN).json({ message: "Access denied: You need at least read access to the receiver account to perform a transfer." });
        }


        
        const transferResult = await Transaction.performAtomicTransfer(senderAccountId, receiverAccountId, amount, currency, description, category);

        if (transferResult) {
            response.status(STATUS_CODE.CREATED).json({
                message: "Transfer successful",
                senderTransactionId: transferResult.senderTransactionId,
                receiverTransactionId: transferResult.receiverTransactionId
            });
        } else {
            response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to perform transfer." });
        }

    } catch (error) {
        console.error("Error occurred during transfer:", error);
        response.status(STATUS_CODE.INTERNAL_SERVER_ERROR).json({ message: "Failed to perform transfer." });
    }
};


/*
  static async performAtomicTransfer(senderAccountId, receiverAccountId, amount, currency, description, category) {
      const db = getDatabase();
      const session = db.client.startSession();
      try {
          session.startTransaction();

          
          await db.collection(ACCOUNTS_COLLECTION_NAME).updateOne(
              { _id: new ObjectId(senderAccountId) },
              { $inc: { balance: -amount } },
              { session }
          );

          
          await db.collection(ACCOUNTS_COLLECTION_NAME).updateOne(
              { _id: new ObjectId(receiverAccountId) },
              { $inc: { balance: amount } },
              { session }
          );

          
          const senderTransaction = {
              accountId: new ObjectId(senderAccountId),
              type: 'transfer',
              category: category,
              amount: amount,
              currency: currency,
              date: new Date(),
              description: `Transfer to ${receiverAccountId}: ${description}`,
              senderAccountId: new ObjectId(senderAccountId),
              receiverAccountId: new ObjectId(receiverAccountId)
          };
          const senderResult = await db.collection(COLLECTION_NAME).insertOne(senderTransaction, { session });

          
          const receiverTransaction = {
              accountId: new ObjectId(receiverAccountId),
              type: 'transfer',
              category: category,
              amount: amount,
              currency: currency,
              date: new Date(),
              description: `Transfer from ${senderAccountId}: ${description}`,
              senderAccountId: new ObjectId(senderAccountId),
              receiverAccountId: new ObjectId(receiverAccountId)
          };
          const receiverResult = await db.collection(COLLECTION_NAME).insertOne(receiverTransaction, { session });

          
          await db.collection(COLLECTION_NAME).updateOne(
              { _id: senderResult.insertedId },
              { $set: { relatedTransactionId: receiverResult.insertedId } },
              { session }
          );
          await db.collection(COLLECTION_NAME).updateOne(
              { _id: receiverResult.insertedId },
              { $set: { relatedTransactionId: senderResult.insertedId } },
              { session }
          );

          await session.commitTransaction();
          return { senderTransactionId: senderResult.insertedId, receiverTransactionId: receiverResult.insertedId };
      } catch (error) {
          await session.abortTransaction();
          console.error("Error during atomic transfer:", error);
          return null;
      } finally {
          session.endSession();
      }
  }
*/