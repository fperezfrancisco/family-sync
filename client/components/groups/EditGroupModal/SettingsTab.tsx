"use client";

import React from "react";
import { Info, AlertCircle } from "lucide-react";

interface SettingsTabProps {
  data: {
    allowMemberInvites: boolean;
    requireApproval: boolean;
    maxMembers: string | number;
  };
  onChange: (field: string, value: string | number | boolean) => void;
  hasChanges: boolean;
  onSave: () => Promise<void>;
  isSaving: boolean;
  currentMemberCount: number;
}

/**
 * SettingsTab Component
 * Configure group invitation and membership settings
 */
export default function SettingsTab({
  data,
  onChange,
  hasChanges,
  onSave,
  isSaving,
  currentMemberCount,
}: SettingsTabProps) {
  const maxMembersValue =
    data.maxMembers === "" ? "" : parseInt(data.maxMembers.toString());
  const isMaxMembersValid =
    maxMembersValue === "" || maxMembersValue >= currentMemberCount;

  const handleSave = async () => {
    await onSave();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Invite Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Invitation Settings
        </h3>

        {/* Allow Member Invites Toggle */}
        <div className="flex items-center justify-between p-4 bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              Allow Members to Invite Others
            </label>
            <p className="text-xs text-[var(--muted-foreground)]">
              Non-admin members can send invitations to join the group
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
            <input
              type="checkbox"
              checked={data.allowMemberInvites}
              onChange={(e) => onChange("allowMemberInvites", e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--border)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
          </label>
        </div>

        {/* Require Approval Toggle */}
        <div className="flex items-center justify-between p-4 bg-[var(--muted)]/30 border border-[var(--border)] rounded-lg">
          <div className="flex-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              Require Owner Approval for New Members
            </label>
            <p className="text-xs text-[var(--muted-foreground)]">
              Owner must approve new member invitations before they join
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
            <input
              type="checkbox"
              checked={data.requireApproval}
              onChange={(e) => onChange("requireApproval", e.target.checked)}
              disabled={isSaving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-[var(--border)] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-[var(--border)] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
          </label>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-[var(--border)]"></div>

      {/* Membership Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          Membership Limits
        </h3>

        {/* Current Member Count */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-medium">Current members:</span>{" "}
            {currentMemberCount}
          </p>
        </div>

        {/* Max Members Input */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">
            Maximum Members (Optional)
          </label>
          <p className="text-xs text-[var(--muted-foreground)] mb-2">
            Leave blank for unlimited members. Must be at least{" "}
            <span className="font-medium">{currentMemberCount}</span>
          </p>
          <input
            type="number"
            value={data.maxMembers}
            onChange={(e) => onChange("maxMembers", e.target.value)}
            min={currentMemberCount}
            placeholder="No limit"
            disabled={isSaving}
            className="w-full px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-md text-foreground placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          {!isMaxMembersValid && (
            <p className="text-xs text-red-600 dark:text-red-400">
              Maximum members cannot be less than current member count (
              {currentMemberCount})
            </p>
          )}
        </div>
      </div>

      {/* Unsaved Changes Indicator */}
      {hasChanges && (
        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            You have unsaved changes
          </p>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving || !isMaxMembersValid}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)/90] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
