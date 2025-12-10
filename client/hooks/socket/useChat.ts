"use client";

import { useEffect, useCallback, useState } from "react";
import { useSocket } from "./useSocket";
import type { ChatMessage } from "@/context/SocketContext";

/**
 * Custom hook for group-specific chat functionality
 *
 * Automatically handles joining/leaving group chat rooms, provides
 * group-specific messages, typing indicators, and online users.
 *
 * @param {string} groupId - The ID of the group to connect to
 * @returns {object} Group chat state and methods
 *
 * @example`
 * ```tsx
 * function GroupChatComponent({ groupId }: { groupId: string }) {
 *   const {
 *     messages,
 *     sendMessage,
 *     onlineUsers,
 *     typingUsers,
 *     isConnected,
 *     startTyping,
 *     stopTyping
 *   } = useChat(groupId);
 *
 *   const handleSendMessage = (content: string) => {
 *     sendMessage(content);
 *   };
 *
 *   return (
 *     <div>
 *       <div>Online: {onlineUsers.length}</div>
 *       <div>Typing: {typingUsers.join(", ")}</div>
 *       {messages.map(msg => (
 *         <div key={msg.id}>{msg.content}</div>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export const useChat = (groupId: string) => {
  const {
    socket,
    isConnected,
    viewGroup,
    joinGroup,
    leaveGroup,
    sendMessage: socketSendMessage,
    getGroupMessages,
    getOnlineUsers,
    startTyping: socketStartTyping,
    stopTyping: socketStopTyping,
    typingUsers: allTypingUsers,
  } = useSocket();

  // Local state for typing timeout management
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(
    null
  );

  /**
   * Get messages for the current group
   * Automatically updates when new messages arrive
   */
  const messages: ChatMessage[] = getGroupMessages(groupId);

  /**
   * Get online users for the current group
   * Automatically updates when users join/leave
   */
  const onlineUsers: string[] = getOnlineUsers(groupId);

  /**
   * Get typing users for the current group
   * Automatically updates when users start/stop typing
   */
  const typingUsers: string[] = allTypingUsers[groupId] || [];

  /**
   * Send a message to the current group
   *
   * @param {string} content - The message content to send
   */
  const sendMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      socketSendMessage(groupId, content);
    },
    [groupId, socketSendMessage]
  );

  /**
   * Start typing indicator for the current group
   * Automatically stops typing after 3 seconds of inactivity
   */
  const startTyping = useCallback(() => {
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send typing start event
    socketStartTyping(groupId);

    // Auto-stop typing after 3 seconds
    const timeout = setTimeout(() => {
      socketStopTyping(groupId);
      setTypingTimeout(null);
    }, 3000);

    setTypingTimeout(timeout);
  }, [groupId, socketStartTyping, socketStopTyping, typingTimeout]);

  /**
   * Stop typing indicator for the current group
   */
  const stopTyping = useCallback(() => {
    if (typingTimeout) {
      clearTimeout(typingTimeout);
      setTypingTimeout(null);
    }
    socketStopTyping(groupId);
  }, [groupId, socketStopTyping, typingTimeout]);

  /**
   * Check if the current user is typing
   */
  const isTyping = typingTimeout !== null;

  /**
   * Get the count of online users (excluding current user if needed)
   */
  const onlineUserCount = onlineUsers.length;

  /**
   * Get the count of users currently typing
   */
  const typingUserCount = typingUsers.length;

  /**
   * Actively join the group (marks messages as read)
   * Call this when user explicitly clicks to enter/view the chat
   */
  const activelyJoinGroup = useCallback(() => {
    if (isConnected && groupId) {
      console.log(
        `[useChat] Actively joining group: ${groupId} (marks as read)`
      );
      joinGroup(groupId);
    }
  }, [isConnected, groupId, joinGroup]);

  /**
   * Leave the group
   * Call this when user explicitly leaves the chat
   */
  const activelyLeaveGroup = useCallback(() => {
    if (isConnected && groupId) {
      console.log(`[useChat] Actively leaving group: ${groupId}`);
      leaveGroup(groupId);
    }
  }, [isConnected, groupId, leaveGroup]);

  // Auto-view group when component mounts or groupId changes (passive - no read state changes)
  useEffect(() => {
    if (isConnected && groupId) {
      console.log(`[useChat] Viewing group: ${groupId} (passive)`);
      viewGroup(groupId);

      // No cleanup needed for viewing - we're not actually joining the socket room
      // Clear typing timeout on cleanup
      return () => {
        if (typingTimeout) {
          clearTimeout(typingTimeout);
        }
      };
    }
  }, [isConnected, groupId, viewGroup, typingTimeout]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return {
    // Connection state
    isConnected,

    // Group-specific data
    messages,
    onlineUsers,
    typingUsers,
    onlineUserCount,
    typingUserCount,

    // Message functions
    sendMessage,

    // Typing indicators
    startTyping,
    stopTyping,
    isTyping,

    // Group management (explicit actions)
    activelyJoinGroup,
    activelyLeaveGroup,

    // Socket instance (for advanced usage)
    socket,
  };
};
