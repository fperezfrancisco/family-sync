"use client";

import React from "react";
import { Menu } from "lucide-react";

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

/**
 * Mobile Header Component
 * Visible only on screens smaller than 900px (lg breakpoint)
 * Contains burger menu button and FamilySync title
 */
export default function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  return (
    <header className="lg:hidden bg-card border-b border-border px-4 py-3 flex items-center justify-between">
      {/* Burger menu button */}
      <button
        onClick={onMenuToggle}
        className="p-2 rounded-md text-muted-foreground hover:text-foreground 
                 hover:bg-accent transition-colors duration-150"
        aria-label="Toggle navigation menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* App title */}
      <h1 className="text-lg font-bold text-foreground font-inter">
        FamilySync
      </h1>

      {/* Right spacer to center the title */}
      <div className="w-10" />
    </header>
  );
}
