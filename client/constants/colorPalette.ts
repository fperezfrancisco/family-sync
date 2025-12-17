/**
 * Accent color palette for group customization
 * Phase 1: Predefined colors that match the app theme
 * All colors are carefully selected for accessibility and professional appearance
 */

export interface AccentColor {
  id: string;
  name: string;
  hex: string;
  rgb: string;
}

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: "blue",
    name: "Blue",
    hex: "#3b82f6",
    rgb: "59, 130, 246",
  },
  {
    id: "purple",
    name: "Purple",
    hex: "#8b5cf6",
    rgb: "139, 92, 246",
  },
  {
    id: "pink",
    name: "Pink",
    hex: "#ec4899",
    rgb: "236, 72, 153",
  },
  {
    id: "green",
    name: "Green",
    hex: "#10b981",
    rgb: "16, 185, 129",
  },
  {
    id: "orange",
    name: "Orange",
    hex: "#f97316",
    rgb: "249, 115, 22",
  },
  {
    id: "red",
    name: "Red",
    hex: "#ef4444",
    rgb: "239, 68, 68",
  },
  {
    id: "cyan",
    name: "Cyan",
    hex: "#06b6d4",
    rgb: "6, 182, 212",
  },
  {
    id: "amber",
    name: "Amber",
    hex: "#f59e0b",
    rgb: "245, 158, 11",
  },
  {
    id: "teal",
    name: "Teal",
    hex: "#14b8a6",
    rgb: "20, 184, 166",
  },
  {
    id: "indigo",
    name: "Indigo",
    hex: "#6366f1",
    rgb: "99, 102, 241",
  },
];

/**
 * Get color by ID
 */
export const getColorById = (id: string): AccentColor | undefined => {
  return ACCENT_COLORS.find((color) => color.id === id);
};

/**
 * Get color by hex value
 */
export const getColorByHex = (hex: string): AccentColor | undefined => {
  return ACCENT_COLORS.find(
    (color) => color.hex.toLowerCase() === hex.toLowerCase()
  );
};

/**
 * Default customization values
 */
export const DEFAULT_CUSTOMIZATION = {
  headerImage: {
    source: "preset" as const,
    value: "mountain-sunrise",
  },
  accentColor: {
    preset: "blue",
    hex: "#3b82f6",
  },
};
