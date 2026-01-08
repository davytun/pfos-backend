const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const { authMiddleware } = require("../middleware/authMiddleware");

router.post("/", messageController.createMessage);
router.get("/", authMiddleware, messageController.getMessages);
router.put("/:id/read", authMiddleware, messageController.toggleReadStatus);
router.delete("/:id", authMiddleware, messageController.deleteMessage);
router.post("/reply", authMiddleware, messageController.replyToMessage);

module.exports = router;
