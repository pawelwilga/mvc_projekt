const express = require("express");
const bodyParser = require("body-parser");

const homeRoutes = require('./routing/home');
const userRoutes = require('./routing/user');

const app = express();

// pobranie portu ze zmiennych środowiskowych lub domyślnie 3000
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));

// dodanie zmiennych dostępnych we wszystkich widokach
app.use((req, res, next) => {
  res.locals.profileCurrencyCode = "PLN";
  res.locals.numberFormat = { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: true };
  next();
});

app.use('/user', userRoutes);
app.use('/', homeRoutes);

app.use((request, response) => {
  response.status(404).render("404");
});

app.listen(PORT);
