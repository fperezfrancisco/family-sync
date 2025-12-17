"use client";

import React, { useState } from "react";
import { HeaderImageSelector } from "./HeaderImageSelector";
import { ColorPalettePicker } from "./ColorPalettePicker";
import { getPresetById } from "@/constants/groupImagePresets";
import { AlertCircle, Loader2 } from "lucide-react";

interface AppearanceTabProps {
  groupName: string;
  groupType: string;
  customization?: {
    headerImage?: {
      source: "preset" | "custom";
      value: string;
    };
    accentColor?: {
      preset: string;
      hex: string;
    };
  };
  onSave: (customization: {
    headerImage: { source: "preset" | "custom"; value: string };
    accentColor: { preset: string; hex: string };
  }) => Promise<void>;
  isSaving?: boolean;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = ({
  groupName,
  groupType,
  customization,
  onSave,
  isSaving = false,
}) => {
  // Initialize state from customization prop
  const [selectedImageId, setSelectedImageId] = useState(
    customization?.headerImage?.value || "mountain-sunrise"
  );
  const [selectedColorId, setSelectedColorId] = useState(
    customization?.accentColor?.preset || "blue"
  );
  const [selectedColorHex, setSelectedColorHex] = useState(
    customization?.accentColor?.hex || "#3b82f6"
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track changes
  const handleImageSelect = (imageId: string) => {
    setSelectedImageId(imageId);
    setHasChanges(true);
    setError(null);
  };

  const handleColorSelect = (colorId: string, hex: string) => {
    setSelectedColorId(colorId);
    setSelectedColorHex(hex);
    setHasChanges(true);
    setError(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      await onSave({
        headerImage: {
          source: "preset",
          value: selectedImageId,
        },
        accentColor: {
          preset: selectedColorId,
          hex: selectedColorHex,
        },
      });
      setHasChanges(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save appearance"
      );
    }
  };

  // Get preview image URL
  const presetData = getPresetById(selectedImageId);
  const previewImageUrl = presetData?.src || "/wallpapers/default-cabin.jpg";

  return (
    <div className="space-y-6 p-4">
      {/* Live Preview */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Preview</h3>
        <div className="relative overflow-hidden rounded-lg aspect-video bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 ring-1 ring-slate-200 dark:ring-slate-700">
          {/* Preview image */}
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url('${previewImageUrl}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />

          {/* Overlay with group info */}
          <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-4">
            <div className="space-y-1">
              {/* Group name */}
              <h4 className="text-lg font-bold text-white">{groupName}</h4>

              {/* Type badge with preview color */}
              <div
                className="w-fit px-3 py-1 rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: selectedColorHex }}
              >
                {groupType.charAt(0).toUpperCase() + groupType.slice(1)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Image Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Header Image</h3>
        <div className="h-full pr-2">
          <HeaderImageSelector
            selectedImageId={selectedImageId}
            onSelect={handleImageSelect}
          />
        </div>
      </div>

      {/* Accent Color Selection */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Accent Color</h3>
        <ColorPalettePicker
          selectedColorId={selectedColorId}
          selectedHex={selectedColorHex}
          onSelect={handleColorSelect}
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Unsaved changes indicator and save button */}
      {hasChanges && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Unsaved changes
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      )}

      {!hasChanges && (
        <p className="text-xs text-muted-foreground text-center py-2">
          All changes saved
        </p>
      )}
    </div>
  );
};
