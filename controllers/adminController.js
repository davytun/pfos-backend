const Admin = require("../models/adminModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const upload = require("../middleware/multerConfig");

// exports.registerAdmin = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     console.log("📌 Entered Password for Registration:", `"${password}"`);

//     if (!email || !password) {
//       return res.status(400).json({ error: "Email and password are required" });
//     }

//     let admin = await Admin.findOne({ email });
//     if (admin) return res.status(400).json({ error: "Admin already exists" });

//     admin = new Admin({ email, password });
//     await admin.save();

//     res.json({ message: "Admin registered successfully" });
//   } catch (error) {
//     console.error("❌ Error in registerAdmin:", error);
//     if (error.name === "ValidationError") {
//       const messages = Object.values(error.errors).map((err) => err.message);
//       return res.status(400).json({ error: messages.join(", ") });
//     }
//     res.status(500).json({ error: "Server error" });
//   }
// };

exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log("❌ Admin not found");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    console.log("🟢 Stored Hashed Password:", `"${admin.password}"`);
    console.log("🔵 Entered Password:", `"${password}"`);

    const isMatch = await admin.matchPassword(password);
    console.log("🟣 Password Match Result:", isMatch);

    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: admin._id, role: "admin" },
      process.env.JWT_SECRET || "default_secret",
      { expiresIn: "7d" }
    );

    console.log("✅ Login Successful - Token Generated");
    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error("❌ Error in loginAdmin:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (!req.admin || !req.admin.id) {
      console.error("❌ req.admin is undefined or missing id:", req.admin);
      return res
        .status(401)
        .json({ error: "Unauthorized: Admin not authenticated" });
    }

    console.log("🟢 Changing password for admin ID:", req.admin.id);

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const isMatch = await admin.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ error: "New password and confirm password do not match" });
    }

    admin.password = newPassword;
    await admin.save();

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("❌ Error in changePassword:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateEmail = async (req, res) => {
  try {
    const { newEmail } = req.body;

    if (!newEmail) {
      return res.status(400).json({ error: "New email is required" });
    }

    if (!req.admin || !req.admin.id) {
      console.error("❌ req.admin is undefined or missing id:", req.admin);
      return res
        .status(401)
        .json({ error: "Unauthorized: Admin not authenticated" });
    }

    console.log("🟢 Updating email for admin ID:", req.admin.id);

    const admin = await Admin.findById(req.admin.id);
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    const existingAdmin = await Admin.findOne({ email: newEmail });
    if (existingAdmin && existingAdmin.id !== admin.id) {
      return res.status(400).json({ error: "Email is already in use" });
    }

    admin.email = newEmail;
    await admin.save();

    res.json({ message: "Email updated successfully" });
  } catch (error) {
    console.error("❌ Error in updateEmail:", error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ error: messages.join(", ") });
    }
    res.status(500).json({ error: "Server error" });
  }
};

exports.addProduct = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { name, price, description } = req.body;
      const image = req.file ? req.file.path : null;

      console.log("📥 Request Body:", req.body);
      console.log("📸 Uploaded File:", req.file);

      if (!name || !price || !description || !image) {
        console.log("❌ Missing Fields:", { name, price, description, image });
        return res.status(400).json({ error: "All fields are required" });
      }

      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0 || priceNum > 1000000) {
        return res
          .status(400)
          .json({ error: "Price must be between 0 and 1,000,000" });
      }

      const product = new Product({
        name,
        price: priceNum,
        description,
        image,
      });
      await product.save();

      console.log("✅ Product Added:", product);
      res.status(201).json({ message: "Product added successfully", product });
    } catch (error) {
      console.error("❌ Error in addProduct:", error);
      if (error.message.includes("Only images")) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Server error" });
    }
  },
];

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error in deleteProduct:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.editProduct = [
  upload.single("image"),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, description } = req.body;
      const image = req.file ? req.file.path : undefined;

      if (!name || !price || !description) {
        return res.status(400).json({ error: "All fields are required" });
      }

      const priceNum = parseFloat(price);
      if (isNaN(priceNum) || priceNum <= 0 || priceNum > 1000000) {
        return res
          .status(400)
          .json({ error: "Price must be between 0 and 1,000,000" });
      }

      const updates = { name, price: priceNum, description };
      if (image) updates.image = image;

      const updatedProduct = await Product.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });
      if (!updatedProduct) {
        return res.status(404).json({ error: "Product not found" });
      }
      res.json({
        message: "Product updated successfully",
        product: updatedProduct,
      });
    } catch (error) {
      console.error("❌ Error in editProduct:", error);
      res.status(500).json({ error: "Server error" });
    }
  },
];

exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error("❌ Error in getAllProducts:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAdminStats = async (req, res) => {
  try {
    console.log("🔍 Entering getAdminStats - Version 2.0");

    const totalOrders = await Order.countDocuments();
    console.log("✅ totalOrders:", totalOrders);

    const pendingOrders = await Order.countDocuments({
      orderStatus: "pending",
    });
    console.log("✅ pendingOrders:", pendingOrders);

    const shippedOrders = await Order.countDocuments({
      orderStatus: "shipped",
    });
    console.log("✅ shippedOrders:", shippedOrders);

    const canceledOrders = await Order.countDocuments({
      orderStatus: "canceled",
    });
    console.log("✅ canceledOrders:", canceledOrders);

    const totalProducts = await Product.countDocuments();
    console.log("✅ totalProducts:", totalProducts);

    const totalRevenue = await Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);
    console.log("✅ totalRevenue:", totalRevenue);

    // Revenue over time (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    console.log("✅ thirtyDaysAgo:", thirtyDaysAgo);

    const revenueOverTime = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo },
          orderStatus: { $ne: "canceled" },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalRevenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    console.log("📊 revenueOverTime:", revenueOverTime);

    // Orders per product
    const ordersPerProduct = await Order.aggregate([
      { $match: { orderStatus: { $ne: "canceled" } } },
      { $unwind: "$cart" },
      {
        $group: {
          _id: "$cart.name",
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { orderCount: -1 } },
    ]);
    console.log("📊 ordersPerProduct:", ordersPerProduct);

    const response = {
      totalOrders,
      pendingOrders,
      shippedOrders,
      canceledOrders,
      totalProducts,
      totalRevenue: totalRevenue[0]?.total || 0,
      revenueOverTime,
      ordersPerProduct,
    };
    console.log("📤 Response object:", response);
    res.json(response);
  } catch (error) {
    console.error("❌ Error in getAdminStats:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getAdminProfile = async (req, res) => {
  try {
    if (!req.admin || !req.admin.id) {
      return res
        .status(401)
        .json({ error: "Unauthorized: Admin not authenticated" });
    }

    const admin = await Admin.findById(req.admin.id).select("email");
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    res.json({ email: admin.email });
  } catch (error) {
    console.error("❌ Error in getAdminProfile:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ error: "Admin not found" });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    admin.resetPasswordToken = resetToken;
    admin.resetPasswordExpires = Date.now() + 3600000; // 1 hour from now
    await admin.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;
    const message = `
      <h2>Password Reset Request</h2>
      <p>You are receiving this email because you (or someone else) requested a password reset for your admin account.</p>
      <p>Please click the link below to reset your password:</p>
      <a href="${resetUrl}">${resetUrl}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;

    await sendEmail(email, "🔑 Password Reset Request", message);

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("❌ Error in forgotPassword:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.verifyResetToken = async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: "Token is required" });

  const admin = await Admin.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!admin)
    return res.status(400).json({ error: "Token is invalid or expired" });

  res.json({ message: "Token is valid" });
};


exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (!token || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    const admin = await Admin.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    admin.password = newPassword;
    admin.resetPasswordToken = undefined;
    admin.resetPasswordExpires = undefined;
    await admin.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Error in resetPassword:", error);
    res.status(500).json({ error: "Server error" });
  }
};
