"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";

// Socket type alias to avoid import issues
type SocketType = ReturnType<typeof io>;

// Message interface
export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  groupId: string;
  timestamp: Date;
  type: "text" | "image" | "file";
}

// Read state management interfaces
export interface ReadState {
  groupId: string;
  lastReadTimestamp: Date;
  updatedAt: Date;
}

export interface UnreadCount {
  groupId: string;
  unreadCount: number;
  lastMessageTimestamp?: Date | null;
}

export interface ReadStateUpdate {
  groupId: string;
  timestamp: Date;
  deviceInfo?: {
    userAgent?: string;
    platform?: string;
  };
}

// Socket context interface
interface SocketContextType {
  // Connection state
  socket: SocketType | null;
  isConnected: boolean;
  isConnecting: boolean;
  connectionError: string | null;

  // Enhanced debugging state
  connectionQuality: "excellent" | "good" | "poor" | "unknown";
  currentTransport: string;
  browserInfo: string;

  // Messages state (grouped by groupId)
  messages: Record<string, ChatMessage[]>;

  // Online users (grouped by groupId)
  onlineUsers: Record<string, string[]>;

  // Typing indicators (grouped by groupId)
  typingUsers: Record<string, string[]>;

  // Read state management (server-backed)
  readStates: Record<string, Date>; // groupId -> lastReadTimestamp
  unreadCounts: Record<string, number>; // groupId -> unreadCount
  isLoadingReadStates: boolean;

  // Core socket functions
  connect: () => void;
  disconnect: () => void;

  // Group management
  viewGroup: (groupId: string) => void; // Passive viewing - no read state changes
  viewGroups: (groupIds: string[]) => void; // Batch passive viewing - no read state changes
  joinGroup: (groupId: string) => void; // Active joining - marks as read
  leaveGroup: (groupId: string) => void;

  // Message functions
  sendMessage: (groupId: string, content: string) => void;
  getGroupMessages: (groupId: string) => ChatMessage[];

  // Typing indicators
  startTyping: (groupId: string) => void;
  stopTyping: (groupId: string) => void;

  // Utility functions
  clearMessages: (groupId?: string) => void;
  getOnlineUsers: (groupId: string) => string[];

  // Read state management functions (server-backed)
  markGroupAsRead: (groupId: string) => void;
  getUnreadCount: (groupId: string) => number;
  syncReadStates: () => void;
  updateReadState: (groupId: string, timestamp?: Date) => void;
}

const SocketContext = createContext<SocketContextType | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Socket instance state
  const [socket, setSocket] = useState<SocketType | null>(null);

  // Connection state
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Simplified socket configuration
  const socketConfig = useMemo(
    () => ({
      transports: ["websocket", "polling"],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      maxReconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      randomizationFactor: 0.5,
    }),
    []
  );

  // Messages state (groupId -> messages array)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  // Read state management (server-backed)
  const [readStates, setReadStates] = useState<Record<string, Date>>({});
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isLoadingReadStates, setIsLoadingReadStates] = useState(false);
  const [offlineReadStates, setOfflineReadStates] = useState<ReadStateUpdate[]>(
    []
  );

  // Online users (groupId -> userId array)
  const [onlineUsers, setOnlineUsers] = useState<Record<string, string[]>>({});

  // Typing users (groupId -> userId array)
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  // Connect function
  const connect = useCallback(() => {
    if (!user || socket?.connected) return;

    setIsConnecting(true);
    setConnectionError(null);

    // Get access token for authentication
    const accessToken =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    console.log("🔐 Socket.IO Authentication Debug:", {
      hasUser: !!user,
      hasAccessToken: !!accessToken,
      accessTokenPreview: accessToken
        ? `${accessToken.substring(0, 20)}...`
        : null,
      userId: user?.id,
    });

    if (!accessToken) {
      console.error("❌ No access token found for Socket.IO authentication");
      setConnectionError("No access token available");
      setIsConnecting(false);
      return;
    }

    const newSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_IO_URL || "http://localhost:4000",
      {
        auth: {
          token: accessToken,
        },
        // Socket.IO configuration
        transports: socketConfig.transports,
        upgrade: socketConfig.upgrade,
        rememberUpgrade: socketConfig.rememberUpgrade,
        timeout: socketConfig.timeout,
        reconnection: true,
        reconnectionAttempts: socketConfig.maxReconnectionAttempts,
        reconnectionDelay: socketConfig.reconnectionDelay,
        reconnectionDelayMax: socketConfig.reconnectionDelayMax,
        randomizationFactor: socketConfig.randomizationFactor,
      }
    );

    // Connection event handlers with enhanced logging
    newSocket.on("connect", () => {
      /*
      logConnection(`Socket connected: ${newSocket.id}`, {
        socketId: newSocket.id,
        browser: browserDescription,
      });
      */
      console.log("Socket connected: ", newSocket.id);

      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);

      // Request fresh unread counts from server
      //console.log("📊 Requesting unread counts for all groups...");
      //newSocket.emit("get_unread_counts", {});

      // Sync offline read states when reconnecting
      if (offlineReadStates.length > 0) {
        console.log(
          "🔄 Syncing offline read states:",
          offlineReadStates.length
        );
        newSocket.emit("sync_offline_read_states", offlineReadStates);
        setOfflineReadStates([]);
      }
    });

    newSocket.on("disconnect", (reason: string) => {
      console.log(`Socket disconnected: ${reason}`);
      setIsConnected(false);
      setIsConnecting(false);
    });

    newSocket.on("connect_error", (error: Error) => {
      /*
      logError(`Socket connection error: ${error.message}`, {
        error: error.message,
        browser: browserDescription,
      });
      */

      setConnectionError(error.message);
      setIsConnecting(false);
    });

    // Read state management events
    newSocket.on("read_states", (serverReadStates: Record<string, string>) => {
      console.log(
        "📚 Received initial read states from server:",
        Object.keys(serverReadStates).length
      );

      // Convert string timestamps to Date objects
      const readStatesMap: Record<string, Date> = {};
      Object.entries(serverReadStates).forEach(([groupId, timestamp]) => {
        readStatesMap[groupId] = new Date(timestamp);
      });

      setReadStates(readStatesMap);
      setIsLoadingReadStates(false);

      // NOW request unread counts after read states are received
      console.log("📊 Read states received, now requesting unread counts...");
      newSocket.emit("get_unread_counts", {});

      // Clear any stale localStorage data
      if (user?.id && typeof window !== "undefined") {
        const lastSeenKey = `lastSeen_${user.id}`;
        localStorage.removeItem(lastSeenKey);
      }
    });

    newSocket.on(
      "read_state_updated",
      ({
        groupId,
        lastReadTimestamp,
        userId,
      }: {
        groupId: string;
        lastReadTimestamp: string;
        userId: string;
      }) => {
        // Only update if this is from another device (same user, different socket)
        if (userId === user?.id && newSocket.id !== userId) {
          console.log("📖 Read state updated from another device:", {
            groupId,
            lastReadTimestamp,
          });
          setReadStates((prev) => ({
            ...prev,
            [groupId]: new Date(lastReadTimestamp),
          }));
        }
      }
    );

    newSocket.on("unread_counts", (unreadData: UnreadCount[]) => {
      console.log("🔢 Received unread counts:", unreadData.length);
      const countsMap: Record<string, number> = {};
      unreadData.forEach(({ groupId, unreadCount }) => {
        countsMap[groupId] = unreadCount;
      });

      // Merge with existing counts instead of replacing them
      setUnreadCounts((prev) => ({
        ...prev,
        ...countsMap,
      }));
    });

    // Listen for user-specific unread count updates (real-time dashboard updates)
    newSocket.on(
      "unread_counts_for_user",
      ({
        userId,
        unreadCounts,
      }: {
        userId: string;
        unreadCounts: UnreadCount[];
      }) => {
        // Only update if this is for the current user
        if (userId === user?.id) {
          console.log(
            "🔔 Received real-time unread count update:",
            unreadCounts.length
          );
          const countsMap: Record<string, number> = {};
          unreadCounts.forEach(({ groupId, unreadCount }) => {
            countsMap[groupId] = unreadCount;
          });

          // For real-time updates from global broadcasting, replace entire object
          // This ensures we have the complete, up-to-date state from server
          setUnreadCounts(countsMap);
        }
      }
    );

    // Message events
    newSocket.on("message_received", (message: ChatMessage) => {
      /*
      logMessage(`Message received: ${message.id} from ${message.senderName}`, {
        messageId: message.id,
        senderId: message.senderId,
        senderName: message.senderName,
        content:
          message.content.substring(0, 50) +
          (message.content.length > 50 ? "..." : ""),
        groupId: message.groupId,
        browser: browserDescription,
      });
      */
      console.log("New message received from: ", message.senderName);

      setMessages((prev) => {
        const groupMessages = prev[message.groupId] || [];

        // Check if this is our own message coming back (replace temp message)
        const tempIndex = groupMessages.findIndex(
          (msg) =>
            msg.senderId === message.senderId &&
            msg.id.startsWith("temp-") &&
            msg.content === message.content &&
            // Match messages within 10 seconds (generous window for network delays)
            Math.abs(
              new Date(msg.timestamp).getTime() -
                new Date(message.timestamp).getTime()
            ) < 10000
        );

        if (tempIndex !== -1) {
          /*
          logMessage(
            `Replacing temp message ${groupMessages[tempIndex].id} with server message ${message.id}`,
            {
              tempId: groupMessages[tempIndex].id,
              serverId: message.id,
              content:
                message.content.substring(0, 50) +
                (message.content.length > 50 ? "..." : ""),
              timeDiff: Math.abs(
                new Date(groupMessages[tempIndex].timestamp).getTime() -
                  new Date(message.timestamp).getTime()
              ),
              browser: browserDescription,
            }
          );
          */

          // Replace temp message with real server message
          const updatedMessages = [...groupMessages];
          updatedMessages[tempIndex] = message;
          return { ...prev, [message.groupId]: updatedMessages };
        } else {
          // Check if this message already exists (came from history)
          const existingIndex = groupMessages.findIndex(
            (msg) => msg.id === message.id
          );

          if (existingIndex !== -1) {
            /*
            logMessage(
              `Ignoring duplicate message ${message.id} - already exists from history`,
              {
                messageId: message.id,
                existingMessageTimestamp:
                  groupMessages[existingIndex].timestamp,
                newMessageTimestamp: message.timestamp,
                browser: browserDescription,
              }
            );
            */
            return prev; // No change needed
          }

          /*
          logMessage(
            `Adding new message ${message.id} to group ${message.groupId}`,
            {
              messageId: message.id,
              senderId: message.senderId,
              senderName: message.senderName,
              groupId: message.groupId,
              isFromOtherUser: message.senderId !== user?.id,
              browser: browserDescription,
            }
          );*/

          // New message from someone else or temp not found
          return { ...prev, [message.groupId]: [...groupMessages, message] };
        }
      });
    });

    // Handle message history when joining a group
    newSocket.on("message_history", (messages: ChatMessage[]) => {
      /*
      logMessage(`Message history received: ${messages.length} messages`, {
        messageCount: messages.length,
        browser: browserDescription,
      });
      */
      console.log("Got message history emitted!!", messages.length);

      if (messages.length > 0) {
        const groupId = messages[0].groupId;

        setMessages((prev) => {
          const currentMessages = prev[groupId] || [];
          const tempMessages = currentMessages.filter((msg) =>
            msg.id.startsWith("temp-")
          );

          // Check if any temp messages are already in history (by content/timing match)
          const tempMessagesInHistory: Array<{
            temp: ChatMessage;
            hist: ChatMessage;
          }> = [];

          tempMessages.forEach((tempMsg) => {
            const histMatch = messages.find(
              (histMsg) =>
                histMsg.content === tempMsg.content &&
                histMsg.senderId === tempMsg.senderId &&
                Math.abs(
                  new Date(histMsg.timestamp).getTime() -
                    new Date(tempMsg.timestamp).getTime()
                ) < 10000
            );

            if (histMatch) {
              tempMessagesInHistory.push({ temp: tempMsg, hist: histMatch });
            }
          });

          if (tempMessagesInHistory.length > 0) {
            /*
            logMessage(
              `Found ${tempMessagesInHistory.length} temp messages already in history - preventing duplicates`,
              {
                matches: tempMessagesInHistory.map(({ temp, hist }) => ({
                  tempId: temp.id,
                  histId: hist.id,
                  content:
                    temp.content.substring(0, 30) +
                    (temp.content.length > 30 ? "..." : ""),
                })),
                groupId,
                browser: browserDescription,
              }
            );
            */
          }

          const remainingTempMessages = tempMessages.filter(
            (tempMsg) =>
              !tempMessagesInHistory.some(({ temp }) => temp.id === tempMsg.id)
          );

          if (remainingTempMessages.length > 0) {
            /*
            logMessage(
              `Warning: ${remainingTempMessages.length} temp messages will be lost due to history replace`,
              {
                tempMessageCount: remainingTempMessages.length,
                tempMessages: remainingTempMessages.map((m) => ({
                  id: m.id,
                  content:
                    m.content.substring(0, 30) +
                    (m.content.length > 30 ? "..." : ""),
                })),
                groupId,
                browser: browserDescription,
              }
            );*/
          }

          // Smart merge: preserve recent confirmed messages, add missing historical ones
          const recentConfirmedMessages = currentMessages.filter(
            (msg) =>
              !msg.id.startsWith("temp-") &&
              !messages.some((histMsg) => histMsg.id === msg.id)
          );

          // Combine historical messages with recent confirmed messages and remaining temp messages
          const mergedMessages = [
            ...messages,
            ...recentConfirmedMessages,
            ...remainingTempMessages,
          ].sort(
            (a, b) =>
              new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          /*
          console.log(
            `Smart merge completed: ${messages.length} historical + ${recentConfirmedMessages.length} recent + ${remainingTempMessages.length} temp = ${mergedMessages.length} total`
          );*/

          return {
            ...prev,
            [groupId]: mergedMessages,
          };
        });
      }
    });

    // Handle batch message history from multiple groups
    newSocket.on(
      "batch_message_history",
      (allMessages: Record<string, ChatMessage[]>) => {
        console.log(
          "Got batch message history:",
          Object.keys(allMessages).length,
          "groups"
        );

        setMessages((prev) => {
          const updatedMessages = { ...prev };

          // Process each group's messages
          Object.entries(allMessages).forEach(([groupId, messages]) => {
            if (messages.length > 0) {
              const currentMessages = prev[groupId] || [];
              const tempMessages = currentMessages.filter((msg) =>
                msg.id.startsWith("temp-")
              );

              // Simple merge: use batch history + any temp messages
              const mergedMessages = [...messages, ...tempMessages].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              );

              updatedMessages[groupId] = mergedMessages;
            }
          });

          return updatedMessages;
        });
      }
    );

    // User join/leave events
    newSocket.on(
      "user_joined",
      ({ userId, groupId }: { userId: string; groupId: string }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [groupId]: [...(prev[groupId] || []), userId],
        }));
      }
    );

    newSocket.on(
      "user_left",
      ({ userId, groupId }: { userId: string; groupId: string }) => {
        setOnlineUsers((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter((id) => id !== userId),
        }));
      }
    );

    // Typing events
    newSocket.on(
      "typing_start",
      ({ userId, groupId }: { userId: string; groupId: string }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [groupId]: [
            ...(prev[groupId] || []).filter((id) => id !== userId),
            userId,
          ],
        }));
      }
    );

    newSocket.on(
      "typing_stop",
      ({ userId, groupId }: { userId: string; groupId: string }) => {
        setTypingUsers((prev) => ({
          ...prev,
          [groupId]: (prev[groupId] || []).filter((id) => id !== userId),
        }));
      }
    );

    // Error handling
    newSocket.on("error", (error: Error) => {
      console.error("Socket error:", error);
      setConnectionError(error.message);
    });

    setSocket(newSocket);
  }, [user, socket, socketConfig, offlineReadStates, setOfflineReadStates]);

  // Disconnect function
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
    }
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionError(null);
  }, [socket]);

  // Group management functions
  const viewGroup = useCallback(
    (groupId: string) => {
      if (socket?.connected) {
        console.log(
          `👁️ Viewing group: ${groupId} (passive - no read state changes)`
        );
        socket.emit("view_group", groupId);
      }
    },
    [socket]
  );

  const viewGroups = useCallback(
    (groupIds: string[]) => {
      if (socket?.connected && groupIds.length > 0) {
        console.log(
          `👁️ Batch viewing ${groupIds.length} groups: (passive - no read state changes)`
        );
        socket.emit("view_groups", groupIds);
      }
    },
    [socket]
  );

  const joinGroup = useCallback(
    (groupId: string) => {
      if (socket?.connected) {
        console.log(`💬 Actively joining group: ${groupId} (marks as read)`);
        socket.emit("join_group", groupId);
      }
    },
    [socket]
  );

  const leaveGroup = useCallback(
    (groupId: string) => {
      if (socket?.connected) {
        socket.emit("leave_group", groupId);
      }
    },
    [socket]
  );

  // Message functions
  const sendMessage = useCallback(
    (groupId: string, content: string) => {
      if (!socket?.connected || !user || !user.id) return;

      const message: Omit<ChatMessage, "id"> = {
        content,
        senderId: user.id,
        senderName: user.name || "Unknown User",
        groupId,
        timestamp: new Date(),
        type: "text",
      };

      // Optimistic update - create temp message for immediate UI feedback
      const tempMessage: ChatMessage = {
        ...message,
        id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      console.log(`Optimistic message sent: ${tempMessage.id}`);

      setMessages((prev) => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), tempMessage],
      }));

      // Send to server (server will now echo back to sender with real ID)
      socket.emit("send_message", message);
    },
    [socket, user]
  );

  const getGroupMessages = (groupId: string): ChatMessage[] => {
    return messages[groupId] || [];
  };

  // Typing functions
  const startTyping = useCallback(
    (groupId: string) => {
      if (socket?.connected) {
        socket.emit("typing_start", { groupId });
      }
    },
    [socket]
  );

  const stopTyping = useCallback(
    (groupId: string) => {
      if (socket?.connected) {
        socket.emit("typing_stop", { groupId });
      }
    },
    [socket]
  );

  // Utility functions
  const clearMessages = (groupId?: string) => {
    if (groupId) {
      setMessages((prev) => ({
        ...prev,
        [groupId]: [],
      }));
    } else {
      setMessages({});
    }
  };

  const getOnlineUsers = (groupId: string): string[] => {
    return onlineUsers[groupId] || [];
  };

  // Read state management functions (server-backed)
  const updateReadState = useCallback(
    (groupId: string, timestamp?: Date) => {
      if (!user?.id) return;

      const readTimestamp = timestamp || new Date();

      // Optimistically update local state
      setReadStates((prev) => ({ ...prev, [groupId]: readTimestamp }));

      if (socket?.connected) {
        // Send to server if connected
        const deviceInfo = {
          platform:
            typeof window !== "undefined"
              ? /Mobi|Android/i.test(navigator.userAgent)
                ? "mobile"
                : "desktop"
              : "unknown",
          userAgent:
            typeof window !== "undefined" ? navigator.userAgent : undefined,
        };

        socket.emit("mark_messages_read", {
          groupId,
          lastReadTimestamp: readTimestamp.toISOString(),
          deviceInfo,
        });

        // Request fresh unread counts after marking as read
        socket.emit("get_unread_counts", {});

        console.log("📖 Updated read state for group:", {
          groupId,
          timestamp: readTimestamp,
        });
      } else {
        // Queue for offline sync
        setOfflineReadStates((prev) => [
          ...prev,
          { groupId, timestamp: readTimestamp },
        ]);
        console.log("⏸️ Queued offline read state:", {
          groupId,
          timestamp: readTimestamp,
        });
      }
    },
    [user?.id, socket, setOfflineReadStates]
  );

  const markGroupAsRead = useCallback(
    (groupId: string) => {
      updateReadState(groupId, new Date());
    },
    [updateReadState]
  );

  const getUnreadCount = useCallback(
    (groupId: string): number => {
      return unreadCounts[groupId] || 0;
    },
    [unreadCounts]
  );

  const syncReadStates = useCallback(() => {
    console.log("Syncing read states for user");
    if (!socket?.connected || !user?.id) return;

    setIsLoadingReadStates(true);
    socket.emit("get_read_states");
    console.log("🔄 Requesting read states from server");
  }, [socket, user?.id]);

  // Manual function to request unread counts (used for debugging/manual refresh)
  const getUnreadCounts = useCallback(() => {
    console.log("🔍 DEBUG: getUnreadCounts called with state:", {
      socketConnected: socket?.connected,
      socketExists: !!socket,
      userId: user?.id,
      socketId: socket?.id,
    });

    if (!socket?.connected || !user?.id) {
      console.log(
        "❌ DEBUG: Cannot emit get_unread_counts - missing requirements"
      );
      return;
    }

    console.log("📊 DEBUG: About to emit get_unread_counts...");
    socket.emit("get_unread_counts", {});
    console.log("✅ DEBUG: get_unread_counts emitted successfully");
  }, [socket, user?.id]);

  // Note: Offline read state queueing is handled in updateReadState function

  // Auto-sync read states when connected and user is available
  useEffect(() => {
    if (isConnected && user?.id && socket) {
      // Use timeout to avoid direct setState in effect
      const timeoutId = setTimeout(() => {
        syncReadStates();
        //getUnreadCounts();
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [isConnected, user?.id, socket, syncReadStates]);
  // ✅ Unread counts now come from server events only (no local calculation)
  // Real-time updates via "unread_counts_for_user" events when messages are sent

  // Auto-connect when user is available
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (user && !socket) {
      // Use timeout to avoid direct setState in effect
      timeoutId = setTimeout(() => connect(), 0);
    } else if (!user && socket) {
      timeoutId = setTimeout(() => disconnect(), 0);
    }

    // Cleanup on unmount
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (socket) {
        socket.disconnect();
      }
    };
  }, [user, socket, connect, disconnect]);

  const value: SocketContextType = {
    // Connection state
    socket: socket, // Socket instance
    isConnected,
    isConnecting,
    connectionError,

    // Enhanced debugging state
    connectionQuality: "unknown" as const,
    currentTransport: "unknown",
    browserInfo: "unknown",

    // Data state
    messages,
    onlineUsers,
    typingUsers,

    // Read state management (server-backed)
    readStates,
    unreadCounts,
    isLoadingReadStates,

    // Functions
    connect,
    disconnect,
    viewGroup,
    viewGroups,
    joinGroup,
    leaveGroup,
    sendMessage,
    getGroupMessages,
    startTyping,
    stopTyping,
    clearMessages,
    getOnlineUsers,

    // Read state management functions
    markGroupAsRead,
    getUnreadCount,
    syncReadStates,
    updateReadState,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

// Custom hook to use socket context
export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
}
