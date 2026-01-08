const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // 🔥 Create Indexes for faster queries
    const Order = require("../models/orderModel");
    Order.collection.createIndex({ createdAt: -1 });
    Order.collection.createIndex({ orderStatus: 1 });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
