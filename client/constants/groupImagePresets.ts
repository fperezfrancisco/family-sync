/**
 * Group header image presets
 * Used for customizing group appearance in Phase 1
 * Includes nature, abstract, and activity categories
 */

export interface HeaderImagePreset {
  id: string;
  name: string;
  src: string;
  category: "nature" | "abstract" | "activity" | "social";
}

export const GROUP_IMAGE_PRESETS: HeaderImagePreset[] = [
  // Nature category
  {
    id: "mountain-sunrise",
    name: "Mountain Sunrise",
    src: "/group-images/mountain-sunrise.jpg",
    category: "nature",
  },
  {
    id: "beach-waves",
    name: "Beach Waves",
    src: "/group-images/beach-waves.jpg",
    category: "nature",
  },
  {
    id: "forest-green",
    name: "Forest Green",
    src: "/group-images/forest-green.jpg",
    category: "nature",
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    src: "/group-images/sunset-orange.jpg",
    category: "nature",
  },

  // Abstract category
  {
    id: "abstract-purple",
    name: "Abstract Purple",
    src: "/group-images/abstract-purple.jpg",
    category: "abstract",
  },
  {
    id: "geometric-pattern",
    name: "Geometric Pattern",
    src: "/group-images/geometric-pattern.jpg",
    category: "abstract",
  },
  {
    id: "minimal-gradient",
    name: "Minimal Gradient",
    src: "/group-images/minimal-gradient.jpg",
    category: "abstract",
  },

  // Activity category
  {
    id: "sports-action",
    name: "Sports Action",
    src: "/group-images/sports-action.jpg",
    category: "activity",
  },
  {
    id: "travel-compass",
    name: "Travel Compass",
    src: "/group-images/travel-compass.jpg",
    category: "activity",
  },
  {
    id: "cooking-utensils",
    name: "Cooking Utensils",
    src: "/group-images/cooking-utensils.jpg",
    category: "activity",
  },

  // Social category
  {
    id: "group-hangout",
    name: "Group Hangout",
    src: "/group-images/group-hangout.jpg",
    category: "social",
  },
  {
    id: "party-time",
    name: "Party Time",
    src: "/group-images/party-time.jpg",
    category: "social",
  },
  {
    id: "dinner-time",
    name: "Dinner Time",
    src: "/group-images/dinner-time.jpg",
    category: "social",
  },
];

/**
 * Get presets by category
 */
export const getPresetsByCategory = (
  category: "nature" | "abstract" | "activity" | "social"
): HeaderImagePreset[] => {
  return GROUP_IMAGE_PRESETS.filter((preset) => preset.category === category);
};

/**
 * Get preset by ID
 */
export const getPresetById = (id: string): HeaderImagePreset | undefined => {
  return GROUP_IMAGE_PRESETS.find((preset) => preset.id === id);
};
