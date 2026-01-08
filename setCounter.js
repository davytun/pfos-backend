const mongoose = require("mongoose");
const Order = require("./models/orderModel");
const Counter = require("./models/counterModel");

mongoose.connect(process.env.MONGO_URI);

async function setCounter() {
  try {
    // Find the highest orderNumber
    const lastOrder = await Order.findOne().sort({ orderNumber: -1 });
    if (!lastOrder || !lastOrder.orderNumber) {
      console.log("No orders found. Setting counter to 0.");
      await Counter.findOneAndUpdate(
        { _id: "orderNumber" },
        { sequence: 0 },
        { upsert: true }
      );
      return;
    }

    const lastOrderNumber = parseInt(lastOrder.orderNumber, 10);
    console.log(`Highest orderNumber found: ${lastOrder.orderNumber}`);

    // Set the counter to the last orderNumber
    await Counter.findOneAndUpdate(
      { _id: "orderNumber" },
      { sequence: lastOrderNumber },
      { upsert: true }
    );
    console.log(`Counter set to sequence: ${lastOrderNumber}`);

    mongoose.connection.close();
  } catch (error) {
    console.error("Error setting counter:", error);
    mongoose.connection.close();
  }
}

setCounter();
