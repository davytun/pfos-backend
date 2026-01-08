const express = require("express");
const { authMiddleware } = require("../middleware/authMiddleware");
const {
  addProduct,
  deleteProduct,
  editProduct,
  getAllProducts,
  getAdminStats,
  changePassword,
  updateEmail,
  getAdminProfile,
} = require("../controllers/adminController");

const router = express.Router();

// Admin Product Management Routes (Protected)
router.post("/products", authMiddleware, addProduct); // POST /api/admin/products - Add a new product
router.delete("/products/:id", authMiddleware, deleteProduct); // DELETE /api/admin/products/:id - Delete a product
router.put("/products/:id", authMiddleware, editProduct); // PUT /api/admin/products/:id - Edit a product
router.get("/products", authMiddleware, getAllProducts); // GET /api/admin/products - Get all products

// Admin Dashboard Stats Route (Protected)
router.get("/stats", authMiddleware, getAdminStats); // GET /api/admin/stats - Get admin dashboard stats

// Admin Settings Routes (Protected)
router.put("/password", authMiddleware, changePassword); // PUT /api/admin/password - Change admin password
router.put("/email", authMiddleware, updateEmail); // PUT /api/admin/email - Update admin email
router.get("/profile", authMiddleware, getAdminProfile); // GET /api/admin/profile - Get admin profile

module.exports = router;
