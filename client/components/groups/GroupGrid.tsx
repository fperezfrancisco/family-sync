"use client";

import React from "react";
import { Group } from "@/types/groups";
import GroupCard from "./GroupCard";
import { Users } from "lucide-react";

interface GroupGridProps {
  groups: Group[];
  loading?: boolean;
  currentUserId?: string;
  onCreateGroup?: () => void;
  onViewDetails?: (groupId: string) => void;
  onManageGroup?: (groupId: string) => void;
  onViewMessages?: (groupId: string) => void;
}

/**
 * GroupGrid Component
 * Displays groups in a responsive grid layout with empty state
 */
export default function GroupGrid({
  groups,
  loading = false,
  currentUserId,
  onCreateGroup,
  onViewDetails,
  onManageGroup,
  onViewMessages,
}: GroupGridProps) {
  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Loading skeletons */}
        {[...Array(6)].map((_, index) => (
          <div
            key={index}
            className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6 animate-pulse"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-[var(--muted)] rounded-lg"></div>
                <div>
                  <div className="w-24 h-5 bg-[var(--muted)] rounded mb-2"></div>
                  <div className="w-16 h-4 bg-[var(--muted)] rounded"></div>
                </div>
              </div>
              <div className="w-6 h-6 bg-[var(--muted)] rounded"></div>
            </div>
            <div className="w-full h-4 bg-[var(--muted)] rounded mb-4"></div>
            <div className="flex space-x-4 mb-4">
              <div className="w-16 h-3 bg-[var(--muted)] rounded"></div>
              <div className="w-16 h-3 bg-[var(--muted)] rounded"></div>
              <div className="w-16 h-3 bg-[var(--muted)] rounded"></div>
            </div>
            <div className="flex space-x-2">
              <div className="flex-1 h-8 bg-[var(--muted)] rounded"></div>
              <div className="flex-1 h-8 bg-[var(--muted)] rounded"></div>
              <div className="w-8 h-8 bg-[var(--muted)] rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Empty state
  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-16">
        <Users className="h-16 w-16 text-[var(--muted-foreground)] mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-[var(--foreground)] mb-2 font-inter">
          No Groups Yet
        </h2>
        <p className="text-[var(--muted-foreground)] mb-6 font-inter max-w-md mx-auto">
          Create your first group to start connecting with family and friends.
          Organize events, share memories, and stay in touch.
        </p>
        {onCreateGroup && (
          <button
            onClick={onCreateGroup}
            className="px-6 py-3 rounded-md bg-[var(--primary)] hover:bg-[var(--primary)]/80 text-sm text-white transition-colors font-inter"
          >
            Create Your First Group
          </button>
        )}
      </div>
    );
  }

  // Groups grid
  return (
    <div className="space-y-6">
      {/* Groups count header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted-foreground)] font-inter">
          {groups.length} group{groups.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Responsive grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {groups.map((group) => (
          <GroupCard
            key={group.id}
            group={group}
            currentUserId={currentUserId}
            onViewDetails={onViewDetails}
            onManageGroup={onManageGroup}
            onViewMessages={onViewMessages}
          />
        ))}
      </div>
    </div>
  );
}
