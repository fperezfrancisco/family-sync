import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import groupsRoutes from "./routes/groups.js";
import eventsRoutes from "./routes/events.js";
// INVITATION SYSTEM: Import invitation routes
import invitationsRoutes from "./routes/invitations.js";
// TASK SYSTEM: Import task routes
import tasksRoutes from "./routes/tasks.js";
// MESSAGE SYSTEM: Import message routes
import messagesRoutes from "./routes/messages.js";
// EVENT COMMENT SYSTEM: Import event comment routes
import eventCommentsRoutes from "./routes/eventComments.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { socketService } from "./services/socketServices.js";
// MESSAGE SYSTEM: Import cleanup utility
import { scheduleMessageCleanup } from "./utils/messageCleanup.js";
// RATE LIMITING: Import rate limiters
import { generalLimiter, testLimiter } from "./middleware/rateLimiter.js";

// Configure dotenv first
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Environment-based CORS configuration
const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        process.env.CLIENT_URL || "https://thebettertogher.app",
        process.env.API_URL || "https://api.thebettertogether.app",
      ]
    : [
        "http://localhost:4000",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://192.168.0.5:3000", // Network IP for cross-device access
        "http://192.168.0.5:4000", // Network IP for backend access
        "http://127.0.0.1:5500", // For testing HTML files served locally
        "file://", // For HTML files opened directly in browser
      ];

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

// RATE LIMITING: Apply general rate limiting to all routes
if (process.env.NODE_ENV === "production") {
  console.log(
    "🛡️  Production rate limiting: 100 general requests, 50 auth requests per 15 minutes"
  );
  console.log(
    "🔒 Family-friendly login/register limiting: 30 attempts per 15 minutes"
  );
  console.log("👨‍👩‍👧‍👦 Optimized for family households on shared networks");
} else {
  console.log("🧪 Development mode: Rate limiting relaxed for testing");
  console.log("   • General API: 10,000 requests per 15 minutes");
  console.log("   • Auth endpoints: Unlimited");
  console.log("   • Login/Register: Unlimited");
}
app.use(generalLimiter);

app.get("/", (req, res) => {
  res.send("Hello from the Backend Server!");
});

// Test endpoint for rate limiting demonstration
app.get("/test-rate-limit", testLimiter, (req, res) => {
  res.json({
    success: true,
    message: "Rate limiting test endpoint - 3 requests per minute limit",
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });
});

app.use(express.json());

app.use("/auth", authRoutes);
app.use("/groups", groupsRoutes);
app.use("/events", eventsRoutes);
// INVITATION SYSTEM: Register invitation routes
app.use("/invitations", invitationsRoutes);
// TASK SYSTEM: Register task routes
app.use("/tasks", tasksRoutes);
// MESSAGE SYSTEM: Register message routes (all authenticated)
app.use("/messages", messagesRoutes);
// EVENT COMMENT SYSTEM: Register event comment routes (all authenticated)
app.use("/event-comments", eventCommentsRoutes);

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

    // MESSAGE SYSTEM: Start automatic message cleanup (30-day retention)
    scheduleMessageCleanup(30);

    // Start the server - bind to all interfaces (0.0.0.0) for network access
    httpServer.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`API listening on http://localhost:${PORT}`);
      console.log(`🌐 Network access: http://192.168.0.5:${PORT}`);
      console.log(`💬 Message persistence system initialized`);
      console.log(`🧹 Automatic cleanup: 30-day message retention`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
    process.exit(1);
  }
};

startServer();
