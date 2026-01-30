const dotenv = require("dotenv");
const express = require("express");
const { db}  = require("./config/db");
const {router} = require("./routes/router");
const cookieParser = require('cookie-parser');
const cors = require("cors");

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.get('/', (req, res) => {
  res.send('Welcome to the backend server!');
});

app.use('/api',router);

db.query("SELECT 1 ")
  .then(() => {
    console.log("DB connect success");
  })
  .catch((err) => {
    console.error("DB connect error:", err);
  });




app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
