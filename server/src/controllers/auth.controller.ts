import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { AuthRequest } from "../types";

const INITIAL_TOKEN_BALANCE = 2;

function generateToken(userId: string): string {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "7d",
  });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });
    if (existingUser) {
      res.status(400).json({ message: "Email or username already taken" });
      return;
    }

    const user = await User.create({
      email,
      username,
      passwordHash: password,
      tokenBalance: INITIAL_TOKEN_BALANCE,
    });

    const token = generateToken(String(user._id));
    res.status(201).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = generateToken(String(user._id));
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
}
