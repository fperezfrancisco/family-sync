"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { Group } from "@/types/groups";

interface DetailsTabProps {
  data: {
    name: string;
    description: string;
    type: Group["type"];
  };
  onChange: (field: string, value: string | Group["type"]) => void;
  hasChanges: boolean;
  onSave: () => Promise<void>;
  isSaving: boolean;
}

/**
 * DetailsTab Component
 * Edit group name, description, and type
 */
export default function DetailsTab({
  data,
  onChange,
  hasChanges,
  onSave,
  isSaving,
}: DetailsTabProps) {
  const handleSave = async () => {
    await onSave();
  };

  return (
    <div className="p-6 space-y-6">
      {/* Group Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2 font-inter">
          Group Name *
        </label>
        <div className="relative">
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange("name", e.target.value)}
            placeholder="Enter group name"
            maxLength={200}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-md text-foreground placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          <span className="absolute right-3 top-2.5 text-xs text-[var(--muted-foreground)]">
            {data.name.length}/200
          </span>
        </div>
      </div>

      {/* Group Type */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2 font-inter">
          Group Type
        </label>
        <select
          value={data.type}
          onChange={(e) => onChange("type", e.target.value as Group["type"])}
          disabled={isSaving}
          className="w-full px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <option value="family">Family</option>
          <option value="friends">Friends</option>
          <option value="work">Work</option>
          <option value="other">Other</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2 font-inter">
          Description
        </label>
        <div className="relative">
          <textarea
            value={data.description}
            onChange={(e) => onChange("description", e.target.value)}
            placeholder="Enter group description (optional)"
            maxLength={2000}
            rows={4}
            disabled={isSaving}
            className="w-full px-4 py-2 bg-[var(--card)] border border-[var(--border)] rounded-md text-foreground placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors resize-none"
          />
          <span className="absolute right-3 bottom-2.5 text-xs text-[var(--muted-foreground)]">
            {data.description.length}/2000
          </span>
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
          disabled={!hasChanges || isSaving}
          className="px-4 py-2 bg-[var(--primary)] text-[var(--primary-foreground)] rounded-md hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
