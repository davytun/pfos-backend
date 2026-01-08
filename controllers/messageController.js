const Message = require("../models/messageModel");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

exports.createMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const newMessage = new Message({
      name,
      email,
      message,
    });

    await newMessage.save();


    // Send notification to admin
    const adminEmail = "davidakintunde433@gmail.com";
    const mailOptions = {
      from: `"PFOS" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: "New Customer Message",
      html: `
                <h2>New Message Received</h2>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong> ${message}</p>
                <p><strong>Received:</strong> ${new Date().toLocaleString()}</p>
            `,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: "Message received successfully" });
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Get all messages
exports.getMessages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalMessages = await Message.countDocuments();
    res.json({
      messages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Toggle read/unread status of a message
exports.toggleReadStatus = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    message.isRead = !message.isRead;
    await message.save();
    res.json({ message: "Message status updated successfully" });
  } catch (error) {
    console.error("Error toggling message read status:", error);
    res.status(500).json({ error: "Server error" });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }
    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.error("Error deleting message:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.replyToMessage = async (req, res) => {
  try {
    const { messageId, reply } = req.body;

    if (!messageId || !reply) {
      return res
        .status(400)
        .json({ error: "Message ID and reply are required" });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const emailMessage = `
            <h2>Reply from Solar Product Sales</h2>
            <p>Dear ${message.name},</p>
            <p>We have received your message:</p>
            <blockquote>${message.message}</blockquote>
            <p>Our response:</p>
            <p>${reply}</p>
            <p>Thank you for reaching out!</p>
            <p>Best regards,<br>Solar Product Sales Team</p>
        `;

    const mailOptions = {
      from: `"PFOS" <${process.env.EMAIL_USER}>`,
      to: message.email,
      subject: "Reply to Your Message",
      html: emailMessage,
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reply sent successfully" });
  } catch (error) {
    console.error("Error sending reply:", error);
    res.status(500).json({ error: "Server error" });
  }
};
