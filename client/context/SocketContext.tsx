"use client";

import {
  createContext,
  useState,
  useEffect,
  useContext,
  useCallback,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useConnectionMonitor } from "../hooks/useConnectionMonitor";
import {
  detectBrowser,
  getOptimalSocketConfig,
  getBrowserSpecificStrategy,
  getBrowserDescription,
} from "../utils/browserDetection";
import {
  logConnection,
  logMessage,
  logBrowser,
  logError,
} from "../utils/debugLogger";

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

  // Core socket functions
  connect: () => void;
  disconnect: () => void;

  // Group management
  joinGroup: (groupId: string) => void;
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
  markGroupAsRead: (groupId: string) => void;
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

  // Browser detection and strategy
  const browserInfo = detectBrowser();
  const browserDescription = getBrowserDescription(browserInfo);
  const socketConfig = getOptimalSocketConfig(browserInfo);
  const messageStrategy = getBrowserSpecificStrategy(browserInfo);

  // Connection monitoring
  const connectionMonitor = useConnectionMonitor({
    socket,
    enabled: process.env.NODE_ENV === "development",
  });

  // Messages state (groupId -> messages array)
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});

  // Online users (groupId -> userId array)
  const [onlineUsers, setOnlineUsers] = useState<Record<string, string[]>>({});

  // Typing users (groupId -> userId array)
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});

  // Connect function
  const connect = useCallback(() => {
    if (!user || socket?.connected) return;

    setIsConnecting(true);
    setConnectionError(null);

    logBrowser(`Initializing Socket.IO connection for ${browserDescription}`, {
      browser: browserDescription,
      config: socketConfig,
      strategy: messageStrategy,
    });

    const newSocket = io(
      process.env.NEXT_PUBLIC_SOCKET_IO_URL || "http://localhost:4000",
      {
        auth: {
          // @ts-expect-error - Token property exists but may not be in User type
          token: user.token,
        },
        // Use browser-optimized configuration
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
      logConnection(`Socket connected: ${newSocket.id}`, {
        socketId: newSocket.id,
        browser: browserDescription,
      });

      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
    });

    newSocket.on("disconnect", (reason: string) => {
      logConnection(`Socket disconnected: ${reason}`, {
        reason,
        browser: browserDescription,
        socketId: newSocket.id,
      });

      setIsConnected(false);
      setIsConnecting(false);
    });

    newSocket.on("connect_error", (error: Error) => {
      logError(`Socket connection error: ${error.message}`, {
        error: error.message,
        browser: browserDescription,
      });

      setConnectionError(error.message);
      setIsConnecting(false);
    });

    // Message events
    newSocket.on("message_received", (message: ChatMessage) => {
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

          // Replace temp message with real server message
          const updatedMessages = [...groupMessages];
          updatedMessages[tempIndex] = message;
          return { ...prev, [message.groupId]: updatedMessages };
        } else {
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
          );

          // New message from someone else or temp not found
          return { ...prev, [message.groupId]: [...groupMessages, message] };
        }
      });
    });

    // Handle message history when joining a group
    newSocket.on("message_history", (messages: ChatMessage[]) => {
      logMessage(`Message history received: ${messages.length} messages`, {
        messageCount: messages.length,
        browser: browserDescription,
      });

      if (messages.length > 0) {
        const groupId = messages[0].groupId;

        setMessages((prev) => {
          const currentMessages = prev[groupId] || [];
          const tempMessages = currentMessages.filter((msg) =>
            msg.id.startsWith("temp-")
          );

          if (tempMessages.length > 0) {
            logMessage(
              `Warning: ${tempMessages.length} temp messages will be lost due to history replace`,
              {
                tempMessageCount: tempMessages.length,
                tempMessages: tempMessages.map((m) => ({
                  id: m.id,
                  content:
                    m.content.substring(0, 30) +
                    (m.content.length > 30 ? "..." : ""),
                })),
                groupId,
                browser: browserDescription,
              }
            );
          }

          return {
            ...prev,
            [groupId]: messages, // Replace with historical messages
          };
        });
      }
    });

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
  }, [user, socket, browserDescription, socketConfig, messageStrategy]);

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
  const joinGroup = useCallback(
    (groupId: string) => {
      if (socket?.connected) {
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

      logMessage(`Optimistic message sent: ${tempMessage.id}`, {
        tempId: tempMessage.id,
        content:
          tempMessage.content.substring(0, 50) +
          (tempMessage.content.length > 50 ? "..." : ""),
        groupId,
        strategy: messageStrategy,
        browser: browserDescription,
      });

      setMessages((prev) => ({
        ...prev,
        [groupId]: [...(prev[groupId] || []), tempMessage],
      }));

      // Send to server (server will now echo back to sender with real ID)
      socket.emit("send_message", message);
    },
    [socket, user, browserDescription, messageStrategy]
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

  const markGroupAsRead = useCallback(
    (groupId: string) => {
      if (!user?.id) return;

      const lastSeenKey = `lastSeen_${user.id}`;
      try {
        let lastSeenData: Record<string, string> = {};
        const stored = localStorage.getItem(lastSeenKey);
        if (stored) {
          lastSeenData = JSON.parse(stored);
        }

        // Update the timestamp for this group
        lastSeenData[groupId] = new Date().toISOString();

        // Save back to localStorage
        localStorage.setItem(lastSeenKey, JSON.stringify(lastSeenData));
      } catch (error) {
        console.error("Error updating last seen data:", error);
      }
    },
    [user]
  );

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
    connectionQuality: connectionMonitor.connectionMetrics.connectionQuality,
    currentTransport: connectionMonitor.connectionMetrics.currentTransport,
    browserInfo: browserDescription,

    // Data state
    messages,
    onlineUsers,
    typingUsers,

    // Functions
    connect,
    disconnect,
    joinGroup,
    leaveGroup,
    sendMessage,
    getGroupMessages,
    startTyping,
    stopTyping,
    clearMessages,
    getOnlineUsers,
    markGroupAsRead,
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
