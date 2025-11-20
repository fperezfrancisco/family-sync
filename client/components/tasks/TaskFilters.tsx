"use client";

import React from "react";
import { Filter, X, Users, Flag, Calendar, User } from "lucide-react";
import {
  TaskFilters as TaskFiltersType,
  TaskStatus,
  TaskPriority,
  TaskCategory,
} from "@/types/tasks";

interface TaskFiltersProps {
  onFilterChange: (filters: TaskFiltersType) => void;
  currentFilters: TaskFiltersType;
  availableGroups?: Array<{
    id: string;
    name: string;
    type: "family" | "friends" | "work" | "other";
  }>;
}

/**
 * TaskFilters Component
 * Provides filtering options for tasks by status, priority, category, assignment, and due date
 */
export default function TaskFilters({
  onFilterChange,
  currentFilters,
  availableGroups = [],
}: TaskFiltersProps) {
  /**
   * Update filters when a filter changes
   */
  const handleFilterUpdate = (
    key: keyof TaskFiltersType,
    value: string | boolean | undefined
  ) => {
    const updatedFilters = { ...currentFilters, [key]: value };

    // Clean up undefined values
    if (value === undefined || value === "all") {
      delete updatedFilters[key];
    }

    onFilterChange(updatedFilters);
  };

  /**
   * Clear all filters
   */
  const clearAllFilters = () => {
    onFilterChange({});
  };

  /**
   * Count active filters
   */
  const getActiveFilterCount = () => {
    return Object.keys(currentFilters).filter((key) => {
      const value = currentFilters[key as keyof TaskFiltersType];
      return value !== undefined && value !== "all" && value !== false;
    }).length;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--foreground)]" />
          <span className="font-medium text-[var(--foreground)]">Filters</span>
          {activeFilterCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          >
            <X className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {/* Filter Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Status
          </label>
          <select
            value={currentFilters.status || "all"}
            onChange={(e) =>
              handleFilterUpdate("status", e.target.value as TaskStatus | "all")
            }
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            <option value="all">All Status</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
            <option value="verified">Verified</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Priority Filter */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Priority
          </label>
          <select
            value={currentFilters.priority || "all"}
            onChange={(e) =>
              handleFilterUpdate(
                "priority",
                e.target.value as TaskPriority | "all"
              )
            }
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            Category
          </label>
          <select
            value={currentFilters.category || "all"}
            onChange={(e) =>
              handleFilterUpdate(
                "category",
                e.target.value as TaskCategory | "all"
              )
            }
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            <option value="all">All Categories</option>
            <option value="supplies">Supplies</option>
            <option value="logistics">Logistics</option>
            <option value="preparation">Preparation</option>
            <option value="chores">Chores</option>
            <option value="coordination">Coordination</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* Group Filter */}
        {availableGroups.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
              <Users className="h-4 w-4 inline mr-1" />
              Group
            </label>
            <select
              value={currentFilters.groupId || "all"}
              onChange={(e) => handleFilterUpdate("groupId", e.target.value)}
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
            >
              <option value="all">All Groups</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Assignment Filter */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            <User className="h-4 w-4 inline mr-1" />
            Assignment
          </label>
          <select
            value={
              currentFilters.assignedToMe
                ? "assigned_to_me"
                : currentFilters.createdByMe
                ? "created_by_me"
                : "all"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "assigned_to_me") {
                handleFilterUpdate("assignedToMe", true);
                handleFilterUpdate("createdByMe", undefined);
              } else if (value === "created_by_me") {
                handleFilterUpdate("createdByMe", true);
                handleFilterUpdate("assignedToMe", undefined);
              } else {
                handleFilterUpdate("assignedToMe", undefined);
                handleFilterUpdate("createdByMe", undefined);
              }
            }}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            <option value="all">All Tasks</option>
            <option value="assigned_to_me">Assigned to Me</option>
            <option value="created_by_me">Created by Me</option>
          </select>
        </div>

        {/* Due Date Filter */}
        <div>
          <label className="block text-sm font-medium text-[var(--foreground)] mb-2">
            <Calendar className="h-4 w-4 inline mr-1" />
            Due Date
          </label>
          <select
            value={
              currentFilters.isOverdue
                ? "overdue"
                : currentFilters.dueDate
                ? "due_soon"
                : "all"
            }
            onChange={(e) => {
              const value = e.target.value;
              if (value === "overdue") {
                handleFilterUpdate("isOverdue", true);
                handleFilterUpdate("dueDate", undefined);
              } else if (value === "due_soon") {
                // Due in next 7 days
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                handleFilterUpdate(
                  "dueDate",
                  nextWeek.toISOString().split("T")[0]
                );
                handleFilterUpdate("isOverdue", undefined);
              } else {
                handleFilterUpdate("isOverdue", undefined);
                handleFilterUpdate("dueDate", undefined);
              }
            }}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md text-sm focus:ring-2 focus:ring-[var(--primary)] focus:border-[var(--primary)]"
          >
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due Soon (7 days)</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--border)]">
          <div className="flex flex-wrap gap-2">
            {currentFilters.status && currentFilters.status !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                Status: {currentFilters.status.replace("_", " ")}
                <button
                  onClick={() => handleFilterUpdate("status", undefined)}
                  className="ml-1 hover:text-blue-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {currentFilters.priority && currentFilters.priority !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                <Flag className="h-3 w-3" />
                {currentFilters.priority}
                <button
                  onClick={() => handleFilterUpdate("priority", undefined)}
                  className="ml-1 hover:text-orange-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {currentFilters.category && currentFilters.category !== "all" && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                {currentFilters.category}
                <button
                  onClick={() => handleFilterUpdate("category", undefined)}
                  className="ml-1 hover:text-green-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {currentFilters.assignedToMe && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                <User className="h-3 w-3" />
                Assigned to Me
                <button
                  onClick={() => handleFilterUpdate("assignedToMe", undefined)}
                  className="ml-1 hover:text-purple-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {currentFilters.createdByMe && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                <User className="h-3 w-3" />
                Created by Me
                <button
                  onClick={() => handleFilterUpdate("createdByMe", undefined)}
                  className="ml-1 hover:text-indigo-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {currentFilters.isOverdue && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                <Calendar className="h-3 w-3" />
                Overdue
                <button
                  onClick={() => handleFilterUpdate("isOverdue", undefined)}
                  className="ml-1 hover:text-red-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {currentFilters.dueDate && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm rounded-full">
                <Calendar className="h-3 w-3" />
                Due Soon
                <button
                  onClick={() => handleFilterUpdate("dueDate", undefined)}
                  className="ml-1 hover:text-yellow-900"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
