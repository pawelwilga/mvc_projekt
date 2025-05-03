const router = require('express').Router();
const hc = require('../controllers/homeController');

router.get('/', hc.getHomeView);

module.exports = router;