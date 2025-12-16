"use client";

import React from "react";
import { Trash2, Crown, ShieldAlert } from "lucide-react";
import { GroupMember } from "@/types/groups";

interface MemberRowProps {
  member: GroupMember;
  isOwner: boolean;
  currentUserId?: string;
  userRole: GroupMember["role"] | null;
  selectedRole: GroupMember["role"] | undefined;
  onRoleChange: (newRole: GroupMember["role"]) => void;
  onRemove: () => void;
  isSaving: boolean;
  hasUnsavedChanges?: boolean;
}

/**
 * Utility to get role badge color
 */
const getRoleBadgeColor = (role: GroupMember["role"]) => {
  switch (role) {
    case "owner":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
    case "admin":
      return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
    case "member":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
    case "guest":
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
  }
};

/**
 * Get available roles based on hierarchy
 */
const getAvailableRoles = (
  currentRole: GroupMember["role"],
  userRole: GroupMember["role"] | null
): GroupMember["role"][] => {
  // Owner can change to any role
  if (userRole === "owner") {
    return ["admin", "member", "guest"];
  }

  // Admin can only change between member and guest (not admin)
  if (userRole === "admin") {
    if (currentRole === "admin") {
      return []; // Cannot change another admin's role
    }
    return ["member", "guest"];
  }

  return [];
};

/**
 * MemberRow Component
 * Display individual member with role selector and remove button
 */
export default function MemberRow({
  member,
  isOwner,
  currentUserId,
  userRole,
  selectedRole,
  onRoleChange,
  onRemove,
  isSaving,
  hasUnsavedChanges,
}: MemberRowProps) {
  const currentRole = selectedRole || member.role;
  const availableRoles = getAvailableRoles(member.role, userRole);
  const isCurrentUser = member.id === currentUserId;
  const canRemove =
    !isOwner && // Cannot remove owner
    (isCurrentUser || // Can remove self
      (userRole === "owner" && member.role !== "owner") || // Owner can remove anyone except themselves
      (userRole === "admin" &&
        member.role !== "admin" &&
        member.role !== "owner")); // Admin can remove members/guests only

  return (
    <div className="flex items-center justify-between p-4 bg-[var(--card)] border border-[var(--border)] rounded-lg hover:bg-[var(--muted-foreground)]/50 transition-colors">
      {/* Member Info */}
      <div className="flex items-center gap-4 flex-1 min-w-0">
        {/* Avatar */}
        <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-medium shrink-0">
          {member.name?.charAt(0).toUpperCase() || "?"}
        </div>

        {/* Name and Email */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground truncate">
              {member.name}
            </p>
            {isCurrentUser && (
              <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-full">
                You
              </span>
            )}
            {isOwner && (
              <Crown className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
            )}
          </div>
          <p className="text-sm text-[var(--muted-foreground)] truncate">
            {member.email}
          </p>
        </div>
      </div>

      {/* Role Selector or Badge */}
      <div className="flex items-center gap-3 ml-4">
        {isOwner ? (
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadgeColor(
              member.role
            )}`}
          >
            {member.role}
          </span>
        ) : availableRoles.length > 0 ? (
          <select
            value={currentRole}
            onChange={(e) =>
              onRoleChange(e.target.value as GroupMember["role"])
            }
            disabled={isSaving}
            className="px-3 py-1.5 bg-[var(--card)] border border-[var(--border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <option value="">-- Change role --</option>
            {availableRoles.map((role) => (
              <option key={role} value={role}>
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </option>
            ))}
          </select>
        ) : (
          <span
            className={`px-3 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadgeColor(
              member.role
            )}`}
          >
            {member.role}
          </span>
        )}

        {/* Unsaved change indicator */}
        {hasUnsavedChanges && selectedRole && selectedRole !== member.role && (
          <div title="Role changed" className="p-2">
            <ShieldAlert className="h-4 w-4 text-orange-500" />
          </div>
        )}

        {/* Remove Button */}
        {canRemove && !isOwner && (
          <button
            onClick={onRemove}
            disabled={isSaving}
            title={
              isCurrentUser ? "Leave group" : `Remove ${member.name} from group`
            }
            className="p-2 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
          </button>
        )}
      </div>
    </div>
  );
}
