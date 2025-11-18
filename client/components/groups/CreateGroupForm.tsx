"use client";

import React, { useState } from "react";
import { Users, FileText, Tag } from "lucide-react";

export interface CreateGroupFormData {
  name: string;
  description: string;
  type: "family" | "friends" | "work" | "other";
}

interface FormErrors {
  name?: string;
  description?: string;
  type?: string;
}

interface TouchedFields {
  name?: boolean;
  description?: boolean;
  type?: boolean;
}

interface CreateGroupFormProps {
  onSubmit: (data: CreateGroupFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

/**
 * Create Group Form Component
 * Secure form for creating new groups with validation
 */
export default function CreateGroupForm({
  onSubmit,
  onCancel,
  isLoading = false,
}: CreateGroupFormProps) {
  const [formData, setFormData] = useState<CreateGroupFormData>({
    name: "",
    description: "",
    type: "family",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({});

  // Group type options
  const groupTypes = [
    {
      value: "family",
      label: "Family",
      icon: Users,
      description: "Family members and relatives",
    },
    {
      value: "friends",
      label: "Friends",
      icon: Users,
      description: "Close friends and social circles",
    },
    {
      value: "work",
      label: "Work",
      icon: FileText,
      description: "Work colleagues and teams",
    },
    {
      value: "other",
      label: "Other",
      icon: Tag,
      description: "Other types of groups",
    },
  ] as const;

  // Validation rules
  const validateField = (field: keyof CreateGroupFormData, value: string) => {
    switch (field) {
      case "name":
        if (!value.trim()) {
          return "Group name is required";
        }
        if (value.trim().length < 2) {
          return "Group name must be at least 2 characters";
        }
        if (value.trim().length > 100) {
          return "Group name must be less than 100 characters";
        }
        return "";

      case "description":
        if (value.length > 500) {
          return "Description must be less than 500 characters";
        }
        return "";

      case "type":
        if (
          !["family", "friends", "work", "other"].includes(
            value as "family" | "friends" | "work" | "other"
          )
        ) {
          return "Invalid group type";
        }
        return "";

      default:
        return "";
    }
  };

  // Handle input changes
  const handleInputChange = (
    field: keyof CreateGroupFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Handle blur events
  const handleBlur = (field: keyof CreateGroupFormData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field]);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  // Validate entire form
  const validateForm = () => {
    const newErrors: FormErrors = {};

    Object.keys(formData).forEach((key) => {
      const field = key as keyof CreateGroupFormData;
      const error = validateField(field, formData[field]);
      if (error) {
        newErrors[field] = error;
      }
    });

    setErrors(newErrors);
    setTouched({
      name: true,
      description: true,
      type: true,
    });

    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Submit the form with sanitized data
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim(),
      type: formData.type,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6" noValidate>
      {/* Group Name */}
      <div className="space-y-2">
        <label
          htmlFor="group-name"
          className="block text-sm font-medium text-foreground font-inter"
        >
          Group Name *
        </label>
        <input
          id="group-name"
          type="text"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          onBlur={() => handleBlur("name")}
          className={`
            w-full px-3 py-2 
            bg-background 
            border rounded-md 
            text-foreground 
            placeholder-muted-foreground 
            font-inter
            transition-colors
            focus:outline-none 
            focus:ring-2 
            focus:ring-blue-500 
            focus:border-transparent
            ${
              errors.name && touched.name
                ? "border-red-500 focus:ring-red-500"
                : "border-border hover:border-border/80"
            }
          `}
          placeholder="Enter group name"
          maxLength={100}
          disabled={isLoading}
          autoComplete="off"
        />
        {errors.name && touched.name && (
          <p className="text-sm text-red-500 font-inter">{errors.name}</p>
        )}
      </div>

      {/* Group Type */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-foreground font-inter">
          Group Type *
        </label>
        <div className="grid grid-cols-2 gap-3">
          {groupTypes.map((type) => {
            const Icon = type.icon;
            return (
              <label
                key={type.value}
                className={`
                  relative flex items-start p-3 
                  border rounded-lg 
                  cursor-pointer 
                  transition-all
                  hover:border-blue-300
                  ${
                    formData.type === type.value
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                      : "border-border bg-background hover:bg-muted/30"
                  }
                  ${isLoading ? "cursor-not-allowed opacity-60" : ""}
                `}
              >
                <input
                  type="radio"
                  name="groupType"
                  value={type.value}
                  checked={formData.type === type.value}
                  onChange={(e) => handleInputChange("type", e.target.value)}
                  className="sr-only"
                  disabled={isLoading}
                />
                <Icon className="h-5 w-5 text-muted-foreground mt-0.5 mr-3 shrink-0" />
                <div>
                  <div className="text-sm font-medium text-foreground font-inter">
                    {type.label}
                  </div>
                  <div className="text-xs text-muted-foreground font-inter">
                    {type.description}
                  </div>
                </div>
                {formData.type === type.value && (
                  <div className="absolute top-2 right-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </label>
            );
          })}
        </div>
        {errors.type && touched.type && (
          <p className="text-sm text-red-500 font-inter">{errors.type}</p>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label
          htmlFor="group-description"
          className="block text-sm font-medium text-foreground font-inter"
        >
          Description
          <span className="text-xs text-muted-foreground ml-1">(Optional)</span>
        </label>
        <textarea
          id="group-description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          onBlur={() => handleBlur("description")}
          className={`
            w-full px-3 py-2 
            bg-background 
            border rounded-md 
            text-foreground 
            placeholder-muted-foreground 
            font-inter
            transition-colors
            resize-none
            focus:outline-none 
            focus:ring-2 
            focus:ring-blue-500 
            focus:border-transparent
            ${
              errors.description && touched.description
                ? "border-red-500 focus:ring-red-500"
                : "border-border hover:border-border/80"
            }
          `}
          placeholder="Describe your group (optional)"
          rows={3}
          maxLength={500}
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            {errors.description && touched.description && (
              <span className="text-red-500">{errors.description}</span>
            )}
          </span>
          <span>{formData.description.length}/500</span>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="
            px-4 py-2 
            text-sm font-medium 
            text-muted-foreground 
            hover:text-foreground 
            border border-border 
            rounded-md 
            hover:bg-muted 
            transition-colors 
            font-inter
            disabled:opacity-60 
            disabled:cursor-not-allowed
          "
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !formData.name.trim()}
          className="
            px-4 py-2 
            text-sm font-medium 
            text-white 
            bg-blue-600 
            hover:bg-blue-500 
            border border-transparent 
            rounded-md 
            transition-colors 
            font-inter
            disabled:opacity-60 
            disabled:cursor-not-allowed
            focus:outline-none 
            focus:ring-2 
            focus:ring-blue-500 
            focus:ring-offset-2
          "
        >
          {isLoading ? "Creating..." : "Create Group"}
        </button>
      </div>
    </form>
  );
}
