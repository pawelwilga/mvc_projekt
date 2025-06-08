const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../controllers/userController'); 

// wszystkie ścieżki w tym pliku muszą walidować JWT
router.use(authenticateToken);

router.get('/', categoryController.getCategories);
router.post('/', categoryController.addCategory);
router.get('/:id', categoryController.getCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;