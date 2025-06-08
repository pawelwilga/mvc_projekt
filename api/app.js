const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const { mongoConnect } = require('./database');

const userRoutes = require("./routes/userRouters");
const categoryRoutes = require('./routes/categoryRoutes');
const accountRoutes = require('./routes/accountRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const PORT = process.env.PORT || 3001;

const app = express();
// app.use();
app.use(express.json());

app.use("/api/users/", userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/accounts/:accountId/transactions', transactionRoutes);


mongoConnect(() => {
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
})});
