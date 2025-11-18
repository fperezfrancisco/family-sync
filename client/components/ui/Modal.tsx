"use client";

import React, { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  showCloseButton?: boolean;
}

/**
 * Reusable Modal Component
 * Provides consistent modal behavior and styling across the app
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle escape key press
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent background scrolling
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Handle click outside modal
  const handleBackdropClick = (event: React.MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className={`
          w-full ${sizeClasses[size]} 
          bg-[var(--background)]
          border border-border 
          rounded-lg 
          shadow-xl 
          transform transition-all 
          max-h-[90vh] 
          overflow-hidden
          animate-in fade-in-0 zoom-in-95 duration-200
        `}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2
            id="modal-title"
            className="text-xl font-semibold text-foreground font-inter"
          >
            {title}
          </h2>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="
                p-2 
                rounded-md 
                hover:bg-muted 
                transition-colors 
                text-muted-foreground 
                hover:text-foreground
              "
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="max-h-[calc(90vh-6rem)] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
