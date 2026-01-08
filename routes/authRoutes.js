const express = require("express");
const {
  loginAdmin,
  forgotPassword,
  resetPassword,
  verifyResetToken,
} = require("../controllers/adminController.js");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: The authentication API
 */

// router.post("/register", registerAdmin); // Register Admin

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Login for admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 token:
 *                   type: string
 *       400:
 *         description: Invalid credentials
 */
router.post("/login", loginAdmin); // Login Admin

/**
 * @swagger
 * /admin/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: Admin not found
 */
router.post("/forgot-password", forgotPassword);
/**
 * @swagger
 * /admin/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *               confirmPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Passwords do not match or invalid token
 */
router.post("/reset-password", resetPassword);
router.get("/validate-reset-token", verifyResetToken);

module.exports = router;
