const express = require("express");
const router = express.Router();
const paymentcontroller = require("../controllers/paymentController");

router.post("/confirm", paymentcontroller.confirmPayment);

module.exports = router;
