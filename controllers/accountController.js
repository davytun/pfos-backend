const Account = require("../models/accountModel");

// Get account details
exports.getAccount = async (req, res) => {
  try {
    const account = await Account.findOne();
    if (!account) {
      return res.status(404).json({ error: "Account details not found" });
    }
    res.json(account);
  } catch (error) {
    console.error("Error fetching account:", error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.updateAccount = async (req, res) => {
  try {
    const { accountNumber, bankName, accountName } = req.body;

    if (!accountNumber || !bankName || !accountName) {
      return res.status(400).json({ error: "All fields are required" });
    }

    let account = await Account.findOne();
    if (!account) {
      account = new Account({
        accountNumber,
        bankName,
        accountName,
        updatedAt: Date.now(),
      });
    } else {
      account.accountNumber = accountNumber;
      account.bankName = bankName;
      account.accountName = accountName;
      account.updatedAt = Date.now();
    }

    await account.save();
    res.json({ message: "Account details updated successfully", account });
  } catch (error) {
    console.error("Error updating account:", error);
    res.status(500).json({ error: "Server error" });
  }
};
