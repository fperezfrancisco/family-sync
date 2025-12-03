"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Calendar,
  MessageCircle,
  CheckSquare,
  ChevronDown,
  User,
  Image as ImageIcon,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import ProfileModal from "@/components/profile/ProfileModal";
import { useTotalUnreadMessages } from "@/hooks/useTotalUnreadMessages";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Responsive Sidebar Component
 * Shows navigation menu and user profile section
 * Responsive: slides in from left on mobile (<900px), always visible on desktop
 */
export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const totalUnreadMessages = useTotalUnreadMessages();

  // Navigation items with icons and routes (private routes)
  const navigationItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Groups",
      href: "/dashboard/groups",
      icon: Users,
    },
    {
      name: "Events",
      href: "/dashboard/events",
      icon: Calendar,
    },
    {
      name: "Chat",
      href: "/dashboard/chat",
      icon: MessageCircle,
    },
    {
      name: "Media",
      href: "/dashboard/media",
      icon: ImageIcon,
    },
    {
      name: "Tasks",
      href: "/dashboard/tasks",
      icon: CheckSquare,
    },
  ];

  /**
   * Get user initials for avatar display
   */
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Handle user menu item clicks
   */
  const handleUserMenuClick = (action: string) => {
    setShowUserMenu(false);

    switch (action) {
      case "profile":
        setShowProfileModal(true);
        break;
      case "settings":
        // TODO: Navigate to settings page
        console.log("Navigate to settings");
        break;
      case "logout":
        logout();
        break;
    }
  };

  return (
    <>
      {/* Mobile overlay - only visible when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <div
        className={`
        fixed top-0 left-0 h-screen w-64 bg-[var(--secondary)] dark:bg-[var(--background)] border-r border-[var(--border)] z-50
        transform transition-transform duration-300 ease-in-out flex flex-col
        lg:translate-x-0
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Sidebar header - visible on desktop always, mobile when open */}
        <div className="p-4 border-b border-[var(--border)]">
          <div className="w-full">
            <Image
              src="/logos/bt-light.png"
              alt="Better Together Logo"
              className="w-[120px] h-auto block dark:hidden"
              width={300}
              height={135}
            />
          </div>
          <div className="w-full">
            <Image
              src="/logos/bt-dark.png"
              alt="Better Together Logo"
              className="w-[120px] h-auto hidden dark:block"
              width={500}
              height={135}
            />
          </div>
        </div>

        {/* Navigation section */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isChatItem = item.name === "Chat";
            const showUnreadBadge = isChatItem && totalUnreadMessages > 0;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose} // Close sidebar on mobile when item is clicked
                className={`
                  flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium
                  transition-colors duration-150 ease-in-out font-inter
                  ${
                    isActive
                      ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                      : "text-muted-foreground hover:bg-[var(--primary)]/75 hover:text-[var(--primary-foreground)]"
                  }
                `}
              >
                <div className="flex items-center">
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </div>

                {/* Unread messages badge - only show for Chat item */}
                {showUnreadBadge && (
                  <div className="flex items-center justify-center bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1 font-semibold">
                    {totalUnreadMessages > 99 ? "99+" : totalUnreadMessages}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User profile section at bottom */}
        <div className="px-2 py-4 mt-auto">
          <div className="relative border border-[var(--border)] rounded-md py-2">
            {/* User profile button */}
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center px-3 py-2 rounded-md text-sm font-medium
                       text-foreground hover:bg-accent transition-colors duration-150 font-inter"
            >
              {/* User avatar with initials */}
              <div className="shrink-0 mr-3">
                <div className="size-9 bg-[var(--primary)] rounded-full flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary-foreground">
                    {getUserInitials()}
                  </span>
                </div>
              </div>

              {/* User info */}
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground truncate">
                  {user?.name || "User"}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || "user@example.com"}
                </p>
              </div>

              {/* Dropdown arrow */}
              <ChevronDown
                className={`ml-2 h-4 w-4 transition-transform duration-150 ${
                  showUserMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* User dropdown menu */}
            {showUserMenu && (
              <div
                className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--card)] text-[var(--card-foreground)] border border-[var(--border)] 
                            rounded-md shadow-lg dark:shadow-xl dark:shadow-black py-1 z-10"
              >
                {/* Profile option */}
                <button
                  onClick={() => handleUserMenuClick("profile")}
                  className="w-full flex items-center px-3 py-2 text-sm
                           hover:bg-accent transition-colors duration-150 font-inter"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </button>

                {/* Settings option */}
                <button
                  onClick={() => handleUserMenuClick("settings")}
                  className="w-full flex items-center px-3 py-2 text-sm 
                           hover:bg-accent transition-colors duration-150 font-inter"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </button>

                {/* Logout option */}
                <button
                  onClick={() => handleUserMenuClick("logout")}
                  className="w-full flex items-center px-3 py-2 text-sm text-red-500 
                           hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors duration-150 font-inter"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
}
