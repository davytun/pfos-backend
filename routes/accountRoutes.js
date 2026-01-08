const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const { authMiddleware } = require("../middleware/authMiddleware");

/**
 * @swagger
 * tags:
 *   name: Account
 *   description: Account management API
 */

/**
 * @swagger
 * /api/account:
 *   get:
 *     summary: Get account details
 *     tags: [Account]
 *     responses:
 *       200:
 *         description: Account details retrieved successfully
 *       500:
 *         description: Server error
 */
router.get("/", accountController.getAccount);

/**
 * @swagger
 * /api/account:
 *   put:
 *     summary: Update account details
 *     tags: [Account]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put("/", authMiddleware, accountController.updateAccount);

module.exports = router;
