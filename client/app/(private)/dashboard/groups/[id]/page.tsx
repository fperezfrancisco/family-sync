"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import { GroupsAPI } from "@/lib/api"; // TODO: Uncomment when API is ready
import { Group } from "@/types/groups";
import { useAuth } from "@/context/AuthContext";
import { GroupHeader, GroupTabs } from "@/components/groups";
import { useGroups } from "@/context/GroupsContext";
import { ArrowLeft } from "lucide-react";

/**
 * Individual Group Page
 * Displays detailed view of a specific group with tabs for different functionality
 * Access controlled by user's role in the group
 */
export default function GroupPage() {
  const params = useParams();
  const groupId = params.id as string;
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { groups } = useGroups();
  const router = useRouter();

  /**
   * Fetch group data from API
   * TODO: Replace with actual API call when backend is ready
   */
  const fetchGroup = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Uncomment when API is ready
      // const groupData = await GroupsAPI.getById(groupId);
      // setGroup(groupData);

      // Temporary dummy data for development

      const foundGroup = groups.find((g) => g.id === groupId);
      if (foundGroup) {
        setGroup(foundGroup);
      } else {
        setError("Group not found");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [groupId, groups]);

  useEffect(() => {
    if (groupId) {
      fetchGroup();
    }
  }, [groupId, fetchGroup]);

  /**
   * Handle group updates (edit/delete)
   * Called from GroupHeader component
   */
  const handleGroupUpdate = () => {
    fetchGroup(); // Refetch group data after updates
  };

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-32 bg-muted rounded-lg"></div>
        <div className="h-12 bg-muted rounded-lg"></div>
        <div className="h-96 bg-muted rounded-lg"></div>
      </div>
    );
  }

  // Error state
  if (error || !group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {error || "Group Not Found"}
        </h2>
        <p className="text-muted-foreground mb-4">
          The group you&apos;re looking for doesn&apos;t exist or you don&apos;t
          have access to it.
        </p>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full h-full">
      <button
        onClick={() => router.back()}
        className="flex items-center text-white hover:text-[var(--foreground)] transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Groups
      </button>
      {/* Group Header with title, description, and action buttons */}
      <GroupHeader
        group={group}
        currentUserId={user?.id === null ? undefined : user?.id}
        onGroupUpdate={handleGroupUpdate}
      />

      {/* Tab Navigation and Content */}
      <GroupTabs groupId={groupId} group={group} />
    </div>
  );
}
