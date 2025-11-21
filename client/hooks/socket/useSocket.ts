"use client";

import { useSocket as useSocketContext } from "@/context/SocketContext";

/**
 * Custom hook to access the Socket.IO context
 *
 * Provides access to socket connection state, real-time messaging,
 * and all socket-related functionality across the application.
 *
 * @returns {SocketContextType} Socket context with connection state and methods
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isConnected, socket, sendMessage } = useSocket();
 *
 *   if (!isConnected) {
 *     return <div>Connecting to chat...</div>;
 *   }
 *
 *   return <div>Connected to real-time chat!</div>;
 * }
 * ```
 */
export const useSocket = () => {
  return useSocketContext();
};
