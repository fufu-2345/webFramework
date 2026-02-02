const express = require("express");
const  {authRouter} =  require ("./auth.routes.js");

const router = express.Router();
authRouter(router);

module.exports = {router};