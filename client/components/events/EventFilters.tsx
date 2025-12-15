"use client";

import React, { useState } from "react";
import {
  Calendar,
  Filter,
  X,
  Users,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface EventFiltersProps {
  onFilterChange: (filters: EventFilters) => void;
  currentFilters: EventFilters;
  availableGroups?: Array<{
    id: string;
    name: string;
    type: "family" | "friends" | "work" | "other";
  }>;
}

export interface EventFilters {
  dateRange?: "today" | "week" | "month" | "custom";
  startDate?: string;
  endDate?: string;
  status?: "all" | "draft" | "published" | "cancelled" | "completed";
  groupId?: string;
  rsvpStatus?: "all" | "attending" | "pending" | "not_attending" | "maybe";
}

/**
 * EventFilters Component
 * Provides filtering options for events by date, status, group, and RSVP status
 */
export default function EventFilters({
  onFilterChange,
  currentFilters,
  availableGroups = [],
}: EventFiltersProps) {
  // State for collapsible filters on mobile
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  /**
   * Update filters when a filter changes
   */
  const handleFilterUpdate = (
    key: keyof EventFilters,
    value: string | undefined
  ) => {
    const updatedFilters = { ...currentFilters, [key]: value };

    // Clear custom dates when switching to preset ranges
    if (key === "dateRange" && value !== "custom") {
      delete updatedFilters.startDate;
      delete updatedFilters.endDate;
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
   * Check if any filters are active
   */
  const hasActiveFilters = () => {
    return Object.values(currentFilters).some(
      (value) => value !== undefined && value !== "all" && value !== ""
    );
  };

  return (
    <div className="space-y-4">
      {/* Mobile Filter Toggle Button */}
      <div className="lg:hidden">
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className="flex items-center justify-between w-full px-4 py-3 bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-lg border border-[var(--border)] transition-colors"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-[var(--foreground)]" />
            <span className="font-medium text-[var(--foreground)]">
              Filters
            </span>
            {hasActiveFilters() && (
              <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                {
                  Object.values(currentFilters).filter(
                    (v) => v !== undefined && v !== "all" && v !== ""
                  ).length
                }
              </span>
            )}
          </div>
          {isFiltersOpen ? (
            <ChevronUp className="h-4 w-4 text-[var(--muted-foreground)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--muted-foreground)]" />
          )}
        </button>

        {/* Clear All Button for Mobile - shown when filters are active */}
        {hasActiveFilters() && isFiltersOpen && (
          <div className="mt-2">
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] rounded-md transition-colors"
            >
              <X className="h-3 w-3" />
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Desktop Header - Always visible on desktop */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[var(--muted-foreground)]" />
          <h3 className="font-semibold text-[var(--foreground)] font-inter">
            Filters
          </h3>
        </div>

        {hasActiveFilters() && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 px-3 py-1 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <X className="h-3 w-3" />
            Clear All
          </button>
        )}
      </div>

      {/* Filter Grid - Collapsible on mobile, always visible on desktop */}
      <div className={`${isFiltersOpen ? "block" : "hidden"} lg:block`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)] font-inter">
              Date Range
            </label>
            <select
              value={currentFilters.dateRange || ""}
              onChange={(e) =>
                handleFilterUpdate("dateRange", e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Events</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range */}
          {currentFilters.dateRange === "custom" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)] font-inter">
                  Start Date
                </label>
                <input
                  type="date"
                  value={currentFilters.startDate || ""}
                  onChange={(e) =>
                    handleFilterUpdate("startDate", e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--foreground)] font-inter">
                  End Date
                </label>
                <input
                  type="date"
                  value={currentFilters.endDate || ""}
                  onChange={(e) =>
                    handleFilterUpdate("endDate", e.target.value || undefined)
                  }
                  className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {/* Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)] font-inter">
              Status
            </label>
            <select
              value={currentFilters.status || "all"}
              onChange={(e) =>
                handleFilterUpdate(
                  "status",
                  e.target.value === "all" ? undefined : e.target.value
                )
              }
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="cancelled">Cancelled</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Group Filter */}
          {availableGroups.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--foreground)] font-inter">
                Group
              </label>
              <select
                value={currentFilters.groupId || ""}
                onChange={(e) =>
                  handleFilterUpdate("groupId", e.target.value || undefined)
                }
                className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Groups</option>
                {availableGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* RSVP Status Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)] font-inter">
              My RSVP Status
            </label>
            <select
              value={currentFilters.rsvpStatus || "all"}
              onChange={(e) =>
                handleFilterUpdate(
                  "rsvpStatus",
                  e.target.value === "all" ? undefined : e.target.value
                )
              }
              className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Events</option>
              <option value="attending">Attending</option>
              <option value="maybe">Maybe</option>
              <option value="pending">Pending Response</option>
              <option value="not_attending">Not Attending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters() && (
        <div className="pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-[var(--foreground)] font-inter">
              Active Filters:
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* Date Range Filter Tag */}
            {currentFilters.dateRange && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-[var(--foreground)] dark:bg-blue-900/20 dark:text-blue-300 text-sm rounded-full">
                <Calendar className="h-3 w-3" />
                {currentFilters.dateRange === "custom"
                  ? "Custom Date Range"
                  : currentFilters.dateRange.charAt(0).toUpperCase() +
                    currentFilters.dateRange.slice(1)}
                <button
                  onClick={() => handleFilterUpdate("dateRange", undefined)}
                  className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Status Filter Tag */}
            {currentFilters.status && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 text-sm rounded-full">
                Status:{" "}
                {currentFilters.status.charAt(0).toUpperCase() +
                  currentFilters.status.slice(1)}
                <button
                  onClick={() => handleFilterUpdate("status", undefined)}
                  className="hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* Group Filter Tag */}
            {currentFilters.groupId && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 text-sm rounded-full">
                <Users className="h-3 w-3" />
                {availableGroups.find((g) => g.id === currentFilters.groupId)
                  ?.name || "Selected Group"}
                <button
                  onClick={() => handleFilterUpdate("groupId", undefined)}
                  className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {/* RSVP Status Filter Tag */}
            {currentFilters.rsvpStatus && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300 text-sm rounded-full">
                RSVP:{" "}
                {currentFilters.rsvpStatus.charAt(0).toUpperCase() +
                  currentFilters.rsvpStatus.slice(1)}
                <button
                  onClick={() => handleFilterUpdate("rsvpStatus", undefined)}
                  className="hover:bg-orange-200 dark:hover:bg-orange-800 rounded-full p-0.5"
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
