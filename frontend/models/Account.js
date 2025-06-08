const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL;

class Account {
    static async getAll(token) {
        try {
            const response = await axios.get(`${API_BASE_URL}/accounts`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching accounts:', error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || 'Nie udało się pobrać kont.');
        }
    }

    
    static async getById(id, token) {
        try {
            const response = await axios.get(`${API_BASE_URL}/accounts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error fetching account with ID ${id}:`, error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || `Nie udało się pobrać konta o ID: ${id}.`);
        }
    }

    
    static async add(name, balance, currency, accountNumber, description, type, token) {
        try {
            const response = await axios.post(`${API_BASE_URL}/accounts`, {
                name,
                balance: parseFloat(balance), 
                currency,
                accountNumber,
                description,
                type
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error adding account:', error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || 'Nie udało się dodać konta.');
        }
    }

    
    static async update(id, name, balance, currency, accountNumber, description, type, token) {
        try {
            const response = await axios.put(`${API_BASE_URL}/accounts/${id}`, {
                name,
                balance: parseFloat(balance), 
                currency,
                accountNumber,
                description,
                type
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating account with ID ${id}:`, error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || `Nie udało się zaktualizować konta o ID: ${id}.`);
        }
    }

    
    static async delete(id, token) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/accounts/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error(`Error deleting account with ID ${id}:`, error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || `Nie udało się usunąć konta o ID: ${id}.`);
        }
    }

    
    static async addSharedUser(accountId, sharedUserEmail, accessLevel, token) {
        try {
            const response = await axios.post(`${API_BASE_URL}/accounts/${accountId}/share`, {
                email: sharedUserEmail, 
                accessLevel
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error sharing account:', error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || 'Nie udało się udostępnić konta.');
        }
    }

    
    static async removeSharedUser(accountId, sharedUserId, token) {
        try {
            const response = await axios.delete(`${API_BASE_URL}/accounts/${accountId}/share/${sharedUserId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error removing shared user:', error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || 'Nie udało się usunąć współdzielonego użytkownika.');
        }
    }

    
    static async updateSharedUserAccess(accountId, sharedUserId, newAccessLevel, token) {
        try {
            const response = await axios.put(`${API_BASE_URL}/accounts/${accountId}/share/${sharedUserId}`, {
                accessLevel: newAccessLevel
            }, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error updating shared user access:', error.response ? error.response.data : error.message);
            throw new Error(error.response?.data?.message || 'Nie udało się zaktualizować dostępu współdzielonego użytkownika.');
        }
    }
}

module.exports = Account;