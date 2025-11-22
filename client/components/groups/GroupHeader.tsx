"use client";

import React, { useState } from "react";
import {
  Trash2,
  Users,
  Edit3,
  ArrowLeft,
  Calendar,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Group, GroupMember } from "@/types/groups";
import Modal from "@/components/ui/Modal";
import { useGroups } from "@/context/GroupsContext";
// INVITATION SYSTEM: Import invite modal
import InviteMembersModal from "./InviteMembersModal";
import Image from "next/image";

interface GroupHeaderProps {
  group: Group;
  currentUserId?: string;
  onGroupUpdate: () => void;
}

/**
 * Utility function to get user's role in the group
 */
const getUserRole = (
  group: Group,
  userId?: string
): GroupMember["role"] | null => {
  if (!userId) return null;
  const member = group.members.find((m) => m.id === userId);
  return member?.role || null;
};

/**
 * Utility function to check if user can edit group
 * Owners and admins can edit
 */
const canEditGroup = (role: GroupMember["role"] | null): boolean => {
  return role === "owner" || role === "admin";
};

/**
 * Utility function to check if user can delete group
 * Only owners can delete
 */
const canDeleteGroup = (role: GroupMember["role"] | null): boolean => {
  return role === "owner";
};

/**
 * INVITATION SYSTEM: Utility function to check if user can invite members
 * Owners and admins can invite
 */
const canInviteMembers = (role: GroupMember["role"] | null): boolean => {
  return role === "owner" || role === "admin";
};

/**
 * Group Header Component
 * Displays group information and action buttons based on user permissions
 */
export default function GroupHeader({
  group,
  currentUserId,
  onGroupUpdate,
}: GroupHeaderProps) {
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // INVITATION SYSTEM: Add invite modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const { deleteGroup } = useGroups();

  const userRole = getUserRole(group, currentUserId);
  const canEdit = canEditGroup(userRole);
  const canDelete = canDeleteGroup(userRole);
  // INVITATION SYSTEM: Add invite permission check
  const canInvite = canInviteMembers(userRole);

  // Get group type styling
  const getGroupTypeColor = (type: Group["type"]) => {
    switch (type) {
      case "family":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "friends":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "work":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  // Get role badge styling
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

  // Handle edit group
  const handleEditGroup = () => {
    // TODO: Implement edit functionality
    console.log("Edit group:", group.id);
    setIsEditModalOpen(true);
  };

  // Handle delete group
  const handleDeleteGroup = async () => {
    try {
      setIsLoading(true);
      // TODO: Uncomment when API is ready

      console.log("Delete group:", group.id);
      const response = await deleteGroup(group.id);
      if (response && response.message) {
        console.log("Group deleted: ", response.message);
        // Navigate back to groups page after deletion
        router.push("/dashboard/groups");
      }
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Failed to delete group. Please try again.");
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  // INVITATION SYSTEM: Handle invitation sent
  const handleInvitationSent = () => {
    // Refresh group data to show updated member count
    if (onGroupUpdate) {
      onGroupUpdate();
    }
  };

  return (
    <>
      <div className="w-full bg-card border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="w-full aspect-[3/2] md:aspect-[24/9] bg-neutral-200 relative overflow-hidden">
          <div className="w-full h-full absolute z-[5] bg-black/20"></div>
          <Image
            src="/wallpapers/default-cabin.jpg"
            alt="User Wallpaper"
            width={2000}
            height={1000}
            className="object-cover bottom-0 h-full"
          />
          <div className="flex items-center justify-between absolute top-4 left-4 z-10">
            <button
              onClick={() => router.back()}
              className="flex items-center text-white hover:text-[var(--foreground)] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Groups
            </button>
          </div>
        </div>
        <div className="w-full p-6 flex flex-wrap items-start gap-6">
          {/* Group Information */}
          <div className="space-y-4">
            {/* Title and Type */}
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-foreground font-inter">
                    {group.name}
                  </h1>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${getGroupTypeColor(
                      group.type
                    )}`}
                  >
                    {group.type}
                  </span>
                </div>

                {/* User's Role Badge */}
                {userRole && (
                  <span
                    className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full capitalize ${getRoleBadgeColor(
                      userRole
                    )}`}
                  >
                    Your role: {userRole}
                  </span>
                )}
              </div>
            </div>
            {/* Action Buttons - Only show if user has permissions */}
            {(canEdit || canDelete || canInvite) && (
              <div className="flex flex-wrap items-center gap-2">
                {/* INVITATION SYSTEM: Invite Members button */}
                {canInvite && (
                  <button
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center px-3 py-2 text-xs bg-[var(--muted)] text-white rounded-md hover:bg-green-500 hover:dark:bg-green-700 transition-colors"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Members
                  </button>
                )}
                {canEdit && (
                  <button
                    onClick={handleEditGroup}
                    className="flex items-center px-3 py-2 text-xs bg-[var(--muted)] text-white rounded-md hover:bg-blue-500 hover:dark:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit Group
                  </button>
                )}
                {canDelete && (
                  <button
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="flex items-center px-3 py-2 text-xs bg-[var(--muted)] text-red-600 dark:text-red-400 rounded-md hover:bg-red-500 hover:text-white hover:dark:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Group
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="space-y-2 grow flex flex-col">
            {/* Description */}
            {group.description && (
              <p className="text-muted-foreground text-lg leading-relaxed w-full">
                {group.description}
              </p>
            )}

            {/* Group Statistics */}
            <div className="flex items-center gap-6 text-sm text-muted-foreground w-full">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span>{group.members.length} members</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Created {new Date(group.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Member Avatars Preview */}
            <div className="flex items-center gap-3 w-full">
              <span className="text-sm font-medium text-foreground">
                Members:
              </span>
              <div className="flex -space-x-2">
                {group.members.slice(0, 5).map((member) => (
                  <div
                    key={member.id}
                    className="w-8 h-8 bg-linear-to-br from-blue-500 to-purple-600 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium"
                    title={`${member.name} (${member.role})`}
                  >
                    {member.name?.charAt(0).toUpperCase() || "?"}
                  </div>
                ))}
                {group.members.length > 5 && (
                  <div className="w-8 h-8 bg-muted border-2 border-background rounded-full flex items-center justify-center text-muted-foreground text-xs font-medium">
                    +{group.members.length - 5}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Navigation and Actions */}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isLoading && setIsDeleteModalOpen(false)}
        title="Delete Group"
        size="md"
      >
        <div className="space-y-4 p-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete &quot;{group.name}&quot;? This
            action cannot be undone. All group data, messages, and files will be
            permanently lost.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isLoading}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteGroup}
              disabled={isLoading}
              className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors disabled:opacity-50"
            >
              {isLoading ? "Deleting..." : "Delete Group"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Group Modal - Placeholder for now */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Group"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Edit group functionality will be implemented here.
          </p>
          <div className="flex justify-end">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </Modal>

      {/* INVITATION SYSTEM: Invite Members Modal */}
      <InviteMembersModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        groupId={group.id}
        groupName={group.name}
        onInvitationSent={handleInvitationSent}
      />
    </>
  );
}
