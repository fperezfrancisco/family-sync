"use client";

import React, { useState } from "react";
import {
  MessageCircle,
  Image as ImageIcon,
  Info,
  Users,
  User,
} from "lucide-react";
import { Task } from "@/types/tasks";

interface TaskTabsProps {
  taskId: string;
  task: Task;
  currentUserId?: string;
}

// Available tabs for the task page
const TABS = [
  {
    id: "overview",
    label: "Overview",
    icon: Info,
    description: "Task information and assignees",
  },
  {
    id: "comments",
    label: "Comments",
    icon: MessageCircle,
    description: "Task comments and discussions",
  },
  {
    id: "media",
    label: "Media",
    icon: ImageIcon,
    description: "Task attachments and files",
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Task Tabs Component
 * Handles navigation between different task sections
 */
export default function TaskTabs({
  taskId,
  task,
}: Omit<TaskTabsProps, "currentUserId">) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");

  /**
   * Render tab content based on active tab
   */
  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return <OverviewTab task={task} />;
      case "comments":
        return <CommentsTab task={task} />;
      case "media":
        return <MediaTab taskId={taskId} />;
      default:
        return <div>Tab not found</div>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-[var(--border)]">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {TABS.map((tab, index) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id || index}
                onClick={() => setActiveTab(tab.id)}
                className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  isActive
                    ? "border-blue-500 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-[var(--muted-foreground)] hover:text-foreground hover:border-gray-300"
                }`}
                title={tab.description}
              >
                <Icon
                  className={`mr-2 h-5 w-5 ${
                    isActive
                      ? "text-blue-500 dark:text-blue-400"
                      : "text-[var(--muted-foreground)] group-hover:text-foreground"
                  }`}
                />
                {tab.label}
                {tab.id === "comments" &&
                  task.commentCount &&
                  task.commentCount > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                      {task.commentCount}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">{renderTabContent()}</div>
    </div>
  );
}

/**
 * Overview Tab - Shows task details and assignee information
 */
function OverviewTab({ task }: { task: Task }) {
  // Get status styling for progress display
  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "not_started":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      case "in_progress":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "blocked":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "verified":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Format date display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Task Details & Assignees */}
        <div className="lg:col-span-2 space-y-6">
          {/* Task Details Card */}
          <div className="bg-card border border-[var(--border)] rounded-lg p-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Task Details
            </h3>
            <div className="space-y-4">
              {/* Status */}
              <div>
                <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Current Status
                </h4>
                <span
                  className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(
                    task.status
                  )}`}
                >
                  {task.status.replace("_", " ").toUpperCase()}
                </span>
              </div>

              {/* Category */}
              <div>
                <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Category
                </h4>
                <span className="inline-block px-3 py-1 text-sm font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400 capitalize">
                  {task.category}
                </span>
              </div>

              {/* Created By and Date */}
              <div>
                <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Created By
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Creator:
                    </span>
                    <span className="text-[var(--foreground)]">
                      {task.creator.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Email:
                    </span>
                    <span className="text-[var(--foreground)] text-xs">
                      {task.creator.email}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Date:
                    </span>
                    <span className="text-[var(--foreground)]">
                      {formatDate(task.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Due Date / Deadline */}
              {task.dueDate && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Due Date / Deadline
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Deadline:
                      </span>
                      <span
                        className={`font-medium ${
                          task.isOverdue
                            ? "text-red-600"
                            : "text-[var(--foreground)]"
                        }`}
                      >
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                    {task.isOverdue && (
                      <div className="text-xs text-red-600 font-medium">
                        ⚠️ This task is overdue
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Associated Group */}
              {task.group && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Associated Group
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Group:
                      </span>
                      <span className="text-[var(--foreground)]">
                        {task.group.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Type:
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400 rounded capitalize">
                        {task.group.type}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Associated Event */}
              {task.event && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Associated Event
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Event:
                      </span>
                      <span className="text-[var(--foreground)]">
                        {task.event.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Date:
                      </span>
                      <span className="text-[var(--foreground)]">
                        {formatDate(task.event.startDate)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Block Information */}
              {task.isBlocked && task.blockReason && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Block Information
                  </h4>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Reason:</strong> {task.blockReason}
                    </p>
                  </div>
                </div>
              )}

              {/* Completion Details */}
              {task.completedAt && task.completedBy && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Completion Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Completed by:
                      </span>
                      <span className="text-[var(--foreground)]">
                        {task.completedBy.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Completed on:
                      </span>
                      <span className="text-[var(--foreground)]">
                        {formatDate(task.completedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Details */}
              {task.verifiedAt && task.verifiedBy && (
                <div>
                  <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                    Verification Details
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Verified by:
                      </span>
                      <span className="text-[var(--foreground)]">
                        {task.verifiedBy.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--muted-foreground)]">
                        Verified on:
                      </span>
                      <span className="text-[var(--foreground)]">
                        {formatDate(task.verifiedAt)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Task Settings */}
              <div>
                <h4 className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wide mb-2">
                  Task Settings
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Self-assignment:
                    </span>
                    <span className="text-[var(--foreground)]">
                      {task.allowSelfAssign ? "Allowed" : "Not Allowed"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[var(--muted-foreground)]">
                      Verification:
                    </span>
                    <span className="text-[var(--foreground)]">
                      {task.requiresVerification ? "Required" : "Not Required"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Assignees Section */}
          <div className="bg-card border border-[var(--border)] rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-blue-500" />
              <h3 className="text-lg font-semibold text-[var(--foreground)]">
                Assignees
              </h3>
              <span className="text-sm text-[var(--muted-foreground)]">
                ({task.assignees?.length || 0} assigned)
              </span>
            </div>

            {task.assignees && task.assignees.length > 0 ? (
              <div className="space-y-3">
                {task.assignees.map((assignee) => (
                  <div
                    key={assignee._id}
                    className="flex items-center justify-between p-3 rounded-lg bg-[var(--muted)]/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        {assignee.name?.charAt(0).toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--foreground)]">
                          {assignee.name}
                        </p>
                        <p className="text-sm text-[var(--muted-foreground)]">
                          {assignee.email}
                        </p>
                        <p className="text-xs text-[var(--muted-foreground)]">
                          Assigned {formatDate(assignee.assignedAt)} by{" "}
                          {assignee.assignedBy?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-2" />
                <p className="text-[var(--muted-foreground)]">
                  No assignees yet
                </p>
                <p className="text-sm text-[var(--muted-foreground)] mt-1">
                  {task.allowSelfAssign
                    ? "This task allows self-assignment"
                    : "Assignees will appear here when assigned"}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Task Timeline */}
        <div className="lg:col-span-1 lg:h-full">
          <div className="bg-card border border-[var(--border)] rounded-lg p-6 sticky top-6">
            <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4">
              Task Timeline
            </h3>
            <div className="space-y-4">
              {/* Created */}
              <div className="flex items-start gap-4 p-3 bg-[var(--muted)]/50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[var(--foreground)] text-sm">
                      Created
                    </span>
                  </div>
                  <p className="text-xs text-[var(--muted-foreground)] mt-1">
                    {formatDate(task.createdAt)}
                  </p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    by {task.creator.name}
                  </p>
                </div>
              </div>

              {/* Assignments */}
              {task.assignees?.map((assignee) => (
                <div
                  key={assignee._id}
                  className="flex items-start gap-4 p-3 bg-[var(--muted)]/50 rounded-lg"
                >
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-[var(--foreground)] text-sm">
                        Assigned
                      </span>
                    </div>
                    <p className="text-xs text-[var(--muted-foreground)] mt-1">
                      {formatDate(assignee.assignedAt)}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)]">
                      to {assignee.name}
                    </p>
                  </div>
                </div>
              ))}

              {/* Completion */}
              {task.completedAt && task.completedBy && (
                <div className="flex items-start gap-4 p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-green-800 dark:text-green-400 text-sm">
                        Completed
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                      {formatDate(task.completedAt)}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      by {task.completedBy.name}
                    </p>
                  </div>
                </div>
              )}

              {/* Verification */}
              {task.verifiedAt && task.verifiedBy && (
                <div className="flex items-start gap-4 p-3 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <div className="w-2 h-2 bg-emerald-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-emerald-800 dark:text-emerald-400 text-sm">
                        Verified
                      </span>
                    </div>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1">
                      {formatDate(task.verifiedAt)}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      by {task.verifiedBy.name}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Comments Tab - Shows task comments and allows adding new ones
 */
function CommentsTab({ task }: { task: Task }) {
  // Format date for comments
  const formatCommentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get comment type styling
  const getCommentTypeColor = (type: string) => {
    switch (type) {
      case "comment":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "status_change":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "assignment_change":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      case "system":
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  return (
    <div className="space-y-6">
      {task.comments && task.comments.length > 0 ? (
        <div className="space-y-4">
          {task.comments
            .sort(
              (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
            )
            .map((comment) => (
              <div
                key={comment._id}
                className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  {/* User Avatar */}
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {comment.user.name?.charAt(0).toUpperCase() || "?"}
                  </div>

                  <div className="flex-1 space-y-2">
                    {/* Comment Header */}
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-medium text-foreground">
                        {comment.user.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-medium rounded-full ${getCommentTypeColor(
                          comment.type
                        )}`}
                      >
                        {comment.type.replace("_", " ")}
                      </span>
                      <span className="text-[var(--muted-foreground)]">
                        {formatCommentDate(comment.createdAt)}
                      </span>
                    </div>

                    {/* Comment Content */}
                    <div className="text-sm text-foreground">
                      {comment.type === "status_change" &&
                      comment.statusChange ? (
                        <p>
                          Changed status from{" "}
                          <span className="font-medium">
                            {comment.statusChange.from.replace("_", " ")}
                          </span>{" "}
                          to{" "}
                          <span className="font-medium">
                            {comment.statusChange.to.replace("_", " ")}
                          </span>
                        </p>
                      ) : (
                        <p>{comment.content}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16">
          <MessageCircle className="h-16 w-16 text-[var(--muted-foreground)] mb-4" />
          <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
            No Comments Yet
          </h3>
          <p className="text-[var(--muted-foreground)] text-center max-w-md">
            Comments and activity will appear here as work progresses on this
            task.
          </p>
        </div>
      )}

      {/* Add Comment Section - TODO: Implement comment functionality */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
        <div className="flex flex-col items-center justify-center py-8">
          <MessageCircle className="h-12 w-12 text-[var(--muted-foreground)] mb-3" />
          <h4 className="text-lg font-semibold text-[var(--foreground)] mb-2">
            Comments Coming Soon
          </h4>
          <p className="text-[var(--muted-foreground)] text-center">
            Comment functionality will be implemented here. Users will be able
            to add comments, discuss task progress, and collaborate.
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * Placeholder tab component for media
 */
function MediaTab({ taskId }: { taskId: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <ImageIcon className="h-16 w-16 text-[var(--muted-foreground)] mb-4" />
      <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
        Media Attachments Coming Soon
      </h3>
      <p className="text-[var(--muted-foreground)] text-center max-w-md">
        Media sharing functionality will be implemented here. Users will be able
        to upload files, images, and documents related to the task.
      </p>
      <p className="text-sm text-[var(--muted-foreground)] mt-4">
        Task ID: {taskId}
      </p>
    </div>
  );
}
