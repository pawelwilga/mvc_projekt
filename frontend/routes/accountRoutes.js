const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { ensureAuthenticated } = require('../controllers/authController'); 

// wszystkie trasy wymagają zalogowanego użytkownika
router.use(ensureAuthenticated);

router.get('/', accountController.renderAccountsPage);

router.get('/add', accountController.renderAddAccountPage);
router.post('/add', accountController.addAccount);

router.get('/edit/:id', accountController.renderEditAccountPage);
router.post('/edit/:id', accountController.updateAccount); 
router.post('/delete/:id', accountController.deleteAccount); 
router.get('/share/:id', accountController.renderShareAccountPage);
router.post('/share/:id', accountController.shareAccount);

router.post('/:accountId/share/:sharedUserId/remove', accountController.removeSharedUser);

router.post('/:accountId/share/:sharedUserId/update', accountController.updateSharedUserAccess);

module.exports = router;