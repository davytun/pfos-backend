const mongoose = require("mongoose");
const Admin = require("./models/adminModel");
require("dotenv").config();

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI)
    console.log("🚀 Connected to MongoDB for admin setup");

    // Check if an admin already exists
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      console.log("🟡 Admin already exists:", existingAdmin.email);
      process.exit(0);
    }

    // Create a new admin with email and password from environment variables
    const email = process.env.CREATE_ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
      console.error(
        "❌ CREATE_ADMIN_EMAIL and ADMIN_PASSWORD must be set in the .env file"
      );
      process.exit(1);
    }

    const admin = new Admin({ email, password });
    await admin.save();

    console.log("✅ Admin created successfully:", email);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error setting up admin:", error);
    process.exit(1);
  }
}

setupAdmin();
