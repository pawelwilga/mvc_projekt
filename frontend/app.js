require('dotenv').config(); // konfiguracja zmiennych środowiskowych
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const cookieParser = require('cookie-parser');
const session = require('express-session'); // do zarządzania sesjami użytkowników po stronie aplikacji frontendowej
const flash = require('connect-flash'); // do wyświetlania wiadomości w intrfejsie użytkownika
const expressLayouts = require('express-ejs-layouts');

const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(expressLayouts);
app.set('layout', 'layouts/main'); // <
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // w razie problemów zamienić na body-parser
app.use(express.json());
app.use(cookieParser()); // do parsowania ciastek
app.use(session({
    secret: process.env.SESSION_SECRET || 'bardzoTajnySekretDoSzyfrowaniaSesji',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === 'production' } // używaj bezpiecznych ciastek na produkcji
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error'); // Used by Passport.js if you integrate it later
    res.locals.user = req.session.user || null; // Make user data available in views
    next();
});

app.use('/', authRoutes);
app.use('/categories', categoryRoutes);
app.use('/accounts', accountRoutes);
app.use('/accounts', transactionRoutes);

app.get('/', (req, res) => {
    res.render('index', { title: 'Finance manager' });
});

app.listen(PORT, () => {
    console.log(`Frontend app started on port ${PORT}`);
    console.log(`API Base URL: ${process.env.API_BASE_URL}`);
});