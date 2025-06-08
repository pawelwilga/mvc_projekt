const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { ensureAuthenticated } = require('../controllers/authController');

router.use(ensureAuthenticated);

router.get('/:accountId/transactions', transactionController.renderTransactionsPage);

router.get('/:accountId/transactions/add', transactionController.renderAddTransactionPage);
router.post('/:accountId/transactions/add', transactionController.addTransaction);

router.get('/:accountId/transactions/edit/:transactionId', transactionController.renderEditTransactionPage);
router.post('/:accountId/transactions/edit/:transactionId', transactionController.updateTransaction); 
router.post('/:accountId/transactions/delete/:transactionId', transactionController.deleteTransaction); 
module.exports = router;