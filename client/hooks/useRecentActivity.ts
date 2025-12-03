"use client";

import { useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGroups } from "@/context/GroupsContext";
import { useEvents } from "@/context/EventsContext";
import { useTasks } from "@/context/TasksContext";
import { useSocket } from "@/context/SocketContext";

// Recent activity time window (10 days)
const RECENT_ACTIVITY_DAYS = 10;

// Activity type definitions
export interface RecentActivity {
  id: string;
  type: "event" | "task" | "message" | "group";
  message: string;
  time: string;
  timestamp: Date;
  groupName?: string;
  eventName?: string;
  userName?: string;
  priority: "high" | "medium" | "low";
  // Navigation data
  navigationPath: string;
  navigationData?: {
    groupId?: string;
    taskId?: string;
    eventId?: string;
    messageId?: string;
  };
}

/**
 * Utility function to generate navigation path and data for activities
 */
function getNavigationInfo(
  type: RecentActivity["type"],
  data: {
    groupId?: string;
    taskId?: string;
    eventId?: string;
    messageId?: string;
  }
): { path: string; data: RecentActivity["navigationData"] } {
  switch (type) {
    case "message":
      return {
        path: "/dashboard/chat",
        data: { groupId: data.groupId, messageId: data.messageId },
      };
    case "task":
      return {
        path: data.taskId
          ? `/dashboard/tasks/${data.taskId}`
          : "/dashboard/tasks",
        data: { taskId: data.taskId, groupId: data.groupId },
      };
    case "event":
      return {
        path: data.eventId
          ? `/dashboard/events/${data.eventId}`
          : "/dashboard/events",
        data: { eventId: data.eventId, groupId: data.groupId },
      };
    case "group":
      return {
        path: data.groupId
          ? `/dashboard/groups/${data.groupId}`
          : "/dashboard/groups",
        data: { groupId: data.groupId },
      };
    default:
      return { path: "/dashboard", data: {} };
  }
}

interface UseRecentActivityOptions {
  limit?: number;
  daysBack?: number;
  includeLowPriority?: boolean;
}

/**
 * Custom hook for generating recent activity data
 *
 * @param options Configuration options for activity generation
 * @returns Array of recent activities sorted by timestamp (most recent first)
 */
export function useRecentActivity(options: UseRecentActivityOptions = {}) {
  const {
    limit = 10,
    daysBack = RECENT_ACTIVITY_DAYS,
    includeLowPriority = true,
  } = options;

  const { user } = useAuth();
  const { groups } = useGroups();
  const { events } = useEvents();
  const { tasks } = useTasks();
  const { messages } = useSocket();

  /**
   * Check if an activity is within the recent time window
   */
  const isRecentActivity = useCallback(
    (activityDate: Date): boolean => {
      const now = new Date();
      const cutoffDate = new Date(
        now.getTime() - daysBack * 24 * 60 * 60 * 1000
      );
      return activityDate >= cutoffDate;
    },
    [daysBack]
  );

  /**
   * Format relative time (e.g., "2 hours ago", "3 days ago")
   */
  const formatRelativeTime = useCallback((dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  }, []);

  /**
   * Generate recent activity from all data sources
   */
  const recentActivities = useMemo((): RecentActivity[] => {
    if (!user || !groups) return [];

    const activities: RecentActivity[] = [];

    // Get user's group IDs for relevance filtering
    const userGroupIds = groups.map((group) => group.id);
    const userEventIds = events
      ? events
          .filter((event) =>
            event.attendees.some((attendee) => attendee.user._id === user.id)
          )
          .map((event) => event.id)
      : [];

    // 1. EVENT ACTIVITIES (High Priority: Events user is involved in)
    if (events) {
      events
        .filter((event) => {
          const createdDate = new Date(event.createdAt);
          return (
            isRecentActivity(createdDate) &&
            event.attendees.some((attendee) => attendee.user._id === user.id)
          );
        })
        .forEach((event) => {
          const navigationInfo = getNavigationInfo("event", {
            eventId: event.id,
            groupId: event.group?.id,
          });

          activities.push({
            id: `event-${event.id}`,
            type: "event",
            message: `New event "${event.name}"${
              event.group ? ` in ${event.group.name}` : ""
            }`,
            time: formatRelativeTime(event.createdAt),
            timestamp: new Date(event.createdAt),
            groupName: event.group?.name,
            eventName: event.name,
            priority: "high",
            navigationPath: navigationInfo.path,
            navigationData: navigationInfo.data,
          });
        });
    }

    // 2. TASK ACTIVITIES (High Priority: Tasks relevant to user)
    if (tasks) {
      tasks
        .filter((task) => {
          const createdDate = new Date(task.createdAt);
          const completedDate = task.completedAt
            ? new Date(task.completedAt)
            : null;
          const isRecent =
            isRecentActivity(createdDate) ||
            (completedDate && isRecentActivity(completedDate));

          if (!isRecent) return false;

          // Show tasks that are:
          // - Assigned to current user
          // - Created by current user
          // - In user's groups (if user is group member)
          // - In user's events (if user is event attendee)
          const isAssignedToUser = task.assignees.some(
            (assignee) => assignee.id === user.id
          );
          const isCreatedByUser = task.creator?.id === user.id;
          const isInUserGroup =
            task.group && userGroupIds.includes(task.group.id);
          const isInUserEvent =
            task.event && userEventIds.includes(task.event.id);

          return (
            isAssignedToUser ||
            isCreatedByUser ||
            isInUserGroup ||
            isInUserEvent
          );
        })
        .forEach((task) => {
          // Task completion activity
          if (
            task.completedAt &&
            task.completedBy &&
            isRecentActivity(new Date(task.completedAt))
          ) {
            const navigationInfo = getNavigationInfo("task", {
              taskId: task._id,
              groupId: task.group?.id,
            });

            activities.push({
              id: `task-completed-${task._id}`,
              type: "task",
              message: `Task "${task.title}" was completed by ${
                task.completedBy.name
              }${task.group ? ` in ${task.group.name}` : ""}${
                task.event ? ` for ${task.event.name}` : ""
              }`,
              time: formatRelativeTime(task.completedAt),
              timestamp: new Date(task.completedAt),
              groupName: task.group?.name,
              eventName: task.event?.name,
              userName: task.completedBy.name,
              priority: task.assignees.some(
                (assignee) => assignee.id === user.id
              )
                ? "high"
                : "medium",
              navigationPath: navigationInfo.path,
              navigationData: navigationInfo.data,
            });
          }

          // Task creation/assignment activity (only if not completed, to avoid duplicates)
          if (!task.completedAt && isRecentActivity(new Date(task.createdAt))) {
            const isAssignedToUser = task.assignees.some(
              (assignee) => assignee.id === user.id
            );
            const navigationInfo = getNavigationInfo("task", {
              taskId: task._id,
              groupId: task.group?.id,
            });

            activities.push({
              id: `task-created-${task._id}`,
              type: "task",
              message: isAssignedToUser
                ? `You were assigned task "${task.title}"${
                    task.group ? ` in ${task.group.name}` : ""
                  }${task.event ? ` for ${task.event.name}` : ""}`
                : `New task "${task.title}" was created${
                    task.group ? ` in ${task.group.name}` : ""
                  }${task.event ? ` for ${task.event.name}` : ""}`,
              time: formatRelativeTime(task.createdAt),
              timestamp: new Date(task.createdAt),
              groupName: task.group?.name,
              eventName: task.event?.name,
              priority: isAssignedToUser ? "high" : "medium",
              navigationPath: navigationInfo.path,
              navigationData: navigationInfo.data,
            });
          }
        });
    }

    // 3. MESSAGE ACTIVITIES (High Priority: Grouped by group, from other users)
    if (messages && groups) {
      const messageActivities: Map<
        string,
        {
          groupId: string;
          groupName: string;
          messageCount: number;
          latestMessageTime: Date;
          latestSenderName: string;
          senders: Set<string>;
        }
      > = new Map();

      // Group messages by group and aggregate recent activity
      groups.forEach((group) => {
        const groupMessages = messages[group.id] || [];
        if (groupMessages.length === 0) return;

        // Get messages from last 10 days, excluding current user's messages
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysBack);

        const recentMessages = groupMessages.filter((message) => {
          const messageTime = new Date(message.timestamp);
          return messageTime > cutoffDate && message.senderId !== user.id;
        });

        if (recentMessages.length > 0) {
          const latestMessage = recentMessages[recentMessages.length - 1];
          const senders = new Set(recentMessages.map((msg) => msg.senderName));

          messageActivities.set(group.id, {
            groupId: group.id,
            groupName: group.name,
            messageCount: recentMessages.length,
            latestMessageTime: new Date(latestMessage.timestamp),
            latestSenderName: latestMessage.senderName,
            senders,
          });
        }
      });

      // Convert grouped message activities to activity entries
      Array.from(messageActivities.values())
        .sort(
          (a, b) =>
            b.latestMessageTime.getTime() - a.latestMessageTime.getTime()
        )
        .forEach((msgActivity) => {
          const sendersList = Array.from(msgActivity.senders);
          let message: string;

          if (msgActivity.messageCount === 1) {
            message = `New message from ${msgActivity.latestSenderName} in ${msgActivity.groupName}`;
          } else if (sendersList.length === 1) {
            message = `${msgActivity.messageCount} new messages from ${msgActivity.latestSenderName} in ${msgActivity.groupName}`;
          } else {
            const otherCount = sendersList.length - 1;
            message = `${msgActivity.messageCount} new messages from ${
              msgActivity.latestSenderName
            }${
              otherCount > 0
                ? ` and ${otherCount} other${otherCount > 1 ? "s" : ""}`
                : ""
            } in ${msgActivity.groupName}`;
          }

          const navigationInfo = getNavigationInfo("message", {
            groupId: msgActivity.groupId,
          });

          activities.push({
            id: `message-${msgActivity.groupId}`,
            type: "message",
            message,
            time: formatRelativeTime(
              msgActivity.latestMessageTime.toISOString()
            ),
            timestamp: msgActivity.latestMessageTime,
            groupName: msgActivity.groupName,
            priority: "high",
            navigationPath: navigationInfo.path,
            navigationData: navigationInfo.data,
          });
        });
    }

    // 4. GROUP MEMBERSHIP ACTIVITIES (Medium Priority: New users joining groups)
    // Note: This would require additional data tracking in the future
    // For now, we'll skip this but the structure is ready for expansion

    // Filter by priority if needed
    let filteredActivities = activities;
    if (!includeLowPriority) {
      filteredActivities = activities.filter(
        (activity) => activity.priority !== "low"
      );
    }

    // Sort by timestamp (most recent first) and apply limit
    return filteredActivities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }, [
    user,
    groups,
    events,
    tasks,
    messages,
    limit,
    daysBack,
    includeLowPriority,
    isRecentActivity,
    formatRelativeTime,
  ]);

  return recentActivities;
}
