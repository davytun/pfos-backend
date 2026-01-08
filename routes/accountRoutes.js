const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const { authMiddleware } = require("../middleware/authMiddleware"); 

router.get("/", accountController.getAccount);

router.put("/", authMiddleware, accountController.updateAccount);

module.exports = router;
