const express = require("express");
const cors = require('cors');
const adminSite = require('./adminSite');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use('/admin', adminSite);

app.get("/", (req, res) => {
  res.send("aaaaaaaaaaaaaaaaaaaaaaaaa");
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
