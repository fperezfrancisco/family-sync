import { Server } from "socket.io";
import jwt from "jsonwebtoken";

class SocketService {
  private io: Server | null = null;

  initialize(server: Server) {
    this.io = server;
    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.io) return;

    // Auth middleware - temporarily disabled for basic setup
    // this.io.use((socket, next) => {
    //   const token = socket.handshake.auth.token;
    //   if (!token) {
    //     return next(new Error("Authentication error: No token provided"));
    //   }
    //   try {
    //     const decoded = jwt.verify(
    //       token,
    //       process.env.JWT_SECRET || "default_secret"
    //     ) as { userId: string };
    //     (socket as any).userId = decoded.userId;
    //     next();
    //   } catch (err) {
    //     return next(new Error("Authentication error: Invalid token"));
    //   }
    // });

    this.io.on("connection", (socket) => {
      console.log("A user connected:", socket.id);

      // Handle joining group chat rooms
      socket.on("join_group", (groupId: string) => {
        try {
          socket.join(groupId);
          console.log(`User ${socket.id} joined group ${groupId}`);

          // Notify others in the group
          socket.to(groupId).emit("user_joined", {
            userId: socket.id, // Using socket.id temporarily
            timestamp: new Date(),
          });
        } catch (error) {
          console.error(`Error joining group ${groupId}:`, error);
          socket.emit("error", { message: "Failed to join group" });
        }
      });

      socket.on("leave_group", (groupId: string) => {
        try {
          socket.leave(groupId);
          console.log(`User ${socket.id} left group ${groupId}`);

          // Notify others in the group
          socket.to(groupId).emit("user_left", {
            userId: socket.id, // Using socket.id temporarily
            timestamp: new Date(),
          });
        } catch (error) {
          console.error(`Error leaving group ${groupId}:`, error);
        }
      });

      socket.on("send_message", (data: any) => {
        try {
          console.log("Message received:", data);

          // Create the message with a proper ID
          const message = {
            ...data,
            id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date(),
          };

          // Broadcast to all users in the group EXCEPT the sender
          // (sender already has optimistic update on frontend)
          socket.to(data.groupId).emit("message_received", message);

          console.log(
            `Message broadcasted to group ${data.groupId} (excluding sender):`,
            message.content
          );
        } catch (error) {
          console.error("Error handling message:", error);
          socket.emit("error", { message: "Failed to send message" });
        }
      });

      // Handle typing indicators
      socket.on("typing_start", ({ groupId }: { groupId: string }) => {
        try {
          // Broadcast to others in the group (exclude sender)
          socket.to(groupId).emit("typing_start", {
            userId: socket.id, // Using socket.id temporarily until auth is enabled
            groupId,
          });
        } catch (error) {
          console.error("Error handling typing_start:", error);
        }
      });

      socket.on("typing_stop", ({ groupId }: { groupId: string }) => {
        try {
          // Broadcast to others in the group (exclude sender)
          socket.to(groupId).emit("typing_stop", {
            userId: socket.id, // Using socket.id temporarily until auth is enabled
            groupId,
          });
        } catch (error) {
          console.error("Error handling typing_stop:", error);
        }
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }
}

export const socketService = new SocketService();
