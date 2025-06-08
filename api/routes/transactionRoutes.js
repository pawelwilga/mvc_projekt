const express = require('express');
const router = express.Router({ mergeParams: true }); 
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../controllers/userController'); 

// wszystkie endpointy potrzebują autoryzacji tokenu
router.use(authenticateToken);

// pobiera wszystkie transakcje
router.get('/', transactionController.getTransactions);

// pobiera pojedynczą transakcję
router.get('/:transactionId', transactionController.getTransaction);

// dodawanie transakcji
router.post('/', transactionController.addTransaction);

// modyfikacja transakcji
router.put('/:transactionId', transactionController.updateTransaction);

// usuwanie transakcji
router.delete('/:transactionId', transactionController.deleteTransaction);

// transfer pomiędzy rachunkami
router.post('/:senderAccountId/transfer/:receiverAccountId', transactionController.performTransfer);


module.exports = router;