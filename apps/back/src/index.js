const express = require("express");
const cors = require('cors');
const adminSite = require('./adminSite');
const gameRoute = require("./routes/gameRoute");
const gameController = require("./controllers/gameController");
const tableRoute = require("./routes/tableRoute"); 
const paymentRoute = require("./routes/paymentRoute");


const app = express();
const PORT = 5000;
app.use(cors());



app.use(express.json());
app.use('/admin', adminSite);
app.use("/game", gameRoute);
app.use("/payment", paymentRoute);


app.get("/", (req, res) => {
  res.send("aaaaaaaaaaaaaaaaaaaaaaaaa");
});
app.use("/tables", tableRoute);

gameController.autoClearExpiredTables();
setInterval(
  gameController.autoClearExpiredTables,
  60 * 1000
);

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

