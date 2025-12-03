"use client";

import { useMemo, useEffect } from "react";
import { useGroups } from "@/context/GroupsContext";
import { useSocket } from "@/hooks/socket";
import { useAuth } from "@/context/AuthContext";

/**
 * Custom hook to calculate total unread messages across all groups
 * Automatically ensures all group messages are loaded for real-time updates
 *
 * @returns {number} Total count of unread messages across all groups
 */
export function useTotalUnreadMessages(): number {
  const { groups } = useGroups();
  const { messages: globalMessages, joinGroup, isConnected } = useSocket();
  const { user } = useAuth();

  // Ensure all groups are joined for real-time message updates
  useEffect(() => {
    if (!isConnected || !groups || groups.length === 0) {
      return;
    }

    // Join all user groups to ensure we receive real-time updates
    groups.forEach((group) => {
      joinGroup(group.id);
    });

    // Note: We don't leave groups on cleanup since we want persistent global updates
    // Groups will be left when the socket disconnects
  }, [groups, isConnected, joinGroup]);

  // Calculate total unread messages across all groups
  const totalUnreadCount = useMemo(() => {
    if (!user || !groups || groups.length === 0) {
      return 0;
    }

    let totalCount = 0;

    // Get last seen data once for efficiency (browser only)
    const lastSeenKey = `lastSeen_${user.id}`;
    let lastSeenData: Record<string, string> = {};

    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(lastSeenKey);
        if (stored) {
          lastSeenData = JSON.parse(stored);
        }
      } catch (error) {
        console.error("Error reading last seen data:", error);
      }
    }

    // Calculate unread messages for each group
    groups.forEach((group) => {
      // Get messages for this group from global state
      const groupMessages = globalMessages[group.id] || [];

      if (groupMessages.length === 0) {
        return; // No messages in this group
      }

      // Get last seen timestamp for this group
      const lastSeen = lastSeenData[group.id]
        ? new Date(lastSeenData[group.id])
        : new Date(0); // If no last seen, consider all messages as unread

      // Count unread messages (from other users, newer than last seen)
      const unreadMessages = groupMessages.filter((message) => {
        const messageTime = new Date(message.timestamp);
        return messageTime > lastSeen && message.senderId !== user.id;
      });

      totalCount += unreadMessages.length;
    });

    return totalCount;
  }, [groups, globalMessages, user]);

  return totalUnreadCount;
}
