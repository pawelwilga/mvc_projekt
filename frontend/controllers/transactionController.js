const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const { ensureAuthenticated } = require('./authController');

exports.renderTransactionsPage = async (req, res) => {
    const { accountId } = req.params;
    try {
        const account = await Account.getById(accountId, req.session.token);
        if (!account) {
            req.flash('error_msg', 'Konto nie znaleziono.');
            return res.redirect('/accounts');
        }

        const transactions = await Transaction.getAll(accountId, req.session.token);

        const categories = await Category.getAll(req.session.token);
        const categoryMap = new Map(categories.map(cat => [cat._id.toString(), cat.name]));

        const formattedTransactions = transactions.map(t => ({
            ...t,
            categoryName: categoryMap.get(t.category) || 'N/A',
            formattedDate: new Date(t.date).toLocaleDateString('pl-PL', {
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: '2-digit', minute: '2-digit'
            })
        }));

        res.render('transactions/index', {
            title: `Transakcje dla konta: ${account.name}`,
            account: account,
            transactions: formattedTransactions
        });
    } catch (error) {
        console.error('Błąd podczas ładowania listy transakcji:', error.message);
        req.flash('error_msg', error.message);
        res.redirect(`/accounts`);
    }
};


exports.renderAddTransactionPage = async (req, res) => {
    const { accountId } = req.params;
    try {
        const account = await Account.getById(accountId, req.session.token);
        if (!account) {
            req.flash('error_msg', 'Konto nie znaleziono.');
            return res.redirect('/accounts');
        }
        const categories = await Category.getAll(req.session.token);
        const userAccounts = await Account.getAll(req.session.token);

        res.render('transactions/add', {
            title: `Dodaj Transakcję do konta: ${account.name}`,
            account: account,
            categories: categories,
            userAccounts: userAccounts.filter(acc => acc._id.toString() !== accountId),
            type: 'expense',
            amount: '',
            description: '',
            category: ''
        });
    } catch (error) {
        console.error('Błąd podczas ładowania formularza dodawania transakcji:', error.message);
        req.flash('error_msg', error.message);
        res.redirect(`/accounts/${accountId}/transactions`);
    }
};


exports.addTransaction = async (req, res) => {
    const { accountId } = req.params;
    const { type, category, amount, description, senderAccountId, receiverAccountId } = req.body;

    let errors = [];
    if (!type || !amount) {
        errors.push('Typ i kwota transakcji są wymagane.');
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        errors.push('Kwota musi być liczbą dodatnią.');
    }

    if (type === 'transfer') {
        if (!senderAccountId || !receiverAccountId) {
            errors.push('Dla transferu wymagane są konta nadawcy i odbiorcy.');
        }
        if (senderAccountId === receiverAccountId) {
            errors.push('Konto nadawcy i odbiorcy nie mogą być takie same.');
        }
    } else if (!category) {
        errors.push('Kategoria jest wymagana dla wydatków i dochodów.');
    }

    try {
        const account = await Account.getById(accountId, req.session.token);
        if (!account) {
            errors.push('Konto nie znaleziono.');
        }
        const categories = await Category.getAll(req.session.token);
        const userAccounts = await Account.getAll(req.session.token);

        if (errors.length > 0) {
            req.flash('error_msg', errors.join(', '));
            return res.render('transactions/add', {
                title: `Dodaj Transakcję do konta: ${account.name}`,
                account: account,
                categories: categories,
                userAccounts: userAccounts.filter(acc => acc._id.toString() !== accountId),
                type, category, amount, description, senderAccountId, receiverAccountId,
                error_msg: req.flash('error_msg')
            });
        }

        const selectedCategory = categories.find(cat => cat._id.toString() === category);
        if (type !== 'transfer' && !selectedCategory) {
            errors.push('Wybrana kategoria jest nieprawidłowa.');
            req.flash('error_msg', errors.join(', '));
            return res.render('transactions/add', {
                title: `Dodaj Transakcję do konta: ${account.name}`,
                account: account,
                categories: categories,
                userAccounts: userAccounts.filter(acc => acc._id.toString() !== accountId),
                type, category, amount, description, senderAccountId, receiverAccountId,
                error_msg: req.flash('error_msg')
            });
        }

        
        let transactionData = {
            accountId: accountId, 
            type,
            amount: parseFloat(amount),
            currency: account.currency,
            description,
        };

        if (type === 'transfer') {
            transactionData.senderAccountId = senderAccountId;
            transactionData.receiverAccountId = receiverAccountId;
            transactionData.category = null;
        } else {
            transactionData.category = category;
            transactionData.senderAccountId = null;
            transactionData.receiverAccountId = null;
        }

        await Transaction.add(accountId, transactionData, req.session.token); 
        req.flash('success_msg', 'Transakcja została dodana pomyślnie!');
        res.redirect(`/accounts/${accountId}/transactions`);
    } catch (error) {
        console.error('Błąd podczas dodawania transakcji:', error.message);
        req.flash('error_msg', error.message);
        try {
            const account = await Account.getById(accountId, req.session.token);
            const categories = await Category.getAll(req.session.token);
            const userAccounts = await Account.getAll(req.session.token);
            res.render('transactions/add', {
                title: `Dodaj Transakcję do konta: ${account.name}`,
                account: account,
                categories: categories,
                userAccounts: userAccounts.filter(acc => acc._id.toString() !== accountId),
                type, category, amount, description, senderAccountId, receiverAccountId,
                error_msg: req.flash('error_msg')
            });
        } catch (innerError) {
            console.error('Błąd podczas ponownego ładowania formularza transakcji:', innerError.message);
            res.redirect(`/accounts/${accountId}/transactions`);
        }
    }
};


exports.renderEditTransactionPage = async (req, res) => {
    const { accountId, transactionId } = req.params;
    try {
        const account = await Account.getById(accountId, req.session.token);
        if (!account) {
            req.flash('error_msg', 'Konto nie znaleziono.');
            return res.redirect('/accounts');
        }

        
        const transaction = await Transaction.getById(transactionId, req.session.token);
        if (!transaction) {
            req.flash('error_msg', 'Transakcja nie znaleziona.');
            return res.redirect(`/accounts/${accountId}/transactions`);
        }

        const categories = await Category.getAll(req.session.token);
        const userAccounts = await Account.getAll(req.session.token);

        res.render('transactions/edit', {
            title: `Edytuj Transakcję: ${transaction.description}`,
            account: account,
            transaction: transaction,
            categories: categories,
            userAccounts: userAccounts.filter(acc => acc._id.toString() !== accountId),
            type: transaction.type,
            amount: transaction.amount,
            description: transaction.description,
            category: transaction.category ? transaction.category.toString() : '',
            senderAccountId: transaction.senderAccountId ? transaction.senderAccountId.toString() : '',
            receiverAccountId: transaction.receiverAccountId ? transaction.receiverAccountId.toString() : ''
        });
    } catch (error) {
        console.error('Błąd podczas ładowania strony edycji transakcji:', error.message);
        req.flash('error_msg', error.message);
        res.redirect(`/accounts/${accountId}/transactions`);
    }
};


exports.updateTransaction = async (req, res) => {
    const { accountId, transactionId } = req.params;
    const { type, category, amount, description, senderAccountId, receiverAccountId } = req.body;

    let errors = [];
    if (!type || !amount) {
        errors.push('Typ i kwota transakcji są wymagane.');
    }
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        errors.push('Kwota musi być liczbą dodatnią.');
    }

    if (type === 'transfer') {
        if (!senderAccountId || !receiverAccountId) {
            errors.push('Dla transferu wymagane są konta nadawcy i odbiorcy.');
        }
        if (senderAccountId === receiverAccountId) {
            errors.push('Konto nadawcy i odbiorcy nie mogą być takie same.');
        }
    } else if (!category) {
        errors.push('Kategoria jest wymagana dla wydatków i dochodów.');
    }

    try {
        const account = await Account.getById(accountId, req.session.token);
        if (!account) {
            errors.push('Konto nie znaleziono.');
        }
        const categories = await Category.getAll(req.session.token);
        const userAccounts = await Account.getAll(req.session.token);

        if (errors.length > 0) {
            req.flash('error_msg', errors.join(', '));
            return res.render('transactions/edit', {
                title: `Edytuj Transakcję`,
                account: account,
                transaction: { _id: transactionId, accountId, type, category, amount, description, senderAccountId, receiverAccountId },
                categories: categories,
                userAccounts: userAccounts.filter(acc => acc._id.toString() !== accountId),
                type, category, amount, description, senderAccountId, receiverAccountId,
                error_msg: req.flash('error_msg')
            });
        }

        const selectedCategory = categories.find(cat => cat._id.toString() === category);
        if (type !== 'transfer' && !selectedCategory) {
            errors.push('Wybrana kategoria jest nieprawidłowa.');
            req.flash('error_msg', errors.join(', '));
            return res.render('transactions/edit', {
                title: `Edytuj Transakcję`,
                account: account,
                transaction: { _id: transactionId, accountId, type, category, amount, description, senderAccountId, receiverAccountId },
                categories: categories,
                userAccounts: userAccounts.filter(acc => acc._id.toString() !== accountId),
                type, category, amount, description, senderAccountId, receiverAccountId,
                error_msg: req.flash('error_msg')
            });
        }

        
        let updateData = {
            accountId: accountId, 
            type,
            amount: parseFloat(amount),
            currency: account.currency,
            description,
        };

        if (type === 'transfer') {
            updateData.senderAccountId = senderAccountId;
            updateData.receiverAccountId = receiverAccountId;
            updateData.category = null;
        } else {
            updateData.category = category;
            updateData.senderAccountId = null;
            updateData.receiverAccountId = null;
        }

        
        await Transaction.update(transactionId, updateData, req.session.token);
        req.flash('success_msg', 'Transakcja została zaktualizowana pomyślnie!');
        res.redirect(`/accounts/${accountId}/transactions`);
    } catch (error) {
        console.error('Błąd podczas aktualizacji transakcji:', error.message);
        req.flash('error_msg', error.message);
        try {
            const account = await Account.getById(accountId, req.session.token);
            const categories = await Category.getAll(req.session.token);
            const userAccounts = await Account.getAll(req.session.token);
            res.render('transactions/edit', {
                title: `Edytuj Transakcję`,
                account: account,
                transaction: { _id: transactionId, accountId, type, category, amount, description, senderAccountId, receiverAccountId },
                categories: categories,
                userAccounts: userAccounts.filter(acc => acc._id.toString() !== accountId),
                type, category, amount, description, senderAccountId, receiverAccountId,
                error_msg: req.flash('error_msg')
            });
        } catch (innerError) {
            console.error('Błąd podczas ponownego ładowania formularza edycji transakcji:', innerError.message);
            res.redirect(`/accounts/${accountId}/transactions`);
        }
    }
};


exports.deleteTransaction = async (req, res) => {
    const { accountId, transactionId } = req.params;
    try {
        
        await Transaction.delete(transactionId, req.session.token);
        req.flash('success_msg', 'Transakcja została usunięta pomyślnie!');
        res.redirect(`/accounts/${accountId}/transactions`);
    } catch (error) {
        console.error('Błąd podczas usuwania transakcji:', error.message);
        req.flash('error_msg', error.message);
        res.redirect(`/accounts/${accountId}/transactions`);
    }
};