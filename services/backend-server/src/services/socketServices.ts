import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import Message from "../models/Messages.js";
import Group from "../models/Groups.js";
import { readStateService } from "./readStateService.js";

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

  // Helper method to detect platform from user agent
  private detectPlatform(userAgent?: string): string {
    if (!userAgent) return "unknown";

    const ua = userAgent.toLowerCase();

    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return "mobile";
    } else if (ua.includes("tablet") || ua.includes("ipad")) {
      return "tablet";
    } else {
      return "desktop";
    }
  }

  // Helper method to check if userId is a valid ObjectId (vs temporary socket.id)
  private isValidObjectId(userId: string): boolean {
    // ObjectId must be 24 character hex string
    return /^[0-9a-fA-F]{24}$/.test(userId);
  }

  // Helper method to safely get user ID from authenticated socket
  private getUserIdForReadState(socket: any): string | null {
    // Get user ID from JWT token (set by auth middleware)
    const userId = (socket as any).userId;

    if (!userId) {
      console.log("⚠️ No authenticated user ID found in socket");
      return null;
    }

    // Verify it's a valid ObjectId
    if (!this.isValidObjectId(userId)) {
      console.log(`⚠️ Invalid user ID format: ${userId}`);
      return null;
    }

    return userId;
  }

  private setupEventHandlers() {
    if (!this.io) return;

    // Auth middleware - JWT token verification
    this.io.use((socket, next) => {
      const token = socket.handshake.auth.token;

      console.log("🔐 Socket.IO Auth Debug:", {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        tokenType: token ? (token.includes(".") ? "JWT" : "Other") : null,
      });

      if (!token) {
        console.log("❌ Socket connection denied: No token provided");
        return next(new Error("Authentication error: No token provided"));
      }

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET || "default_secret"
        ) as { sub: string; type: string };

        console.log("🔍 JWT Decoded:", {
          sub: decoded.sub,
          type: decoded.type,
          isValidObjectId: /^[0-9a-fA-F]{24}$/.test(decoded.sub),
        });

        // Use 'sub' field as userId (JWT standard)
        (socket as any).userId = decoded.sub;
        console.log(`✅ Socket authenticated for user: ${decoded.sub}`);
        next();
      } catch (err) {
        console.log(`❌ Socket authentication failed:`, {
          error: err instanceof Error ? err.message : "Invalid token",
          tokenPreview: token ? `${token.substring(0, 30)}...` : null,
        });
        return next(new Error("Authentication error: Invalid token"));
      }
    });

    this.io.on("connection", async (socket) => {
      console.log("A user connected:", socket.id);

      // Add this before the get_unread_counts handler
      socket.onAny((eventName, ...args) => {
        console.log(
          `🔍 DEBUG: Received event '${eventName}' from socket ${socket.id}:`,
          args
        );
      });

      // Send initial read states for the user (only if auth is enabled)
      try {
        const userId = this.getUserIdForReadState(socket);
        if (userId) {
          const readStates = await readStateService.getUserReadStates(userId);

          // Send read states to newly connected client
          socket.emit("read_states", readStates);
          console.log(`📚 Sent initial read states for user ${userId}:`, {
            groupCount: Object.keys(readStates).length,
          });
        }
      } catch (error) {
        console.error("⚠️ Error loading initial read states:", error);
        // Don't fail connection for read state errors
      }

      // Handle viewing group (passive - no read state changes)
      socket.on("view_group", async (groupId: string) => {
        try {
          console.log(
            `👁️ User ${socket.id} viewing group ${groupId} (passive)`
          );

          // Load and send recent message history (last 50 messages) for UI display
          const recentMessages = await (Message as any).getGroupMessages(
            groupId,
            50
          );

          // Send message history to the viewing user only (no read state changes)
          // Send message history to the viewing user only
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
            /*
          if (recentMessages && recentMessages.length > 0) {
            socket.emit("message_history", {
              groupId,
              messages: recentMessages.map((msg: any) => ({
                id: msg._id.toString(),
                content: msg.content,
                senderId: msg.senderId.toString(),
                senderName: msg.senderName,
                groupId: msg.groupId.toString(),
                timestamp: msg.createdAt,
                type: msg.type || "text",
                isEdited: msg.isEdited || false,
                replyToMessageId: msg.replyToMessageId?.toString() || null,
              })),
            });
              */
            console.log(
              `📚 Sent ${recentMessages.length} messages for viewing group ${groupId}`
            );
          }

          // Send current unread count for this group (only if auth is enabled)
          try {
            const userId = this.getUserIdForReadState(socket);
            if (userId) {
              const unreadCount = await readStateService.calculateUnreadCounts(
                userId,
                [groupId]
              );

              socket.emit("unread_counts", unreadCount);
              console.log(
                `📊 Sent unread counts for viewing group ${groupId}:`,
                unreadCount
              );
            }
          } catch (readStateError) {
            console.error(
              `⚠️ Error calculating unread count for viewing group ${groupId}:`,
              readStateError
            );
          }
        } catch (error) {
          console.error(`❌ Error viewing group ${groupId}:`, error);
          socket.emit("error", { message: "Failed to view group" });
        }
      });

      // Handle batch viewing multiple groups (passive - no read state changes)
      socket.on("view_groups", async (groupIds: string[]) => {
        try {
          console.log(
            `👁️ User ${socket.id} viewing ${groupIds.length} groups (passive batch)`
          );

          const userId = this.getUserIdForReadState(socket);
          const allMessages: Record<string, any[]> = {};
          let allUnreadCounts: any[] = [];

          // Process each group
          for (const groupId of groupIds) {
            try {
              // Load message history for this group
              const recentMessages = await (Message as any).getGroupMessages(
                groupId,
                50
              );

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

                allMessages[groupId] = formattedMessages;
              }

              // Calculate unread count for this group
              if (userId) {
                const unreadCount =
                  await readStateService.calculateUnreadCounts(userId, [
                    groupId,
                  ]);
                allUnreadCounts = allUnreadCounts.concat(unreadCount);
              }
            } catch (groupError) {
              console.error(
                `⚠️ Error processing group ${groupId}:`,
                groupError
              );
              // Continue with other groups
            }
          }

          // Send all message history at once
          if (Object.keys(allMessages).length > 0) {
            socket.emit("batch_message_history", allMessages);
            console.log(
              `📚 Sent batch message history for ${
                Object.keys(allMessages).length
              } groups`
            );
          }

          // Send all unread counts at once
          if (allUnreadCounts.length > 0) {
            socket.emit("unread_counts", allUnreadCounts);
            console.log(
              `📊 Sent batch unread counts for ${allUnreadCounts.length} groups`
            );
          }
        } catch (error) {
          console.error(`❌ Error viewing groups:`, error);
          socket.emit("error", { message: "Failed to view groups" });
        }
      });

      // Handle joining group chat rooms (active - with read state updates)
      socket.on("join_group", async (groupId: string) => {
        try {
          socket.join(groupId);
          console.log(`💬 User ${socket.id} actively joined group ${groupId}`);

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

          // ACTIVE JOIN: Mark group as read and update read state
          try {
            const userId = this.getUserIdForReadState(socket);

            if (userId) {
              // Mark messages as read when actively joining
              const now = new Date();
              await readStateService.updateReadState(userId, groupId, now);

              console.log(
                `✅ Marked group ${groupId} as read for user ${userId} on active join`
              );

              // Send updated read state
              const readState = await readStateService.getReadState(
                userId,
                groupId
              );
              if (readState) {
                socket.emit("read_state_updated", {
                  userId,
                  groupId,
                  lastReadTimestamp: readState.lastReadTimestamp,
                  updatedAt: readState.updatedAt,
                });
              }

              // Send updated unread count (should be 0 now)
              const unreadCounts = await readStateService.calculateUnreadCounts(
                userId,
                [groupId]
              );
              socket.emit("unread_counts", unreadCounts);

              // Broadcast read state update to other devices/sessions
              socket.broadcast.emit("read_state_updated", {
                groupId,
                lastReadTimestamp: now.toISOString(),
                userId,
              });

              console.log(
                `📊 Updated read state for active join to group ${groupId}:`,
                {
                  unreadCount: unreadCounts,
                }
              );
            }
          } catch (readStateError) {
            console.error(
              `⚠️ Error updating read state for group ${groupId}:`,
              readStateError
            );
            // Don't fail the join operation for read state errors
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

          // Broadcast to all users in the group INCLUDING the sender
          // (sender needs server confirmation to replace optimistic update)
          this.io!.to(data.groupId).emit("message_received", broadcastMessage);

          console.log(
            `📤 Message broadcasted to group ${data.groupId} (including sender): "${data.content}"`
          );

          // Update unread counts for all group members (real-time dashboard updates)
          try {
            const group = await Group.findById(data.groupId);
            if (group && group.members) {
              console.log(
                `🔄 Updating unread counts for ${group.members.length} group members`
              );

              for (const member of group.members) {
                const memberId = member.id.toString();

                // Calculate fresh unread counts for this user
                const memberUnreadCounts =
                  await readStateService.calculateUnreadCounts(memberId);

                // Broadcast to ALL sockets of this user (not just group room)
                this.io!.emit("unread_counts_for_user", {
                  userId: memberId,
                  unreadCounts: memberUnreadCounts,
                });
              }

              console.log(
                `✅ Updated unread counts for all members of group ${data.groupId}`
              );
            }
          } catch (unreadCountError) {
            console.error(
              "❌ Error updating unread counts after message:",
              unreadCountError
            );
            // Don't fail the message send for unread count errors
          }
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

      // READ STATE MANAGEMENT EVENTS

      // Handle marking messages as read
      socket.on(
        "mark_messages_read",
        async (data: {
          groupId: string;
          lastReadTimestamp: string; // ISO string from client
          userId?: string; // Will be from auth when enabled
        }) => {
          try {
            // Get user ID and check if read states are supported
            const userId = this.getUserIdForReadState(socket);
            if (!userId) {
              // Skip read state operations when auth is not enabled
              return;
            }

            // Validate and parse timestamp from client
            console.log("🕐 Parsing timestamp:", {
              received: data.lastReadTimestamp,
              type: typeof data.lastReadTimestamp,
            });

            const lastReadTimestamp = new Date(data.lastReadTimestamp);

            if (isNaN(lastReadTimestamp.getTime())) {
              console.error("❌ Invalid timestamp received from client:", {
                received: data.lastReadTimestamp,
                parsed: lastReadTimestamp,
              });
              socket.emit("error", { message: "Invalid timestamp format" });
              return;
            }

            // Get device info from socket handshake
            const userAgent = socket.handshake.headers["user-agent"];
            const deviceInfo = userAgent
              ? {
                  userAgent,
                  platform: this.detectPlatform(userAgent),
                }
              : {
                  platform: this.detectPlatform(userAgent),
                };

            // Update read state in database
            const updatedState = await readStateService.updateReadState(
              userId,
              data.groupId,
              lastReadTimestamp,
              deviceInfo
            );

            console.log(
              `📖 User ${userId} marked messages as read in group ${
                data.groupId
              } up to ${lastReadTimestamp.toISOString()}`
            );

            // Broadcast read state update to all user's devices (same userId)
            // This will sync read state across devices when auth is enabled
            this.io!.emit("read_state_updated", {
              userId,
              groupId: data.groupId,
              lastReadTimestamp: updatedState.lastReadTimestamp,
              updatedAt: updatedState.updatedAt,
            });
          } catch (error) {
            console.error("❌ Error handling mark_messages_read:", error);
            socket.emit("error", { message: "Failed to update read state" });
          }
        }
      );

      // Handle read state updates (from client updateReadState function)
      socket.on(
        "update_read_state",
        async (data: {
          groupId: string;
          timestamp: string; // ISO string from client
          deviceInfo?: {
            userAgent?: string;
            platform?: string;
          };
        }) => {
          try {
            // Get user ID from authenticated socket
            const userId = this.getUserIdForReadState(socket);
            if (!userId) {
              // Skip read state operations when auth is not available
              return;
            }

            // Validate and parse timestamp from client
            console.log("🕐 Parsing update_read_state timestamp:", {
              received: data.timestamp,
              type: typeof data.timestamp,
            });

            const timestamp = new Date(data.timestamp);

            if (isNaN(timestamp.getTime())) {
              console.error("❌ Invalid timestamp received from client:", {
                received: data.timestamp,
                parsed: timestamp,
              });
              socket.emit("error", { message: "Invalid timestamp format" });
              return;
            }

            // Update read state in database
            const updatedState = await readStateService.updateReadState(
              userId,
              data.groupId,
              timestamp,
              data.deviceInfo
            );

            console.log(
              `📖 User ${userId} updated read state for group ${
                data.groupId
              } to ${timestamp.toISOString()}`
            );

            // Broadcast read state update to all user's devices (same userId)
            // This will sync read state across devices
            this.io!.emit("read_state_updated", {
              userId,
              groupId: data.groupId,
              lastReadTimestamp: updatedState.lastReadTimestamp,
              updatedAt: updatedState.updatedAt,
            });
          } catch (error) {
            console.error("❌ Error handling update_read_state:", error);
            socket.emit("error", { message: "Failed to update read state" });
          }
        }
      );

      // Handle bulk read state sync (for offline scenarios)
      socket.on(
        "sync_read_states",
        async (data: {
          readStates: Array<{
            groupId: string;
            timestamp: string; // ISO string
          }>;
          userId?: string; // Will be from auth when enabled
        }) => {
          try {
            // Get user ID and check if read states are supported
            const userId = this.getUserIdForReadState(socket);
            if (!userId) {
              // Skip read state operations when auth is not enabled
              return;
            }

            // Convert timestamps and prepare for sync
            const readStateUpdates = data.readStates.map((state) => ({
              groupId: state.groupId,
              timestamp: new Date(state.timestamp),
            }));

            // Perform offline sync with conflict resolution
            const syncResult = await readStateService.syncOfflineReadStates(
              userId,
              readStateUpdates
            );

            console.log(
              `🔄 Synced offline read states for user ${userId}:`,
              syncResult
            );

            // Send sync result back to client
            socket.emit("read_states_synced", {
              synced: syncResult.synced,
              conflicts: syncResult.conflicts,
              errors: syncResult.errors,
            });

            // If any states were updated, broadcast to user's other devices
            if (syncResult.synced > 0) {
              const currentReadStates =
                await readStateService.getUserReadStates(userId);
              socket.emit("read_states", currentReadStates);
            }
          } catch (error) {
            console.error("❌ Error syncing read states:", error);
            socket.emit("error", { message: "Failed to sync read states" });
          }
        }
      );

      // Send read states when user connects/requests them
      socket.on("get_read_states", async (data: { userId?: string }) => {
        try {
          // Get user ID and check if read states are supported
          const userId = this.getUserIdForReadState(socket);
          if (!userId) {
            // Skip read state operations when auth is not enabled
            return;
          }

          // Get all read states for the user
          const readStates = await readStateService.getUserReadStates(userId);

          // Send read states to client
          socket.emit("read_states", readStates);

          console.log(`📚 Sent read states for user ${userId}:`, {
            groupCount: Object.keys(readStates).length,
          });
        } catch (error) {
          console.error("❌ Error getting read states:", error);
          socket.emit("error", { message: "Failed to get read states" });
        }
      });

      // Calculate and send unread counts
      socket.on(
        "get_unread_counts",
        async (data: { groupIds?: string[]; userId?: string }) => {
          try {
            // Get user ID and check if read states are supported
            const userId = this.getUserIdForReadState(socket);
            if (!userId) {
              console.log(
                "Skipping unread count calculation: no user ID available"
              );
              // Skip read state operations when auth is not enabled
              return;
            }

            console.log("Starting the unread counts now.");

            // Calculate unread counts
            const unreadCounts = await readStateService.calculateUnreadCounts(
              userId,
              data.groupIds
            );

            // Send unread counts to client
            socket.emit("unread_counts", unreadCounts);

            console.log(`🔢 Sent unread counts for user ${userId}:`, {
              groups: unreadCounts.length,
              totalUnread: unreadCounts.reduce(
                (sum, { unreadCount }) => sum + unreadCount,
                0
              ),
            });
          } catch (error) {
            console.error("❌ Error calculating unread counts:", error);
            socket.emit("error", {
              message: "Failed to calculate unread counts",
            });
          }
        }
      );

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });
  }
}

export const socketService = new SocketService();
