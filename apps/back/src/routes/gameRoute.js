const express = require("express");
const router = express.Router();
const gameController = require("../controllers/gameController");

// GET
router.get("/", gameController.getAllGames);
router.get("/filter", gameController.filterGames);      
router.get("/borrowed/:rentTablesID", gameController.getBorrowedGames);

// POST
router.post("/borrow", gameController.borrowGame);
router.post("/return", gameController.returnGame);


module.exports = router;
