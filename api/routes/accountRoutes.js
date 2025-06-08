const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController'); 
const { authenticateToken } = require('../controllers/userController'); 

router.use(authenticateToken);

router.get('/', accountController.getAccounts);
router.post('/', accountController.addAccount);
router.get('/:id', accountController.getAccount);
router.put('/:id', accountController.updateAccount);
router.delete('/:id', accountController.deleteAccount);

// endpointy odpowiedzialne za współdzielenie kont
router.post('/:id/share', accountController.shareAccount); 
router.put('/:id/share/:sharedUserId', accountController.updateSharedAccess); 
router.delete('/:id/share/:sharedUserId', accountController.unshareAccount); 

module.exports = router;