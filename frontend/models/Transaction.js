const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL; 

class Transaction {
    static async getAll(accountId, token) {
        if (!accountId) {
            console.error("Transaction.getAll: accountId is undefined or null.");
            throw new Error("Account ID is required to fetch transactions.");
        }
        try {
            const url = `${API_BASE_URL}/accounts/${accountId}/transactions`;
            console.log(`Frontend Transaction.getAll: Making GET request to: ${url}`); 
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching transactions for account ${accountId}:`, error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || 'Nie udało się pobrać transakcji.');
        }
    }

    
    
    static async getById(accountId, transactionId, token) {
        if (!accountId || !transactionId) {
            console.error("Transaction.getById: accountId or transactionId is undefined or null.");
            throw new Error("Account ID and Transaction ID are required.");
        }
        try {
            const url = `${API_BASE_URL}/accounts/${accountId}/transactions/${transactionId}`;
            console.log(`Frontend Transaction.getById: Making GET request to: ${url}`); 
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching transaction ${transactionId}:`, error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || `Nie udało się pobrać transakcji o ID: ${transactionId}.`);
        }
    }

    
    
    static async add(accountId, transactionData, token) {
        if (!accountId) {
            console.error("Transaction.add: accountId is undefined or null.");
            throw new Error("Account ID is required to add a transaction.");
        }
        try {
            const url = `${API_BASE_URL}/accounts/${accountId}/transactions`;
            console.log(`Frontend Transaction.add: Making POST request to: ${url} with data:`, transactionData); 
            const response = await axios.post(url, transactionData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error adding transaction:', error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || 'Nie udało się dodać transakcji.');
        }
    }

    
    
    static async update(accountId, transactionId, updateData, token) {
        if (!accountId || !transactionId) {
            console.error("Transaction.update: accountId or transactionId is undefined or null.");
            throw new Error("Account ID and Transaction ID are required.");
        }
        try {
            const url = `${API_BASE_URL}/accounts/${accountId}/transactions/${transactionId}`;
            console.log(`Frontend Transaction.update: Making PUT request to: ${url} with data:`, updateData); 
            const response = await axios.put(url, updateData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating transaction ${transactionId}:`, error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || `Nie udało się zaktualizować transakcji o ID: ${transactionId}.`);
        }
    }

    
    
    static async delete(accountId, transactionId, token) {
        if (!accountId || !transactionId) {
            console.error("Transaction.delete: accountId or transactionId is undefined or null.");
            throw new Error("Account ID and Transaction ID are required.");
        }
        try {
            const url = `${API_BASE_URL}/accounts/${accountId}/transactions/${transactionId}`;
            console.log(`Frontend Transaction.delete: Making DELETE request to: ${url}`); 
            const response = await axios.delete(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error deleting transaction ${transactionId}:`, error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || `Nie udało się usunąć transakcji o ID: ${transactionId}.`);
        }
    }
}

module.exports = Transaction;