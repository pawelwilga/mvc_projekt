const Account = require('../models/Account');
const { ensureAuthenticated } = require('./authController'); 

exports.renderAccountsPage = async (req, res) => {
    try {
        const accounts = await Account.getAll(req.session.token);
        res.render('accounts/index', {
            title: 'Twoje Konta Bankowe',
            accounts: accounts
        });
    } catch (error) {
        console.error('Błąd podczas ładowania listy kont:', error.message);
        req.flash('error_msg', error.message);
        res.redirect('/dashboard'); 
    }
};


exports.renderAddAccountPage = (req, res) => {
    res.render('accounts/add', {
        title: 'Dodaj Nowe Konto',
        
        name: '',
        balance: 0,
        currency: 'PLN',
        accountNumber: '',
        description: '',
        type: 'personal'
    });
};


exports.addAccount = async (req, res) => {
    const { name, balance, currency, accountNumber, description, type } = req.body;

    
    if (!name || !balance || !currency) {
        req.flash('error_msg', 'Nazwa, saldo i waluta konta są wymagane.');
        return res.render('accounts/add', {
            title: 'Dodaj Nowe Konto',
            name, balance, currency, accountNumber, description, type
        });
    }

    try {
        await Account.add(name, balance, currency, accountNumber, description, type, req.session.token);
        req.flash('success_msg', 'Konto zostało dodane pomyślnie!');
        res.redirect('/accounts');
    } catch (error) {
        console.error('Błąd podczas dodawania konta:', error.message);
        req.flash('error_msg', error.message);
        res.render('accounts/add', {
            title: 'Dodaj Nowe Konto',
            name, balance, currency, accountNumber, description, type,
            error_msg: req.flash('error_msg')
        });
    }
};


exports.renderEditAccountPage = async (req, res) => {
    try {
        const account = await Account.getById(req.params.id, req.session.token);
        if (!account) {
            req.flash('error_msg', 'Konto nie znaleziono.');
            return res.redirect('/accounts');
        }
        res.render('accounts/edit', {
            title: `Edytuj Konto: ${account.name}`,
            account: account,
            
            name: account.name,
            balance: account.balance,
            currency: account.currency,
            accountNumber: account.accountNumber,
            description: account.description,
            type: account.type
        });
    } catch (error) {
        console.error('Błąd podczas ładowania strony edycji konta:', error.message);
        req.flash('error_msg', error.message);
        res.redirect('/accounts');
    }
};


exports.updateAccount = async (req, res) => {
    const { id } = req.params;
    const { name, balance, currency, accountNumber, description, type } = req.body;

    
    if (!name || !balance || !currency) {
        req.flash('error_msg', 'Nazwa, saldo i waluta konta są wymagane.');
        return res.render('accounts/edit', {
            title: `Edytuj Konto`,
            account: { _id: id, name, balance, currency, accountNumber, description, type },
            name, balance, currency, accountNumber, description, type,
            error_msg: req.flash('error_msg')
        });
    }

    try {
        await Account.update(id, name, balance, currency, accountNumber, description, type, req.session.token);
        req.flash('success_msg', 'Konto zostało zaktualizowane pomyślnie!');
        res.redirect('/accounts');
    } catch (error) {
        console.error('Błąd podczas aktualizacji konta:', error.message);
        req.flash('error_msg', error.message);
        res.render('accounts/edit', {
            title: `Edytuj Konto`,
            account: { _id: id, name, balance, currency, accountNumber, description, type },
            name, balance, currency, accountNumber, description, type,
            error_msg: req.flash('error_msg')
        });
    }
};


exports.deleteAccount = async (req, res) => {
    try {
        await Account.delete(req.params.id, req.session.token);
        req.flash('success_msg', 'Konto zostało usunięte pomyślnie!');
        res.redirect('/accounts');
    } catch (error) {
        console.error('Błąd podczas usuwania konta:', error.message);
        req.flash('error_msg', error.message);
        res.redirect('/accounts');
    }
};


exports.renderShareAccountPage = async (req, res) => {
    try {
        const account = await Account.getById(req.params.id, req.session.token);
        if (!account) {
            req.flash('error_msg', 'Konto nie znaleziono.');
            return res.redirect('/accounts');
        }
        
        if (account.ownerId.toString() !== req.user._id.toString()) {
            req.flash('error_msg', 'Nie masz uprawnień do udostępniania tego konta.');
            return res.redirect('/accounts');
        }

        res.render('accounts/share', {
            title: `Udostępnij Konto: ${account.name}`,
            account: account
        });
    } catch (error) {
        console.error('Błąd podczas ładowania strony udostępniania konta:', error.message);
        req.flash('error_msg', error.message);
        res.redirect('/accounts');
    }
};


exports.shareAccount = async (req, res) => {
    const { id } = req.params;
    const { email, accessLevel } = req.body;

    if (!email || !accessLevel) {
        req.flash('error_msg', 'Email użytkownika i poziom dostępu są wymagane.');
        return res.redirect(`/accounts/share/${id}`);
    }

    try {
        await Account.addSharedUser(id, email, accessLevel, req.session.token);
        req.flash('success_msg', `Konto zostało udostępnione użytkownikowi ${email} z poziomem dostępu ${accessLevel}.`);
        res.redirect(`/accounts/edit/${id}`); 
    } catch (error) {
        console.error('Błąd podczas udostępniania konta:', error.message);
        req.flash('error_msg', error.message);
        res.redirect(`/accounts/share/${id}`);
    }
};


exports.removeSharedUser = async (req, res) => {
    const { accountId, sharedUserId } = req.params;

    try {
        await Account.removeSharedUser(accountId, sharedUserId, req.session.token);
        req.flash('success_msg', 'Użytkownik współdzielący konto został usunięty.');
        res.redirect(`/accounts/edit/${accountId}`);
    } catch (error) {
        console.error('Błąd podczas usuwania współdzielonego użytkownika:', error.message);
        req.flash('error_msg', error.message);
        res.redirect(`/accounts/edit/${accountId}`);
    }
};



exports.updateSharedUserAccess = async (req, res) => {
    const { accountId, sharedUserId } = req.params;
    const { accessLevel } = req.body;

    if (!accessLevel) {
        req.flash('error_msg', 'Poziom dostępu jest wymagany.');
        return res.redirect(`/accounts/edit/${accountId}`); 
    }

    try {
        await Account.updateSharedUserAccess(accountId, sharedUserId, accessLevel, req.session.token);
        req.flash('success_msg', 'Poziom dostępu użytkownika został zaktualizowany.');
        res.redirect(`/accounts/edit/${accountId}`);
    } catch (error) {
        console.error('Błąd podczas aktualizacji poziomu dostępu:', error.message);
        req.flash('error_msg', error.message);
        res.redirect(`/accounts/edit/${accountId}`);
    }
};