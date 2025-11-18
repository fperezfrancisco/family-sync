import express from "express";
import authRoutes from "./routes/auth.js";
import groupsRoutes from "./routes/groups.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// Configure dotenv first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = ["http://localhost:4000", "http://localhost:3000"];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.send("Hello from the Backend Server!");
});

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/groups", groupsRoutes);

// start server
const startServer = async () => {
  try {
    // Check if MONGO_URI exists
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected successfully");

    // Start the server
    app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
