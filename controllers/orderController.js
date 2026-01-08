const Order = require("../models/orderModel");
const Account = require("../models/accountModel"); // Keep this for account details
const sendEmail = require("../utils/sendEmail");
const { getNextSequence } = require("../utils/counter");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");

// Place an order
exports.placeOrder = async (req, res) => {
  try {
    const { name, email, phone, address, cart, totalPrice } = req.body;

    console.log("Received order request:", req.body);

    if (
      !name ||
      !email ||
      !phone ||
      !address ||
      !cart ||
      !Array.isArray(cart) ||
      cart.length === 0
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    for (const item of cart) {
      if (!item.name || !item.price || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({ error: "Invalid cart item" });
      }
    }

    const calculatedTotalPrice = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    if (totalPrice !== calculatedTotalPrice) {
      return res.status(400).json({ error: "Total price mismatch" });
    }

    const sequence = await getNextSequence("orderNumber");
    const formattedOrderNumber = sequence.toString().padStart(6, "0");

    const order = new Order({
      orderNumber: formattedOrderNumber,
      name,
      email,
      phone,
      address,
      cart,
      totalPrice: calculatedTotalPrice,
      orderStatus: "pending",
    });
    await order.save();

    // Generate PDF Invoice in /tmp directory
    const pdfPath = path.join("/tmp", `invoice-${formattedOrderNumber}.pdf`);
    const doc = new PDFDocument({ margin: 50 });
    doc.pipe(fs.createWriteStream(pdfPath));

    // [PDF generation code remains unchanged...]
    doc.end();

    // Fetch account details FIRST
    let accountDetails = {
      accountNumber: "Not available",
      bankName: "Not available",
      accountName: "Not available",
    };
    try {
      const account = await Account.findOne();
      if (account) {
        accountDetails = {
          accountNumber: account.accountNumber,
          bankName: account.bankName,
          accountName: account.accountName,
        };
      }
    } catch (error) {
      console.error("Error fetching account details:", error);
    }

    // Define invoiceEmail AFTER accountDetails is initialized
    const invoiceEmail = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f4f4f4;">
      <div style="background-color: #002347; padding: 20px; text-align: center;">
        <img src="https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/logo.png" alt="Solar Product Sales Logo" style="max-width: 150px;" />
      </div>
      <div style="background-color: #ffffff; padding: 30px;">
        <h1 style="font-size: 24px; color: #002347; margin: 0 0 20px;">Invoice</h1>
        <p style="font-size: 16px; color: #333333; margin: 0 0 10px;">Hello ${name},</p>
        <p style="font-size: 16px; color: #333333; margin: 0 0 20px;">Thank you for your order! Below is your invoice for Order #${formattedOrderNumber}. A PDF version is attached for your records.</p>
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #002347; margin: 0 0 10px;">Order Summary</h2>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Order Number:</strong> ${formattedOrderNumber}</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Payment Method:</strong> Bank Transfer</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Estimated Delivery:</strong> ${new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000
          ).toLocaleDateString()}</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #002347; margin: 0 0 10px;">Payment Details</h2>
          <p style="font-size: 14px; color: #333333; margin: 0 0 10px;">Please make the payment to the following account:</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Account Number:</strong> ${
            accountDetails.accountNumber
          }</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Bank Name:</strong> ${
            accountDetails.bankName
          }</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Account Name:</strong> ${
            accountDetails.accountName
          }</p>
          <p style="font-size: 14px; color: #333333; margin: 0 0 10px;">Kindly send proof of payment to <a href="mailto:support@solarproductsales.com" style="color: #FBB610; text-decoration: none;">support@solarproductsales.com</a> to confirm your order.</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #002347; margin: 0 0 10px;">Billing Information</h2>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Name:</strong> ${name}</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Email:</strong> ${email}</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Phone:</strong> ${phone}</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Shipping Address:</strong> ${address}</p>
        </div>
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; color: #002347; margin: 0 0 10px;">Order Items</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f9f9f9;">
                <th style="font-size: 14px; color: #333333; padding: 10px; text-align: left; border-bottom: 1px solid #e0e0e0;">Item</th>
                <th style="font-size: 14px; color: #333333; padding: 10px; text-align: center; border-bottom: 1px solid #e0e0e0;">Qty</th>
                <th style="font-size: 14px; color: #333333; padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">Price</th>
                <th style="font-size: 14px; color: #333333; padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${cart
                .map(
                  (item) => `
                    <tr>
                      <td style="font-size: 14px; color: #333333; padding: 10px; border-bottom: 1px solid #e0e0e0;">${
                        item.name
                      }</td>
                      <td style="font-size: 14px; color: #333333; padding: 10px; text-align: center; border-bottom: 1px solid #e0e0e0;">${
                        item.quantity
                      }</td>
                      <td style="font-size: 14px; color: #333333; padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">₦${item.price.toLocaleString()}</td>
                      <td style="font-size: 14px; color: #333333; padding: 10px; text-align: right; border-bottom: 1px solid #e0e0e0;">₦${(
                        item.price * item.quantity
                      ).toLocaleString()}</td>
                    </tr>
                  `
                )
                .join("")}
            </tbody>
          </table>
        </div>
        <div style="text-align: right; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Subtotal:</strong> ₦${calculatedTotalPrice.toLocaleString()}</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;"><strong>Shipping Fee:</strong> ₦0</p>
          <p style="font-size: 16px; color: #002347; font-weight: bold; margin: 5px 0;"><strong>Total:</strong> ₦${totalPrice.toLocaleString()}</p>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <a href="https://pfos-frontend.pages.dev/track-order/${
            order._id
          }" style="display: inline-block; background-color: #FBB610; color: #002347; font-size: 16px; font-weight: bold; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Your Order</a>
        </div>
        <div style="text-align: center; margin-bottom: 30px;">
          <p style="font-size: 14px; color: #666666; margin: 0;">Thank you for choosing Solar Product Sales! We’ll notify you once your order is shipped.</p>
          <p style="font-size: 14px; color: #666666; margin: 5px 0;">Need help? Contact us at <a href="mailto:support@solarproductsales.com" style="color: #FBB610; text-decoration: none;">support@solarproductsales.com</a> or +234 903 276 9065.</p>
        </div>
      </div>
      <div style="background-color: #002347; padding: 15px; text-align: center;">
        <p style="font-size: 12px; color: #B0CFEF; margin: 0;">Solar Product Sales | PFDOS Enterprise RC: 3334515 | © 2025 All Rights Reserved</p>
        <p style="font-size: 12px; color: #B0CFEF; margin: 5px 0;">
          Follow us on 
          <a href="https://facebook.com/Power-from-the-other-side" style="color: #FBB610; text-decoration: none;">Facebook</a> | 
          <a href="https://instagram.com/pfos_Solar" style="color: #FBB610; text-decoration: none;">Instagram</a> | 
          <a href="https://wa.me/+2349032769065" style="color: #FBB610; text-decoration: none;">WhatsApp</a>
        </p>
      </div>
    </div>
    `;

    // Send customer email
    try {
      console.log(`Sending invoice email to ${email}...`);
      await sendEmail(
        email,
        `🧾 Invoice - Order #${formattedOrderNumber}`,
        invoiceEmail,
        [{ filename: `invoice-${formattedOrderNumber}.pdf`, path: pdfPath }]
      );
      console.log(`Invoice email sent successfully to ${email}`);
    } catch (emailError) {
      console.error(`Failed to send invoice email to ${email}:`, emailError);
    }

    // Clean up the PDF file
    try {
      await fsPromises.unlink(pdfPath);
      console.log(`Successfully deleted ${pdfPath}`);
    } catch (unlinkError) {
      console.error(`Failed to delete ${pdfPath}:`, unlinkError);
    }

    // Send admin email
    const adminEmail = `
      <h2>New Order Received</h2>
      <p><strong>Order Number:</strong> ${formattedOrderNumber}</p>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Address:</strong> ${address}</p>
      <p><strong>Total Price:</strong> ₦${totalPrice}</p>
      <h3>Order Items:</h3>
      <ul>
        ${cart
          .map(
            (item) =>
              `<li>${item.name} - ${item.quantity} x ₦${item.price}</li>`
          )
          .join("")}
      </ul>
      <h3>Payment Details:</h3>
      <p>Please provide the following account details to the customer for payment:</p>
      <p><strong>Account Number:</strong> ${accountDetails.accountNumber}</p>
      <p><strong>Bank Name:</strong> ${accountDetails.bankName}</p>
      <p><strong>Account Name:</strong> ${accountDetails.accountName}</p>
      <p>Check the admin dashboard for more details.</p>
    `;

    try {
      console.log(`Sending admin email to ${process.env.ADMIN_EMAIL}...`);
      await sendEmail(
        process.env.ADMIN_EMAIL,
        "🚀 New Order Placed",
        adminEmail,
        []
      );
      console.log(
        `Admin email sent successfully to ${process.env.ADMIN_EMAIL}`
      );
    } catch (adminEmailError) {
      console.error(
        `Failed to send admin email to ${process.env.ADMIN_EMAIL}:`,
        adminEmailError
      );
    }

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (error) {
    console.error("Order error:", error);
    res.status(500).json({ error: "Server error", details: error.message });
  }
};

// Get all orders with pagination
exports.getOrders = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || ""; // Get the search query parameter

    // Build the query
    let query = {};
    if (search) {
      // Search by orderNumber (case-insensitive)
      query.orderNumber = { $regex: search, $options: "i" };
    }

    console.log("🔍 Orders Query:", query);

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("❌ Error in getOrders:", error);
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

// Update order status
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

    const emailMessage = `Your order (Order #${updatedOrder.orderNumber}) status has been updated to ${orderStatus}.`;
    await sendEmail(updatedOrder.email, "Order Status Update", emailMessage);

    res.json({
      message: `Order status updated to ${orderStatus}`,
      order: updatedOrder,
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
};
