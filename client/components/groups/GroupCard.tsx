"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  Calendar,
  MessageCircle,
  Settings,
  MoreHorizontal,
  Crown,
  Shield,
  User,
} from "lucide-react";
import { Group } from "@/types/groups";
import { User as MemberUser } from "@/types/auth";
import { useQuery } from "@tanstack/react-query";
import { EventsAPI } from "@/lib/api";
import Image from "next/image";

interface GroupCardProps {
  group: Group;
  onViewDetails?: (groupId: string) => void;
  onManageGroup?: (groupId: string) => void;
  onViewMessages?: (groupId: string) => void;
  currentUserId?: string;
}

/**
 * GroupCard Component
 * Displays group information in a responsive card layout
 */
export default function GroupCard({
  group,
  onViewDetails,
  onManageGroup,
  onViewMessages,
  currentUserId,
}: GroupCardProps) {
  const router = useRouter();

  const [groupEvents, setGroupEvents] = useState([]);

  const fetchGroupEvents = async (groupId: string) => {
    const response = await EventsAPI.getByGroup(groupId);
    console.log("Response of events: ", response);
    return response.events;
  };

  // Get user's role in the group
  const getUserRole = () => {
    if (group.owner === currentUserId) return "owner";
    const memberEntry = group.members.find(
      (m) => m.id && m.id === currentUserId
    );
    return memberEntry?.role || "guest";
  };

  const userRole = getUserRole();
  const canManage = userRole === "owner" || userRole === "admin";

  // Get group type styling
  const getGroupTypeStyle = (type: string) => {
    switch (type) {
      case "family":
        return {
          bg: "bg-pink-50 dark:bg-pink-950/30",
          border: "border-pink-200 dark:border-pink-800",
          text: "text-pink-700 dark:text-pink-300",
          icon: "text-pink-500",
        };
      case "friends":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-200 dark:border-blue-800",
          text: "text-blue-700 dark:text-blue-300",
          icon: "text-blue-500",
        };
      case "work":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/30",
          border: "border-purple-200 dark:border-purple-800",
          text: "text-purple-700 dark:text-purple-300",
          icon: "text-purple-500",
        };
      default:
        return {
          bg: "bg-gray-50 dark:bg-gray-950/30",
          border: "border-gray-200 dark:border-gray-800",
          text: "text-gray-700 dark:text-gray-300",
          icon: "text-gray-500",
        };
    }
  };

  const typeStyle = getGroupTypeStyle(group.type);

  // Get role icon
  const getRoleIcon = () => {
    switch (userRole) {
      case "owner":
        return <Crown className="h-3 w-3 text-yellow-500" />;
      case "admin":
        return <Shield className="h-3 w-3 text-blue-500" />;
      default:
        return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  const handleCardClick = () => {
    router.push(`/dashboard/groups/${group.id}`);
  };

  useEffect(() => {
    const loadGroupEvents = async () => {
      const events = await fetchGroupEvents(group.id);
      setGroupEvents(events);
    };
    loadGroupEvents();
  }, [group.id]);

  return (
    <div
      onClick={handleCardClick}
      className="group bg-[var(--card)] border border-[var(--border)] rounded-lg hover:shadow-md hover:dark:shadow-neutral-700 transition-all duration-200 overflow-hidden"
    >
      {/* Card Image */}
      <div className="w-full aspect-[5/3] bg-neutral-400 overflow-hidden">
        <Image
          src={"/wallpapers/default-cabin.jpg"}
          width={500}
          height={333}
          alt="Group Image"
          className="w-full object-cover "
        />
      </div>

      {/* Card Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div
              className={`p-2 rounded-lg ${typeStyle.bg} ${typeStyle.border} border`}
            >
              <Users className={`h-5 w-5 ${typeStyle.icon}`} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--foreground)] font-inter text-lg leading-tight">
                {group.name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${typeStyle.bg} ${typeStyle.text} font-medium capitalize`}
                >
                  {group.type}
                </span>
                <div className="flex items-center space-x-1">
                  {getRoleIcon()}
                  <span className="text-xs text-[var(--muted-foreground)] capitalize">
                    {userRole}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* More actions dropdown trigger */}
          <button className="p-2 rounded-md hover:bg-[var(--muted)] transition-colors opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4 text-[var(--muted-foreground)]" />
          </button>
        </div>

        {/* Description */}
        {group.description && (
          <p className="text-sm text-[var(--muted-foreground)] font-inter line-clamp-2 mb-4">
            {group.description}
          </p>
        )}

        {/* Group Stats */}
        <div className="flex items-center space-x-4 text-xs text-[var(--muted-foreground)]">
          <div className="flex items-center space-x-1">
            <Users className="h-3 w-3" />
            <span>
              {group.members.length} member
              {group.members.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3" />
            <span>{groupEvents.length} events</span>
          </div>
          <div className="flex items-center space-x-1">
            <MessageCircle className="h-3 w-3" />
            <span>0 messages</span>
          </div>
        </div>
      </div>
      {/* Card Actions */}
      <div className="px-6 pb-6 pt-2 hidden">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              // Navigate to individual group page
              router.push(`/dashboard/groups/${group.id}`);
              // Also call the callback if provided
              onViewDetails?.(group.id);
            }}
            className="flex-1 px-3 py-2 text-sm font-medium text-foreground bg-[var(--muted)] hover:bg-[var(--muted)]/80 rounded-md transition-colors font-inter"
          >
            View Details
          </button>
          <button
            onClick={() => onViewMessages?.(group.id)}
            className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors font-inter"
          >
            <MessageCircle className="h-4 w-4 mr-1 inline" />
            Chat
          </button>
          {canManage && (
            <button
              onClick={() => onManageGroup?.(group.id)}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Member Avatars Preview */}
      <div className="px-6 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {group.members.slice(0, 4).map((member) => (
              <div
                key={member.id || member.email}
                className="relative"
                title={member.name}
              >
                <div className="h-6 w-6 bg-[var(--primary)]/90 rounded-full border-2 border-[var(--background)] flex items-center justify-center">
                  <span className="text-xs font-medium text-white">
                    {member.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                {member.role === "owner" && (
                  <Crown className="absolute -top-1 -right-1 h-3 w-3 text-yellow-500" />
                )}
              </div>
            ))}
            {group.members.length > 4 && (
              <div className="h-6 w-6 bg-muted rounded-full border-2 border-background flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">
                  +{group.members.length - 4}
                </span>
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
