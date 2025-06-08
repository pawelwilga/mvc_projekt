const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/register', authController.renderRegisterPage);
router.post('/register', authController.registerUser);

router.get('/login', authController.renderLoginPage);
router.post('/login', authController.loginUser);

router.get('/logout', authController.logoutUser);

router.get('/dashboard', authController.ensureAuthenticated, authController.renderDashboard);

module.exports = router;