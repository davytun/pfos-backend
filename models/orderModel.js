const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    cart: { type: Array, required: true },
    totalPrice: { type: Number, required: true },
    orderStatus: {
      type: String,
      enum: ["pending", "shipped", "canceled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

orderSchema.index({ orderStatus: 1 });

module.exports = mongoose.model("Order", orderSchema);
