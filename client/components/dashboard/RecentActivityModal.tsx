"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Calendar,
  CheckSquare,
  MessageCircle,
  Users,
  Search,
} from "lucide-react";
import {
  useRecentActivity,
  type RecentActivity,
} from "@/hooks/useRecentActivity";

interface RecentActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Recent Activity Modal Component
 *
 * Shows an expanded view of recent activities with:
 * - Fixed height with scrollable content
 * - Initial 10 activities with option to load more
 * - Basic filtering and search capabilities
 * - Grouped by date for better organization
 */
export default function RecentActivityModal({
  isOpen,
  onClose,
}: RecentActivityModalProps) {
  const router = useRouter();
  const [activityLimit, setActivityLimit] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "event" | "task" | "message" | "group"
  >("all");

  // Get all activities up to current limit
  const allActivities = useRecentActivity({ limit: activityLimit });

  // Navigation handler for activity items
  const handleActivityNavigation = useCallback(
    (activity: RecentActivity) => {
      // Close the modal first
      onClose();

      // For messages, we need to navigate to chat and optionally select the group
      if (activity.type === "message" && activity.navigationData?.groupId) {
        // Navigate to chat with group selection
        const chatPath = `/dashboard/chat?groupId=${activity.navigationData.groupId}`;
        router.push(chatPath);
      } else {
        // For tasks, events, and groups, navigate directly to the path
        router.push(activity.navigationPath);
      }
    },
    [router, onClose]
  );

  // Filter activities based on search and filter type
  const filteredActivities = allActivities.filter((activity) => {
    const matchesSearch =
      searchTerm === "" ||
      activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.groupName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.eventName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.userName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterType === "all" || activity.type === filterType;

    return matchesSearch && matchesFilter;
  });

  // Group activities by date for better organization
  const groupedActivities = React.useMemo(() => {
    const groups: Record<string, RecentActivity[]> = {};

    filteredActivities.forEach((activity) => {
      const date = activity.timestamp;
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let groupKey: string;
      if (date.toDateString() === today.toDateString()) {
        groupKey = "Today";
      } else if (date.toDateString() === yesterday.toDateString()) {
        groupKey = "Yesterday";
      } else {
        // For older dates, use a more readable format
        const daysDiff = Math.floor(
          (today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysDiff <= 7) {
          groupKey = `${daysDiff} day${daysDiff > 1 ? "s" : ""} ago`;
        } else {
          groupKey = date.toLocaleDateString("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
          });
        }
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(activity);
    });

    return groups;
  }, [filteredActivities]);

  const handleLoadMore = () => {
    setActivityLimit((prev) => prev + 10);
  };

  const handleLoadAll = () => {
    setActivityLimit(100); // Set to a high number to load all available
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        {/* Modal Content */}
        <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-2xl h-[80vh] flex flex-col">
          {/* Fixed Header */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[var(--foreground)]">
                Recent Activity
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-[var(--muted)] rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-[var(--muted-foreground)]" />
              </button>
            </div>

            {/* Search and Filter Bar */}
            <div className="flex space-x-3">
              {/* Filter Dropdown */}
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as typeof filterType)
                }
                className="px-3 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-lg 
                           text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="all">All Activity</option>
                <option value="event">Events</option>
                <option value="task">Tasks</option>
                <option value="message">Messages</option>
              </select>

              {/* Search Input */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[var(--muted-foreground)]" />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-[var(--muted)] border border-[var(--border)] rounded-lg 
                             text-[var(--foreground)] placeholder-[var(--muted-foreground)] text-sm
                             focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                />
              </div>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {Object.keys(groupedActivities).length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-3" />
                <p className="text-sm text-[var(--muted-foreground)]">
                  {searchTerm || filterType !== "all"
                    ? "No activities match your search"
                    : "No recent activity to show"}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedActivities).map(
                  ([dateGroup, activities]) => (
                    <div key={dateGroup}>
                      {/* Date Group Header */}
                      <h3 className="text-sm font-medium text-[var(--muted-foreground)] mb-3 flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {dateGroup}
                      </h3>

                      {/* Activities for this date */}
                      <div className="space-y-3">
                        {activities.map((activity) => (
                          <div
                            key={activity.id}
                            onClick={() => handleActivityNavigation(activity)}
                            className="flex items-start space-x-3 p-3 rounded-lg hover:bg-[var(--muted)] transition-colors cursor-pointer"
                          >
                            {/* Activity Icon */}
                            <div
                              className={`size-10 rounded-full shrink-0 flex items-center justify-center
                            ${
                              activity.type === "event"
                                ? "bg-blue-100 dark:bg-blue-900"
                                : ""
                            }
                            ${
                              activity.type === "task"
                                ? "bg-green-100 dark:bg-green-900"
                                : ""
                            }
                            ${
                              activity.type === "message"
                                ? "bg-purple-100 dark:bg-purple-900"
                                : ""
                            }
                            ${
                              activity.type === "group"
                                ? "bg-orange-100 dark:bg-orange-900"
                                : ""
                            }
                            `}
                            >
                              {activity.type === "event" && (
                                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                              )}
                              {activity.type === "task" && (
                                <CheckSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                              )}
                              {activity.type === "message" && (
                                <MessageCircle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                              )}
                              {activity.type === "group" && (
                                <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                              )}
                            </div>

                            {/* Activity Content */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[var(--foreground)] leading-relaxed">
                                {activity.message}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-[var(--muted-foreground)]">
                                  {activity.time}
                                </span>
                                {activity.groupName && (
                                  <>
                                    <span className="text-xs text-[var(--muted-foreground)]">
                                      •
                                    </span>
                                    <span className="text-xs text-[var(--muted-foreground)]">
                                      {activity.groupName}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Priority Indicator */}
                            {activity.priority === "high" && (
                              <div className="w-2 h-2 bg-[var(--primary)] rounded-full shrink-0 mt-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          {allActivities.length > 0 && (
            <div className="p-4 border-t border-[var(--border)] bg-[var(--muted)]/30">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[var(--muted-foreground)]">
                  Showing {filteredActivities.length} of {allActivities.length}{" "}
                  activities
                </span>

                {allActivities.length >= activityLimit && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleLoadMore}
                      className="px-3 py-1 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] 
                                 rounded-md hover:bg-[var(--primary)]/90 transition-colors"
                    >
                      Load 10 More
                    </button>
                    <button
                      onClick={handleLoadAll}
                      className="px-3 py-1 text-sm border border-[var(--border)] text-[var(--foreground)] 
                                 rounded-md hover:bg-[var(--muted)] transition-colors"
                    >
                      Load All
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
