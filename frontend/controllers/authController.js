const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL;

exports.renderRegisterPage = (req, res) => {
    res.render('auth/register', { title: 'Zarejestruj sie' }); 
};

exports.registerUser = async (req, res) => {
    const { login, password, password2, email, defaultCurrency } = req.body;

    
    let errors = [];
    if (!login || !password || !password2 || !email || !defaultCurrency) {
        errors.push({ msg: 'Prosze wypelnic wszystkie pola' }); 
    }
    if (password !== password2) {
        errors.push({ msg: 'Hasla nie pasuja do siebie' }); 
    }
    if (password.length < 6) {
        errors.push({ msg: 'Haslo musi miec co najmniej 6 znakow' }); 
    }

    if (errors.length > 0) {
        req.flash('error_msg', errors.map(e => e.msg).join(', '));
        return res.render('auth/register', {
            title: 'Zarejestruj sie', 
            login,
            password,
            password2,
            email,
            defaultCurrency
        });
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/users/register`, {
            login,
            password,
            email,
            defaultCurrency
        });

        if (response.status === 201) {
            req.flash('success_msg', 'Zostales pomyslnie zarejestrowany i mozesz sie zalogowac'); 
            res.redirect('/login');
        } else {
            req.flash('error_msg', 'Rejestracja nie powiodla sie. Sprobuj ponownie.'); 
            res.redirect('/register');
        }
    } catch (error) {
        console.error('Registration error:', error.response ? error.response.data : error.message);
        const errorMessage = error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : 'Rejestracja nie powiodla sie. Blad serwera.'; 
        req.flash('error_msg', errorMessage);
        res.redirect('/register');
    }
};

exports.renderLoginPage = (req, res) => {
    res.render('auth/login', { title: 'Zaloguj sie' }); 
};

exports.loginUser = async (req, res) => {
    const { login, password } = req.body;

    
    if (!login || !password) {
        req.flash('error_msg', 'Prosze podac login i haslo'); 
        return res.render('auth/login', { title: 'Zaloguj sie', login }); 
    }

    try {
        const response = await axios.post(`${API_BASE_URL}/users/login`, {
            login,
            password
        });

        if (response.data && response.data.token) {
            req.session.token = response.data.token;
            req.session.user = response.data.user;

            req.flash('success_msg', 'Zostales pomyslnie zalogowany'); 
            res.redirect('/dashboard');
        } else {
            req.flash('error_msg', 'Logowanie nie powiodlo sie. Nieprawidlowe dane uwierzytelniajace.'); 
            res.redirect('/login');
        }
    } catch (error) {
        console.error('Login error:', error.response ? error.response.data : error.message);
        const errorMessage = error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : 'Logowanie nie powiodlo sie. Blad serwera.'; 
        req.flash('error_msg', errorMessage);
        res.redirect('/login');
    }
};

exports.logoutUser = (req, res) => {
    
    req.flash('success_msg', 'Zostales wylogowany');

    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session:', err);
            
            req.flash('error_msg', 'Wystąpił problem podczas wylogowywania.'); 
            return res.redirect('/dashboard'); 
        }
        
        res.redirect('/login');
    });
};

exports.renderDashboard = (req, res) => {
    if (req.session.token) {
        res.render('dashboard', { title: 'Panel Glowny', user: req.session.user }); 
    } else {
        req.flash('error_msg', 'Prosze sie zalogowac, aby uzyskac dostep do tego zasobu'); 
        res.redirect('/login');
    }
};

exports.ensureAuthenticated = (req, res, next) => {
    if (req.session.token) {
        return next();
    }
    req.flash('error_msg', 'Prosze sie zalogowac, aby uzyskac dostep do tego zasobu'); 
    res.redirect('/login');
};