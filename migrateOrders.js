const mongoose = require("mongoose");
const Order = require("./models/orderModel");

mongoose.connect(process.env.MONGO_URI);

async function migrateOrders() {
  try {
    const orders = await Order.find({ orderNumber: { $exists: false } }).sort({
      createdAt: 1,
    });

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];
      const newOrderNumber = (i + 1).toString().padStart(6, "0");
      order.orderNumber = newOrderNumber;
      await order.save();
      console.log(
        `Updated order ${order._id} with orderNumber ${newOrderNumber}`
      );
    }

    console.log("Migration completed!");
    mongoose.connection.close();
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.connection.close();
  }
}

migrateOrders();
