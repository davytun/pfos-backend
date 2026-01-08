const mongoose = require("mongoose");
const Message = require("../models/messageModel");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const seedMessages = async () => {
  try {
    await Message.deleteMany(); // Clear existing messages
    const messages = [
      {
        name: "John Doe",
        email: "john.doe@example.com",
        message:
          "I have a question about your solar panels. Can you provide more details?",
        createdAt: new Date(),
        isRead: false,
      },
      {
        name: "Jane Smith",
        email: "jane.smith@example.com",
        message:
          "I’d like to schedule a consultation for a solar installation.",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        isRead: true,
      },
    ];
    await Message.insertMany(messages);
    console.log("Messages seeded successfully");
  } catch (error) {
    console.error("Error seeding messages:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedMessages();
