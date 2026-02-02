const dotenv = require("dotenv");
const express = require("express");
const cors = require('cors');
const adminSite = require('./adminSite');
const db = require("./config/db");
const { router } = require("./routes/router");
const cookieParser = require('cookie-parser');

dotenv.config();
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  // origin: process.env.FRONTEND_URL,
  origin: "http://localhost:3000",
  credentials: true,
}));

app.use('/admin', adminSite);
app.use('/api', router);

app.get('/', (req, res) => {
  res.send('Welcome to the backend server!');
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});