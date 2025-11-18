"use client";

import React, { useState } from "react";
import { Trash2, Users, Edit3, ArrowLeft, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import { Group, GroupMember } from "@/types/groups";
import Modal from "@/components/ui/Modal";
import { GroupsAPI } from "@/lib/api";

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

  const userRole = getUserRole(group, currentUserId);
  const canEdit = canEditGroup(userRole);
  const canDelete = canDeleteGroup(userRole);

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
      // await GroupsAPI.deleteGroup(group.id);
      console.log("Delete group:", group.id);

      // Navigate back to groups page after deletion
      router.push("/dashboard/groups");
    } catch (error) {
      console.error("Failed to delete group:", error);
      alert("Failed to delete group. Please try again.");
    } finally {
      setIsLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-6 space-y-6">
        {/* Navigation and Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Groups
          </button>

          {/* Action Buttons - Only show if user has permissions */}
          {(canEdit || canDelete) && (
            <div className="flex items-center gap-2">
              {canEdit && (
                <button
                  onClick={handleEditGroup}
                  className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Edit Group
                </button>
              )}
              {canDelete && (
                <button
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="flex items-center px-3 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Group
                </button>
              )}
            </div>
          )}
        </div>

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

          {/* Description */}
          {group.description && (
            <p className="text-muted-foreground text-lg leading-relaxed">
              {group.description}
            </p>
          )}

          {/* Group Statistics */}
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
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
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">
              Members:
            </span>
            <div className="flex -space-x-2">
              {group.members.slice(0, 5).map((member, index) => (
                <div
                  key={member.id}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-background flex items-center justify-center text-white text-xs font-medium"
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

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => !isLoading && setIsDeleteModalOpen(false)}
        title="Delete Group"
        size="md"
      >
        <div className="space-y-4">
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
    </>
  );
}
