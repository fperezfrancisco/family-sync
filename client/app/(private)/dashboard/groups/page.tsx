"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import CreateGroupForm, {
  CreateGroupFormData,
} from "@/components/groups/CreateGroupForm";
import { GroupGrid } from "@/components/groups";
import { useGroups } from "@/context/GroupsContext";
import { useAuth } from "@/context/AuthContext";
import { Group } from "@/types/groups";

/**
 * Groups Page
 * Shows user's groups and group management functionality
 */
export default function GroupsPage() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { createNewGroup, groups, loading } = useGroups();
  const { user } = useAuth();

  // Dummy groups for demonstration (remove when API is connected)
  const dummyGroups: Group[] = [
    {
      id: "1",
      name: "Smith Family",
      description:
        "Our loving family group where we share memories, plan gatherings, and stay connected.",
      type: "family",
      owner: user?.id || "user1",
      members: [
        {
          user: {
            id: user?.id || "user1",
            name: user?.name || "John Smith",
            email: user?.email || "john@example.com",
            groups: [],
          },
          role: "owner",
        },
        {
          user: {
            id: "user2",
            name: "Jane Smith",
            email: "jane@example.com",
            groups: [],
          },
          role: "admin",
        },
        {
          user: {
            id: "user3",
            name: "Mike Smith",
            email: "mike@example.com",
            groups: [],
          },
          role: "member",
        },
      ],
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      name: "Weekend Warriors",
      description: "Friends who love outdoor adventures and weekend getaways.",
      type: "friends",
      owner: "user4",
      members: [
        {
          user: {
            id: user?.id || "user1",
            name: user?.name || "John Smith",
            email: user?.email || "john@example.com",
            groups: [],
          },
          role: "member",
        },
        {
          user: {
            id: "user4",
            name: "Sarah Connor",
            email: "sarah@example.com",
            groups: [],
          },
          role: "owner",
        },
        {
          user: {
            id: "user5",
            name: "David Wilson",
            email: "david@example.com",
            groups: [],
          },
          role: "member",
        },
        {
          user: {
            id: "user6",
            name: "Lisa Johnson",
            email: "lisa@example.com",
            groups: [],
          },
          role: "admin",
        },
      ],
      createdAt: "2024-02-20T14:15:00Z",
    },
  ];

  // Use dummy groups if no real groups exist (for demonstration)
  const displayGroups = groups.length > 0 ? groups : dummyGroups;

  // Handle create group form submission
  const handleCreateGroup = async (data: CreateGroupFormData) => {
    setIsLoading(true);
    try {
      console.log("Creating group with data:", data);
      const response = await createNewGroup(data);
      console.log("Create group response:", response);
      alert(response?.message);
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle group actions
  const handleViewDetails = (groupId: string) => {
    console.log("View details for group:", groupId);
    // TODO: Navigate to group details page
  };

  const handleManageGroup = (groupId: string) => {
    console.log("Manage group:", groupId);
    // TODO: Open group management modal
  };

  const handleViewMessages = (groupId: string) => {
    console.log("View messages for group:", groupId);
    // TODO: Navigate to group chat
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-inter">
            Groups
          </h1>
          <p className="text-muted-foreground mt-2 font-inter">
            Manage your family and friend groups
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-sm text-white transition-colors font-inter"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </button>
      </div>

      {/* Groups Grid */}
      <GroupGrid
        groups={groups}
        loading={loading}
        currentUserId={user?.id || undefined}
        onCreateGroup={() => setIsCreateModalOpen(true)}
        onViewDetails={handleViewDetails}
        onManageGroup={handleManageGroup}
        onViewMessages={handleViewMessages}
      />

      {/* Create Group Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => !isLoading && setIsCreateModalOpen(false)}
        title="Create New Group"
        size="md"
      >
        <CreateGroupForm
          onSubmit={handleCreateGroup}
          onCancel={() => setIsCreateModalOpen(false)}
          isLoading={isLoading}
        />
      </Modal>
    </div>
  );
}
