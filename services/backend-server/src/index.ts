import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import groupsRoutes from "./routes/groups.js";
import eventsRoutes from "./routes/events.js";
// INVITATION SYSTEM: Import invitation routes
import invitationsRoutes from "./routes/invitations.js";
// TASK SYSTEM: Import task routes
import tasksRoutes from "./routes/tasks.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { socketService } from "./services/socketServices.js";

// Configure dotenv first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = ["http://localhost:4000", "http://localhost:3000"];

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
};

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

app.use(cors(corsOptions));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello from the Backend Server!");
});

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/groups", groupsRoutes);
app.use("/events", eventsRoutes);
// INVITATION SYSTEM: Register invitation routes
app.use("/invitations", invitationsRoutes);
// TASK SYSTEM: Register task routes
app.use("/tasks", tasksRoutes);

// Initialize socket service (handles all connection logic)
socketService.initialize(io);

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
    httpServer.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
