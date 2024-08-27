const express = require("express");
const router = express.Router();
const { JWT_SECRET } = require("../config.js");
const zod = require("zod");
const jwt = require("jsonwebtoken");
const { authMiddleware } = require("../middleware.js");
const { User, Account } = require("../db.js");

// ------------Signup body---------------
const signupBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
});

// ------------Signup Route---------------
router.post("/signup", async (req, res) => {
  const { success } = signupBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const existingUser = await User.findOne({
    username: req.body.username,
  });

  if (existingUser) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }

  const user = await User.create({
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: req.body.password,
  });

  await Account.create({
    userId: user._id,
    balance: 1 + Math.random() * 10000,
  });

  const userId = user._id;

  const token = jwt.sign(
    {
      userId,
    },
    JWT_SECRET
  );

  return res.json({
    message: "User created successfully",
    token: token,
  });
});

// -------------Singin body---------------
const signinBody = zod.object({
  username: zod.string(),
  password: zod.string(),
});

// -------------Singin Route--------------
router.post("/signin", async (req, res) => {
  const { success } = signinBody.safeParse(req.body);

  if (!success) {
    res.status(411).json({
      message: "Incorrect Inputs",
    });
  }

  const user = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (user) {
    const userId = user._id;
    const token = jwt.sign({ userId }, JWT_SECRET);

    res.json({
      token: token,
    });

    return;
  }

  res.status(411).json({
    message: "Error while logging in",
  });
  return;
});

// -------------Update Body---------------
const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

// -------------Update Route---------------
router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Error while updating user",
    });
  }

  await User.updateOne(req.body, { id: req.userId });

  res.json({
    message: "Updated Successfully",
  });
});

// -------------Search Users---------------
router.get("/bulk", async (req, res) => {
  const filter = req.query.filter || "";

  const users = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
        lastName: {
          $regex: filter,
        },
      },
    ],
  });

  res.json({
    user: users.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      id: user._id,
    })),
  });
});

module.exports = router;
