const express = require("express");
const router = express.Router();
const controller = require("../controllers/tableController"); 

router.get('/', controller.getTables); 

router.get("/available", controller.getAvailableTime);
router.post("/reserve", controller.reserveTable);
router.get("/mytable/:userID", controller.getMyReservedTables);


module.exports = router;