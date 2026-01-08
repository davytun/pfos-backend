const mongoose = require("mongoose");
const Account = require("../models/accountModel");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI);

const seedAccount = async () => {
  try {
    await Account.deleteMany();
    const account = new Account({
      accountNumber: "1234567890",
      bankName: "First Bank",
      accountName: "Solar Product Sales",
    });
    await account.save();
    console.log("Account details seeded successfully");
  } catch (error) {
    console.error("Error seeding account:", error);
  } finally {
    mongoose.connection.close();
  }
};

seedAccount();
