"use client";

import React from "react";
import { GROUP_IMAGE_PRESETS } from "@/constants/groupImagePresets";
import { Check } from "lucide-react";

interface HeaderImageSelectorProps {
  selectedImageId: string;
  onSelect: (imageId: string) => void;
}

export const HeaderImageSelector: React.FC<HeaderImageSelectorProps> = ({
  selectedImageId,
  onSelect,
}) => {
  // Group presets by category
  const categories = {
    nature: GROUP_IMAGE_PRESETS.filter((p) => p.category === "nature"),
    abstract: GROUP_IMAGE_PRESETS.filter((p) => p.category === "abstract"),
    activity: GROUP_IMAGE_PRESETS.filter((p) => p.category === "activity"),
    social: GROUP_IMAGE_PRESETS.filter((p) => p.category === "social"),
  };

  const renderCategory = (
    categoryName: string,
    categoryLabel: string,
    presets: typeof GROUP_IMAGE_PRESETS
  ) => (
    <div key={categoryName} className="space-y-3">
      <h4 className="text-sm font-semibold text-foreground">{categoryLabel}</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {presets.map((preset) => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.id)}
            className={`relative group overflow-hidden rounded-lg transition-all duration-200 ${
              selectedImageId === preset.id
                ? "ring-2 ring-blue-500 scale-105"
                : "hover:scale-105 opacity-75 hover:opacity-100"
            }`}
            title={preset.name}
          >
            {/* Image */}
            <div
              className="w-full aspect-video bg-linear-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800"
              style={{
                backgroundImage: `url('${preset.src}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

            {/* Selected checkmark */}
            {selectedImageId === preset.id && (
              <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                <div className="bg-blue-500 rounded-full p-1">
                  <Check className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            {/* Label tooltip */}
            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-2 py-2 translate-y-full group-hover:translate-y-0 transition-transform">
              <p className="text-xs text-white font-medium truncate">
                {preset.name}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {renderCategory("nature", "🏞️ Nature", categories.nature)}
      {renderCategory("abstract", "✨ Abstract", categories.abstract)}
      {renderCategory("activity", "🎯 Activity", categories.activity)}
      {renderCategory("social", "🎉 Social", categories.social)}
    </div>
  );
};
