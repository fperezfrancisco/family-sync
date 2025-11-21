/**
 * Socket-related custom hooks
 *
 * This module exports all custom hooks related to Socket.IO functionality,
 * providing clean and reusable interfaces for real-time features.
 *
 * @module hooks/socket
 */

// Core socket hook for general socket access
export { useSocket } from "./useSocket";

// Group chat hook for chat functionality
export { useChat } from "./useChat";

/**
 * Re-export types for convenience
 */
export type { ChatMessage } from "@/context/SocketContext";

/**
 * Usage Examples:
 *
 * // Basic socket connection status
 * import { useSocket } from "@/hooks/socket";
 * const { isConnected } = useSocket();
 *
 * // Group-specific chat functionality
 * import { useChat } from "@/hooks/socket";
 * const { messages, sendMessage, onlineUsers } = useChat(groupId);
 *
 * // Multiple imports
 * import { useSocket, useChat, ChatMessage } from "@/hooks/socket";
 */
