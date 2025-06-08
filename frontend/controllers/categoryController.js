const Category = require('../models/Category');
const { ensureAuthenticated } = require('./authController');

exports.renderCategoriesPage = async (req, res) => {
    try {
        const categories = await Category.getAll(req.session.token);
        res.render('categories/index', {
            title: 'Kategorie Wydatków',
            categories: categories
        });
    } catch (error) {
        console.error('Błąd podczas ładowania listy kategorii:', error.message);
        req.flash('error_msg', error.message);
        res.redirect('/dashboard');
    }
};

exports.renderAddCategoryPage = (req, res) => {
    res.render('categories/add', {
        title: 'Dodaj Nową Kategorię'
    });
};

exports.addCategory = async (req, res) => {
    const { name, description, color } = req.body; 

    
    if (!name) { 
        req.flash('error_msg', 'Nazwa kategorii jest wymagana.');
        
        return res.render('categories/add', {
            title: 'Dodaj Nową Kategorię',
            name,
            description,
            color
        });
    }

    try {
        await Category.add(name, description, color, req.session.token); 
        req.flash('success_msg', 'Kategoria została dodana pomyślnie!');
        res.redirect('/categories');
    } catch (error) {
        console.error('Błąd podczas dodawania kategorii:', error.message);
        req.flash('error_msg', error.message);
        res.render('categories/add', {
            title: 'Dodaj Nową Kategorię',
            name,
            description,
            color,
            error_msg: req.flash('error_msg') 
        });
    }
};


exports.renderEditCategoryPage = async (req, res) => {
    try {
        const category = await Category.getById(req.params.id, req.session.token);
        if (!category) {
            req.flash('error_msg', 'Kategoria nie znaleziona.');
            return res.redirect('/categories');
        }
        res.render('categories/edit', {
            title: `Edytuj Kategorię: ${category.name}`,
            category: category
        });
    } catch (error) {
        console.error('Błąd podczas ładowania strony edycji kategorii:', error.message);
        req.flash('error_msg', error.message);
        res.redirect('/categories');
    }
};


exports.updateCategory = async (req, res) => {
    const { id } = req.params;
    const { name, description, color } = req.body; 

    
    if (!name) { 
        req.flash('error_msg', 'Nazwa kategorii jest wymagana.');
        return res.render('categories/edit', {
            title: `Edytuj Kategorię`, 
            category: { _id: id, name, description, color }, 
            error_msg: req.flash('error_msg')
        });
    }

    try {
        await Category.update(id, name, description, color, req.session.token); 
        req.flash('success_msg', 'Kategoria została zaktualizowana pomyślnie!');
        res.redirect('/categories');
    } catch (error) {
        console.error('Błąd podczas aktualizacji kategorii:', error.message);
        req.flash('error_msg', error.message);
        res.render('categories/edit', {
            title: `Edytuj Kategorię`,
            category: { _id: id, name, description, color }, 
            error_msg: req.flash('error_msg')
        });
    }
};


exports.deleteCategory = async (req, res) => {
    try {
        await Category.delete(req.params.id, req.session.token);
        req.flash('success_msg', 'Kategoria została usunięta pomyślnie!');
        res.redirect('/categories');
    } catch (error) {
        console.error('Błąd podczas usuwania kategorii:', error.message);
        req.flash('error_msg', error.message);
        res.redirect('/categories');
    }
};