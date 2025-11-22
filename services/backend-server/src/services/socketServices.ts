import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Messages.js";
import Group from "../models/Groups.js";

/**
 * SOCKET.IO SERVICE WITH MESSAGE PERSISTENCE
 *
 * Enhanced to include:
 * - Database storage for all messages
 * - Message history loading on group join
 * - Automatic cleanup of old messages
 * - Error handling and logging
 */

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

      // Handle joining group chat rooms with message history loading
      socket.on("join_group", async (groupId: string) => {
        try {
          socket.join(groupId);
          console.log(`💬 User ${socket.id} joined group ${groupId}`);

          // Load and send recent message history (last 50 messages)
          const recentMessages = await (Message as any).getGroupMessages(
            groupId,
            50
          );

          // Send message history to the joining user only
          if (recentMessages && recentMessages.length > 0) {
            const formattedMessages = recentMessages
              .reverse()
              .map((msg: any) => ({
                id: msg._id.toString(),
                content: msg.content,
                senderId: msg.senderId.toString(),
                senderName: msg.senderName,
                groupId: msg.groupId.toString(),
                timestamp: msg.createdAt,
                type: msg.type,
                isEdited: msg.isEdited,
                replyToMessageId: msg.replyToMessageId?.toString() || null,
              }));

            socket.emit("message_history", formattedMessages);
            console.log(
              `📜 Sent ${formattedMessages.length} recent messages to user ${socket.id}`
            );
          }

          // Notify others in the group about the new user
          socket.to(groupId).emit("user_joined", {
            userId: socket.id, // Using socket.id temporarily
            timestamp: new Date(),
          });
        } catch (error) {
          console.error(`❌ Error joining group ${groupId}:`, error);
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

      socket.on("send_message", async (data: any) => {
        try {
          console.log("💬 Message received:", data.content);

          // Save message to database first
          const messageDoc = new Message({
            content: data.content,
            senderId: data.senderId,
            senderName: data.senderName,
            groupId: data.groupId,
            type: data.type || "text",
          });

          const savedMessage = await messageDoc.save();
          console.log(
            `💾 Message saved to database with ID: ${savedMessage._id}`
          );

          // Create formatted message for broadcasting
          const broadcastMessage = {
            id: savedMessage._id.toString(),
            content: savedMessage.content,
            senderId: savedMessage.senderId.toString(),
            senderName: savedMessage.senderName,
            groupId: savedMessage.groupId.toString(),
            timestamp: savedMessage.createdAt,
            type: savedMessage.type,
            isEdited: false,
            replyToMessageId: null,
          };

          // Broadcast to all users in the group EXCEPT the sender
          // (sender already has optimistic update on frontend)
          socket.to(data.groupId).emit("message_received", broadcastMessage);

          console.log(
            `📤 Message broadcasted to group ${data.groupId} (excluding sender): "${data.content}"`
          );
        } catch (error) {
          console.error("❌ Error handling message:", error);
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
