
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);


router.get('/:id', userController.authenticateToken, userController.getUserProfile);
router.put('/:id', userController.authenticateToken, userController.updateUserProfile);
router.delete('/:id', userController.authenticateToken, userController.deleteUser);

module.exports = router;