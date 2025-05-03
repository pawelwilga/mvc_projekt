
const express = require("express");
const bodyParser = require("body-parser");
const { render } = require("ejs");

const homeRoutes = require('./routing/home');

const app = express();

// pobranie portu ze zmiennych środowiskowych lub domyślnie 3000
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", "views");

app.use(express.static('./public'));
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', homeRoutes);

app.use((request, response) => {
  response.status(404).render("404");
});

app.listen(PORT);
