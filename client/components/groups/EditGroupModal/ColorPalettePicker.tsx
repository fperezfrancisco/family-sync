"use client";

import React from "react";
import { ACCENT_COLORS } from "@/constants/colorPalette";
import { Check } from "lucide-react";

interface ColorPalettePickerProps {
  selectedColorId: string;
  selectedHex: string;
  onSelect: (colorId: string, hex: string) => void;
}

export const ColorPalettePicker: React.FC<ColorPalettePickerProps> = ({
  selectedColorId,
  selectedHex,
  onSelect,
}) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-3">
        {ACCENT_COLORS.map((color) => {
          const isSelected = selectedColorId === color.id;

          return (
            <button
              key={color.id}
              onClick={() => onSelect(color.id, color.hex)}
              className={`group relative transition-all duration-200 ${
                isSelected ? "scale-110" : "hover:scale-105"
              }`}
              title={color.name}
            >
              {/* Color swatch */}
              <div
                className={`w-full aspect-square rounded-lg transition-all ${
                  isSelected
                    ? "ring-2 ring-offset-2 ring-slate-400 dark:ring-offset-slate-800"
                    : "ring-1 ring-slate-200 dark:ring-slate-700"
                }`}
                style={{ backgroundColor: color.hex }}
              />

              {/* Checkmark for selected */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="w-5 h-5 text-white drop-shadow-lg" />
                </div>
              )}

              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-slate-700 text-white text-xs py-1 px-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {color.name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Display selected color info */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div
          className="w-12 h-12 rounded-lg ring-1 ring-slate-200 dark:ring-slate-600"
          style={{ backgroundColor: selectedHex }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {ACCENT_COLORS.find((c) => c.id === selectedColorId)?.name ||
              "Unknown"}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {selectedHex}
          </p>
        </div>
      </div>
    </div>
  );
};
