"use client";

import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useGroups } from "@/context/GroupsContext";
import { useEvents } from "@/context/EventsContext";
import { useTasks } from "@/context/TasksContext";
import { useSocket } from "@/context/SocketContext";
import { RecentActivity } from "./useRecentActivity";

// Recent activity time window (10 days)
const RECENT_ACTIVITY_DAYS = 10;

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

/**
 * Formats a relative time string from an ISO date
 */
function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

interface UseGroupRecentActivityOptions {
  groupId: string;
  limit?: number;
  daysBack?: number;
  includeLowPriority?: boolean;
}

/**
 * Custom hook for generating group-specific recent activity data
 *
 * @param options Configuration options including groupId for filtering
 * @returns Array of recent activities sorted by timestamp (most recent first)
 */
export function useGroupRecentActivity(options: UseGroupRecentActivityOptions) {
  const {
    groupId,
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
   * Generate recent activities filtered for the specific group
   */
  const recentActivities = useMemo(() => {
    if (!user || !groups) return [];

    const activities: RecentActivity[] = [];

    // Find the specific group
    const targetGroup = groups.find((group) => group.id === groupId);
    if (!targetGroup) return [];

    // Helper function to check if an activity is within the time window
    const isRecentActivity = (date: Date) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);
      return date > cutoffDate;
    };

    // 1. GROUP MEMBERSHIP ACTIVITIES (High Priority for group owner/admins)
    // Note: This would require membership change tracking from the backend
    // For now, we can add placeholder for future implementation

    // 2. EVENT ACTIVITIES (High Priority: Events for this group)
    if (events) {
      events
        .filter((event) => {
          const createdDate = new Date(event.createdAt);
          const isRecent = isRecentActivity(createdDate);
          const belongsToGroup = event.group?.id === groupId;

          return isRecent && belongsToGroup;
        })
        .forEach((event) => {
          const navigationInfo = getNavigationInfo("event", {
            eventId: event.id,
            groupId: event.group?.id,
          });

          activities.push({
            id: `event-${event.id}`,
            type: "event",
            message: `New event "${event.name}" was created`,
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

    // 3. TASK ACTIVITIES (High Priority: Tasks for this group)
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
          const belongsToGroup = task.group?.id === groupId;

          return isRecent && belongsToGroup;
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
              message: `Task "${task.title}" was completed by ${task.completedBy.name}`,
              time: formatRelativeTime(task.completedAt),
              timestamp: new Date(task.completedAt),
              groupName: task.group?.name,
              eventName: task.event?.name,
              userName: task.completedBy.name,
              priority: "high",
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
                ? `You were assigned task "${task.title}"`
                : `New task "${task.title}" was created`,
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

    // 4. MESSAGE ACTIVITIES (High Priority: New messages in this group)
    if (messages && messages[groupId]) {
      const groupMessages = messages[groupId] || [];

      // Get messages from the specified time window, excluding current user's messages
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysBack);

      const recentMessages = groupMessages.filter((message) => {
        const messageTime = new Date(message.timestamp);
        return messageTime > cutoffDate && message.senderId !== user.id;
      });

      if (recentMessages.length > 0) {
        // Group messages by day and create activity entries
        const messagesByDay = new Map<string, typeof recentMessages>();

        recentMessages.forEach((message) => {
          const messageDate = new Date(message.timestamp);
          const dayKey = messageDate.toDateString();

          if (!messagesByDay.has(dayKey)) {
            messagesByDay.set(dayKey, []);
          }
          messagesByDay.get(dayKey)!.push(message);
        });

        // Create activity entries for each day with messages
        Array.from(messagesByDay.entries())
          .sort(([, messagesA], [, messagesB]) => {
            // Sort by most recent message in each day
            const latestA = Math.max(
              ...messagesA.map((m) => new Date(m.timestamp).getTime())
            );
            const latestB = Math.max(
              ...messagesB.map((m) => new Date(m.timestamp).getTime())
            );
            return latestB - latestA;
          })
          .slice(0, 3) // Limit to 3 most recent days
          .forEach(([dayKey, dayMessages]) => {
            const latestMessage = dayMessages[dayMessages.length - 1];
            const senders = new Set(dayMessages.map((msg) => msg.senderName));
            const sendersArray = Array.from(senders);

            let message: string;
            if (dayMessages.length === 1) {
              message = `${latestMessage.senderName} sent a message`;
            } else if (sendersArray.length === 1) {
              message = `${sendersArray[0]} sent ${dayMessages.length} messages`;
            } else {
              const otherCount = sendersArray.length - 1;
              message = `${dayMessages.length} new messages from ${
                sendersArray[0]
              }${
                otherCount > 0
                  ? ` and ${otherCount} other${otherCount > 1 ? "s" : ""}`
                  : ""
              }`;
            }

            const navigationInfo = getNavigationInfo("message", {
              groupId: groupId,
            });

            activities.push({
              id: `message-${groupId}-${dayKey}`,
              type: "message",
              message,
              time: formatRelativeTime(
                latestMessage.timestamp instanceof Date
                  ? latestMessage.timestamp.toISOString()
                  : String(latestMessage.timestamp)
              ),
              timestamp: new Date(latestMessage.timestamp),
              groupName: targetGroup.name,
              priority: "high",
              navigationPath: navigationInfo.path,
              navigationData: navigationInfo.data,
            });
          });
      }
    }

    // Sort activities by timestamp (most recent first) and apply limit
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .filter((activity) => includeLowPriority || activity.priority !== "low")
      .slice(0, limit);

    return sortedActivities;
  }, [
    user,
    groups,
    events,
    tasks,
    messages,
    groupId,
    limit,
    daysBack,
    includeLowPriority,
  ]);

  return recentActivities;
}
