const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { ensureAuthenticated } = require('../controllers/authController'); 

router.use(ensureAuthenticated);

router.get('/', categoryController.renderCategoriesPage);

router.get('/add', categoryController.renderAddCategoryPage);
router.post('/add', categoryController.addCategory);

router.get('/edit/:id', categoryController.renderEditCategoryPage);
router.post('/edit/:id', categoryController.updateCategory); 

router.post('/delete/:id', categoryController.deleteCategory); 

module.exports = router;