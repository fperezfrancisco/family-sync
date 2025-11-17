import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import User from "../models/User.js";
import { create } from "domain";

const router = Router();

// zod schemas for request validation

const RegisterSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

// ROUTES

// Register route
router.post("/register", async (req, res) => {
  // Validate request body
  const { name, email, password } = RegisterSchema.parse(req.body);
  // check db if user exists and handle db registration logic
  const passwordHash = await bcrypt.hash(password, 12);
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "User already exists" });
  }
  const userObject = {
    name,
    email,
    passwordHash,
    dob: null,
    gender: null,
    phone: null,
    groups: [],
  };
  const createdUser = await User.create(userObject);
  return res.status(201).json({
    message: "User registered",
    user: {
      id: createdUser._id,
      name: createdUser.name,
      email: createdUser.email,
      dob: createdUser.dob,
      gender: createdUser.gender,
      phone: createdUser.phone,
      groups: createdUser.groups,
    },
  });
});

// Login Route
router.post("/login", async (req, res) => {
  // Validate request body
  const { email, password } = LoginSchema.parse(req.body);
  // check db for user and handle login logic
  const user = await User.findOne({ email });
  if (!user) {
    return res
      .status(404)
      .json({ message: "User not found. Please register first." });
  }
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    return res.status(401).json({ message: "Invalid credentials" });
  }
  return res.status(200).json({
    message: "Login successful",
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      dob: user.dob,
      gender: user.gender,
      phone: user.phone,
      groups: user.groups,
    },
  });
});

export default router;
