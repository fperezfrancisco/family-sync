"use client";

import React from "react";
import { AlertCircle, X } from "lucide-react";

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Reusable error alert component for auth pages
 * Displays error messages with consistent styling across signup and login
 */
export function ErrorAlert({
  message,
  onDismiss,
  className = "",
}: ErrorAlertProps) {
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg bg-red-50 border border-red-200 ${className}`}
      role="alert"
    >
      <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-red-900">{message}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-red-600 hover:text-red-700 shrink-0 p-1"
          aria-label="Dismiss error"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
