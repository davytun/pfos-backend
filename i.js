const Order = require("../models/orderModel");
const sendEmail = require("../utils/sendEmail");

// Place an order
exports.placeOrder = async (req, res) => {
  try {
    const { name, email, phone, address, cart, totalPrice } = req.body;

    if (!name || !email || !phone || !address || !cart || cart.length === 0) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const order = new Order({ name, email, phone, address, cart, totalPrice });
    await order.save();

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Get all orders with pagination
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // Only fetch 10 orders per request
    const skip = (page - 1) * limit;

    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalOrders = await Order.countDocuments(); // Total order count

    res.json({
      orders,
      totalOrders,
      totalPages: Math.ceil(totalOrders / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get a single order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { orderStatus } = req.body;

    if (!["pending", "shipped", "canceled"].includes(orderStatus)) {
      return res.status(400).json({ error: "Invalid order status" });
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { orderStatus },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Send email to user
    const emailMessage = `Your order status has been updated to ${orderStatus}.`;
    await sendEmail(updatedOrder.email, "Order Status Update", emailMessage);

    res.json({
      message: `Order status updated to ${orderStatus}`,
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};

exports.placeOrder = async (req, res) => {
  try {
    const { name, email, phone, address, cart, totalPrice } = req.body;

    if (!name || !email || !phone || !address || cart.length === 0) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Save order to the database
    const order = new Order({ name, email, phone, address, cart, totalPrice });
    await order.save();

    // Send confirmation email to customer
    const customerEmail = `
      <h2>Order Confirmation</h2>
      <p>Hello ${name},</p>
      <p>Thank you for shopping with us! Your order has been placed successfully.</p>
      <p><strong>Total:</strong> $${totalPrice}</p>
      <p>We will update you once your order is shipped.</p>
    `;
    await sendEmail(email, "🛒 Order Confirmation", customerEmail);

    // Send email notification to the admin
    const adminEmail = `
      <h2>New Order Received</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Address:</strong> ${address}</p>
      <p><strong>Total Price:</strong> $${totalPrice}</p>
      <h3>Order Items:</h3>
      <ul>
        ${cart
          .map(
            (item) =>
              `<li>${item.product} - ${item.quantity} x $${item.price}</li>`
          )
          .join("")}
      </ul>
      <p>Check the admin dashboard for more details.</p>
    `;
    await sendEmail(process.env.ADMIN_EMAIL, "🚀 New Order Placed", adminEmail);

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    res.status(500).json({ error: "Server error", details: error.message });
  }
};
