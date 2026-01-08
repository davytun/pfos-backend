const express = require("express");
const {
  placeOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/order", placeOrder); 
router.get("/orders", getOrders); 
router.get("/orders/:id", getOrderById); 
router.put("/orders/:id/status", authMiddleware, updateOrderStatus);


module.exports = router;
