"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertCircle,
  CheckCircle,
  FileText,
  Users,
  Settings,
  Palette,
  Menu,
  X,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import { Group, GroupMember } from "@/types/groups";
import { GroupsAPI } from "@/lib/api";
import DetailsTab from "./EditGroupModal/DetailsTab";
import MembersTab from "./EditGroupModal/MembersTab";
import SettingsTab from "./EditGroupModal/SettingsTab";
import { AppearanceTab } from "./EditGroupModal/AppearanceTab";

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  currentUserId?: string;
  onGroupUpdate?: () => void;
}

/**
 * Extend Group type to include inviteSettings
 */
interface GroupWithSettings extends Group {
  inviteSettings?: {
    allowMemberInvites?: boolean;
    requireApproval?: boolean;
    maxMembers?: number;
  };
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
 */
const canEditGroup = (role: GroupMember["role"] | null): boolean => {
  return role === "owner" || role === "admin";
};

/**
 * EditGroupModal Component
 * Multi-tab modal for editing group details, managing members, and configuring settings
 */
export default function EditGroupModal({
  isOpen,
  onClose,
  group,
  currentUserId,
  onGroupUpdate,
}: EditGroupModalProps) {
  const [activeTab, setActiveTab] = useState<
    "details" | "members" | "settings" | "appearance"
  >("details");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form state for Details Tab
  const [detailsData, setDetailsData] = useState({
    name: group.name,
    description: group.description || "",
    type: group.type,
  });
  const [detailsChanged, setDetailsChanged] = useState(false);

  // Form state for Members Tab
  const [members, setMembers] = useState<Group["members"]>(group.members);
  const [memberRoleChanges, setMemberRoleChanges] = useState<
    Record<string, GroupMember["role"]>
  >({});
  const [membersChanged, setMembersChanged] = useState(false);

  // Form state for Settings Tab
  const groupWithSettings = group as GroupWithSettings;
  const [settingsData, setSettingsData] = useState({
    allowMemberInvites:
      groupWithSettings.inviteSettings?.allowMemberInvites ?? false,
    requireApproval: groupWithSettings.inviteSettings?.requireApproval ?? false,
    maxMembers: groupWithSettings.inviteSettings?.maxMembers || "",
  });
  const [settingsChanged, setSettingsChanged] = useState(false);

  // Form state for Appearance Tab
  const [customizationData, setCustomizationData] = useState(
    group.customization || {
      headerImage: {
        source: "preset" as const,
        value: "mountain-sunrise",
      },
      accentColor: {
        preset: "blue",
        hex: "#3b82f6",
      },
    }
  );

  const userRole = getUserRole(group, currentUserId);
  const canEdit = canEditGroup(userRole);
  const isOwner = userRole === "owner";

  // Load members when modal opens
  const loadMembers = useCallback(async () => {
    try {
      const response = await GroupsAPI.getGroupMembers(group.id);
      if (response && response.members) {
        setMembers(response.members);
      }
    } catch (error) {
      console.error("Error loading members:", error);
      setError("Failed to load group members");
    }
  }, [group.id]);

  useEffect(() => {
    if (isOpen && group.id) {
      loadMembers();
    }
  }, [isOpen, group.id, loadMembers]);

  /**
   * Handle details tab changes
   */
  const handleDetailsChange = (
    field: string,
    value: string | Group["type"]
  ) => {
    setDetailsData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setDetailsChanged(true);
    setError("");
  };

  /**
   * Handle member role change
   */
  const handleMemberRoleChange = (
    memberId: string,
    newRole: GroupMember["role"]
  ) => {
    setMemberRoleChanges((prev) => ({
      ...prev,
      [memberId]: newRole,
    }));
    setMembersChanged(true);
    setError("");
  };

  /**
   * Save details changes
   */
  const saveDetails = async () => {
    if (!detailsChanged) return;

    try {
      setIsSaving(true);
      setError("");

      // Validate
      if (!detailsData.name.trim()) {
        setError("Group name is required");
        return;
      }

      if (detailsData.name.length > 200) {
        setError("Group name must be 200 characters or less");
        return;
      }

      if (detailsData.description.length > 2000) {
        setError("Description must be 2000 characters or less");
        return;
      }

      const response = await GroupsAPI.editGroup(group.id, {
        name: detailsData.name.trim(),
        description: detailsData.description.trim() || undefined,
        type: detailsData.type,
      });

      if (response) {
        setSuccess("Group details saved successfully!");
        setDetailsChanged(false);
        if (onGroupUpdate) onGroupUpdate();

        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err: unknown) {
      console.error("Error saving details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to save group details"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Save member role changes
   */
  const saveMemberChanges = async () => {
    if (!membersChanged || Object.keys(memberRoleChanges).length === 0) return;

    try {
      setIsSaving(true);
      setError("");

      // Apply all role changes
      const roleChangePromises = Object.entries(memberRoleChanges).map(
        ([memberId, newRole]) =>
          GroupsAPI.updateMemberRole(group.id, memberId, { role: newRole })
      );

      await Promise.all(roleChangePromises);

      // Update local members state
      const updatedMembers = members.map((member) => ({
        ...member,
        role: memberRoleChanges[member.id] || member.role,
      }));

      setMembers(updatedMembers);
      setMemberRoleChanges({});
      setMembersChanged(false);
      setSuccess("Member roles updated successfully!");

      if (onGroupUpdate) onGroupUpdate();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      console.error("Error saving member changes:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update member roles"
      );
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle member removal
   */
  const handleRemoveMember = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Remove ${memberName} from ${group.name}? This cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setError("");
      await GroupsAPI.removeMember(group.id, memberId);

      // Update local state
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      setSuccess(`${memberName} removed from group`);

      if (onGroupUpdate) onGroupUpdate();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      console.error("Error removing member:", err);
      setError(err instanceof Error ? err.message : "Failed to remove member");
    }
  };

  /**
   * Handle modal close
   */
  const saveCustomization = async (customization: {
    headerImage: { source: "preset" | "custom"; value: string };
    accentColor: { preset: string; hex: string };
  }): Promise<void> => {
    try {
      setIsSaving(true);
      setError("");

      await GroupsAPI.editGroup(group.id, {
        customization,
      });

      setCustomizationData(customization);
      setSuccess("Appearance updated successfully!");

      if (onGroupUpdate) onGroupUpdate();

      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      console.error("Error saving customization:", err);
      const errorMsg =
        err instanceof Error ? err.message : "Failed to save appearance";
      setError(errorMsg);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (isSaving) return;

    // Reset state
    setActiveTab("details");
    setDetailsData({
      name: group.name,
      description: group.description || "",
      type: group.type,
    });
    setDetailsChanged(false);
    setMembers(group.members);
    setMemberRoleChanges({});
    setMembersChanged(false);
    setSettingsData({
      allowMemberInvites:
        groupWithSettings.inviteSettings?.allowMemberInvites ?? false,
      requireApproval:
        groupWithSettings.inviteSettings?.requireApproval ?? false,
      maxMembers: groupWithSettings.inviteSettings?.maxMembers || "",
    });
    setSettingsChanged(false);
    setError("");
    setSuccess("");

    onClose();
  };

  if (!canEdit) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Edit Group: ${group.name}`}
      size="lg"
    >
      <div className="flex flex-col h-full">
        {/* Tab Navigation - Desktop */}
        <div className="hidden md:flex border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-10">
          <button
            onClick={() => {
              setActiveTab("details");
              setMobileMenuOpen(false);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "details"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" />
            Details
          </button>
          <button
            onClick={() => {
              setActiveTab("members");
              setMobileMenuOpen(false);
            }}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === "members"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="h-4 w-4" />
            Members
          </button>
          {isOwner && (
            <button
              onClick={() => {
                setActiveTab("settings");
                setMobileMenuOpen(false);
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "settings"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
          )}
          {isOwner && (
            <button
              onClick={() => {
                setActiveTab("appearance");
                setMobileMenuOpen(false);
              }}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === "appearance"
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Palette className="h-4 w-4" />
              Appearance
            </button>
          )}
        </div>

        {/* Tab Navigation - Mobile with Burger Menu */}
        <div className="md:hidden border-b border-[var(--border)] bg-[var(--background)] sticky top-0 z-5">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-foreground">
              {activeTab === "details" && "Details"}
              {activeTab === "members" && "Members"}
              {activeTab === "settings" && "Settings"}
              {activeTab === "appearance" && "Appearance"}
            </span>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-[var(--muted)] rounded-md transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </button>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="border-t border-[var(--border)] bg-[var(--card)]">
              <button
                onClick={() => {
                  setActiveTab("details");
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "details"
                    ? "bg-[var(--primary)]/10 text-primary"
                    : "text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--muted)]/50"
                }`}
              >
                <FileText className="h-4 w-4" />
                Details
              </button>
              <button
                onClick={() => {
                  setActiveTab("members");
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeTab === "members"
                    ? "bg-[var(--primary)]/10 text-primary"
                    : "text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--muted)]/50"
                }`}
              >
                <Users className="h-4 w-4" />
                Members
              </button>
              {isOwner && (
                <button
                  onClick={() => {
                    setActiveTab("settings");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === "settings"
                      ? "bg-[var(--primary)]/10 text-primary"
                      : "text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--muted)]/50"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>
              )}
              {isOwner && (
                <button
                  onClick={() => {
                    setActiveTab("appearance");
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeTab === "appearance"
                      ? "bg-[var(--primary)]/10 text-primary"
                      : "text-[var(--muted-foreground)] hover:text-foreground hover:bg-[var(--muted)]/50"
                  }`}
                >
                  <Palette className="h-4 w-4" />
                  Appearance
                </button>
              )}
            </div>
          )}
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <span className="text-sm text-red-700 dark:text-red-300">
              {error}
            </span>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
            <span className="text-sm text-green-700 dark:text-green-300">
              {success}
            </span>
          </div>
        )}

        {/* Tab Content - Fixed Height to Prevent Modal Shifting */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === "details" && (
            <DetailsTab
              data={detailsData}
              onChange={handleDetailsChange}
              hasChanges={detailsChanged}
              onSave={saveDetails}
              isSaving={isSaving}
            />
          )}

          {activeTab === "members" && (
            <MembersTab
              members={members}
              currentUserId={currentUserId}
              userRole={userRole}
              roleChanges={memberRoleChanges}
              onRoleChange={handleMemberRoleChange}
              onRemoveMember={handleRemoveMember}
              hasChanges={membersChanged}
              onSave={saveMemberChanges}
              isSaving={isSaving}
            />
          )}

          {activeTab === "settings" && isOwner && (
            <SettingsTab
              data={settingsData}
              onChange={(field: string, value: string | number | boolean) => {
                setSettingsData((prev) => ({
                  ...prev,
                  [field]: value,
                }));
                setSettingsChanged(true);
                setError("");
              }}
              hasChanges={settingsChanged}
              onSave={async () => {
                // TODO: Implement settings save
              }}
              isSaving={isSaving}
              currentMemberCount={members.length}
            />
          )}

          {activeTab === "appearance" && isOwner && (
            <AppearanceTab
              groupName={group.name}
              groupType={group.type}
              customization={customizationData}
              onSave={saveCustomization}
              isSaving={isSaving}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}
