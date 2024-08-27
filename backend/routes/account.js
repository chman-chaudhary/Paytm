const express = require("express");
const { authMiddleware } = require("../middleware");
const { Account } = require("../db.js");
const { default: mongoose } = require("mongoose");
const router = express.Router();

// Get Balance
router.get("/balance", authMiddleware, async (req, res) => {
  const account = await Account.findOne({
    userId: req.userId,
  });
  res.json({
    balance: account.balance,
  });
});

// Transfer Balance
router.post("/transfer", authMiddleware, async (req, res) => {
  try {
    const session = await mongoose.startSession();

    const { amount, to } = req.body;

    const account = await Account.findOne({ userId: req.userId });

    if (!account || account.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Insufficient Balance",
      });
    }

    const toAccount = await Account.findOne({ userId: to });

    if (!toAccount) {
      await session.abortTransaction();
      return res.status(400).json({
        message: "Invalid Account",
      });
    }

    await Account.updateOne(
      { userId: req.userId },
      { $inc: { balance: -amount } }
    ).session();
    await Account.updateOne(
      { userId: to },
      { $inc: { balance: amount } }
    ).session();

    return res.json({
      message: "Transfer Successful",
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: "ERROR OCCUR",
    });
  }
});

module.exports = router;
