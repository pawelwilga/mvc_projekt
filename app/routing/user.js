const router = require('express').Router();
const uc = require('../controllers/userController');

router.get('/register', uc.registerUserAction);
router.post('/register', uc.registerUserAction);

module.exports = router;