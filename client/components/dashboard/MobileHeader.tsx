"use client";

import React from "react";
import { Menu } from "lucide-react";
import Image from "next/image";

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
    <header className="lg:hidden bg-[var(--card)] border-b border-[var(--border)] px-4 py-3 flex items-center w-full fixed top-0 z-20 opacity-85">
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
      <div className="w-full grow flex justify-center dark:hidden">
        <Image
          src="/logos/bt-light.png"
          alt="Better Together Logo"
          className="w-[120px] h-auto block dark:hidden"
          width={300}
          height={135}
        />
      </div>
      <div className="w-full grow justify-center hidden dark:flex">
        <Image
          src="/logos/bt-dark.png"
          alt="Better Together Logo"
          className="w-[120px] h-auto hidden dark:block"
          width={500}
          height={135}
        />
      </div>

      {/* Right spacer to center the title */}
      <div className="w-8" />
    </header>
  );
}
