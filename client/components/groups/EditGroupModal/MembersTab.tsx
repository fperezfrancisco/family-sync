"use client";

import React, { useState, useMemo } from "react";
import { Search, AlertCircle, Crown } from "lucide-react";
import { Group, GroupMember } from "@/types/groups";
import MemberRow from "./MemberRow";

interface MembersTabProps {
  members: Group["members"];
  currentUserId?: string;
  userRole: GroupMember["role"] | null;
  roleChanges: Record<string, GroupMember["role"]>;
  onRoleChange: (memberId: string, newRole: GroupMember["role"]) => void;
  onRemoveMember: (memberId: string, memberName: string) => Promise<void>;
  hasChanges: boolean;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

/**
 * MembersTab Component
 * Manage group members, change roles, remove members
 */
export default function MembersTab({
  members,
  currentUserId,
  userRole,
  roleChanges,
  onRoleChange,
  onRemoveMember,
  hasChanges,
  onSave,
  isSaving,
}: MembersTabProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);

  // Find owner
  const owner = members.find((m) => m.role === "owner");

  // Filter members based on search
  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return members;

    const term = searchTerm.toLowerCase();
    return members.filter(
      (member) =>
        member.name?.toLowerCase().includes(term) ||
        member.email?.toLowerCase().includes(term)
    );
  }, [members, searchTerm]);

  // Sort: owner first, then by name
  const sortedMembers = useMemo(() => {
    return [...filteredMembers].sort((a, b) => {
      if (a.role === "owner") return -1;
      if (b.role === "owner") return 1;
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [filteredMembers]);

  const handleRemove = async (memberId: string, memberName: string) => {
    try {
      setIsRemoving(true);
      await onRemoveMember(memberId, memberName);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleSave = async () => {
    await onSave();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Member Count */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">
            Group Members ({members.length})
          </h3>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">
            Manage member roles and permissions
          </p>
        </div>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full pl-10 pr-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-md text-foreground placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
        />
      </div>

      {/* Members List */}
      <div className="space-y-3">
        {sortedMembers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-[var(--muted-foreground)] text-sm">
              {searchTerm
                ? "No members found matching your search"
                : "No members"}
            </p>
          </div>
        ) : (
          sortedMembers.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              isOwner={member.role === "owner"}
              currentUserId={currentUserId}
              userRole={userRole}
              selectedRole={roleChanges[member.id]}
              onRoleChange={(newRole) => onRoleChange(member.id, newRole)}
              onRemove={() => handleRemove(member.id, member.name)}
              isSaving={isRemoving || isSaving}
              hasUnsavedChanges={
                roleChanges[member.id] !== undefined &&
                roleChanges[member.id] !== member.role
              }
            />
          ))
        )}
      </div>

      {/* Owner Info */}
      {owner && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-start gap-2">
          <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-800 dark:text-yellow-300">
            <span className="font-medium">Group Owner:</span> {owner.name} —
            Only the owner can delete the group
          </p>
        </div>
      )}

      {/* Unsaved Changes Indicator */}
      {hasChanges && (
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
          <p className="text-sm text-orange-800 dark:text-orange-300">
            You have unsaved role changes
          </p>
        </div>
      )}

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <button
            onClick={handleSave}
            disabled={isSaving || isRemoving}
            className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {isSaving ? "Saving..." : "Apply Role Changes"}
          </button>
        </div>
      )}
    </div>
  );
}
