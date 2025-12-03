"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard Layout Component
 * Manages responsive layout with sidebar and mobile header
 *
 * Behavior:
 * - Desktop (>=900px): Sidebar always visible, no mobile header
 * - Mobile (<900px): Sidebar hidden by default, mobile header visible
 * - Sidebar slides in from left when toggled on mobile
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  /**
   * Handle window resize to determine mobile/desktop view
   */
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900; // 900px breakpoint

      // Close sidebar when switching to desktop view
      if (!mobile) {
        setIsSidebarOpen(false);
      }
    };

    // Set initial state
    handleResize();

    // Add event listener
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /**
   * Toggle sidebar visibility (mobile only)
   */
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  /**
   * Close sidebar (mobile only)
   */
  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen w-full bg-background ">
      {/* Mobile Header - only visible on mobile */}
      <MobileHeader onMenuToggle={toggleSidebar} />

      <div className="flex h-full w-full ">
        {/* Sidebar - responsive behavior handled within component */}
        <Sidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

        {/* Main content area */}
        <main className="flex-1 bg-[var(--secondary)]/25 dark:bg-[var(--background)] lg:ml-64 h-full w-full min-h-screen">
          {/* Content container with padding */}
          <div className="p-6 lg:p-8 min-h-full w-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
