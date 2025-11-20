"use client";

import React, { useState, useEffect } from "react";
import { Mail, Clock, Users, Check, X, ExternalLink } from "lucide-react";
import { InvitationsAPI } from "@/lib/api";
import { GroupInvitationWithDetails } from "@/types/invitations";

interface PendingInvitationsProps {
  onInvitationResponse?: () => void;
}

/**
 * PendingInvitations Component
 * Shows user's pending group invitations in the dashboard
 */
export default function PendingInvitations({
  onInvitationResponse,
}: PendingInvitationsProps) {
  const [invitations, setInvitations] = useState<GroupInvitationWithDetails[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string>("");
  const [error, setError] = useState<string>("");

  /**
   * Fetch pending invitations
   */
  const fetchInvitations = async () => {
    try {
      setIsLoading(true);
      const response = await InvitationsAPI.getMine();
      setInvitations(response.invitations || []);
      setError("");
    } catch (error: unknown) {
      console.error("Error fetching invitations:", error);
      setError("Failed to load invitations");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle invitation response
   */
  const handleResponse = async (
    invitationId: string,
    action: "accept" | "decline"
  ) => {
    try {
      setProcessingId(invitationId);
      setError("");

      // Find the invitation to get group name for alert
      const invitation = invitations.find((inv) => inv.id === invitationId);
      const groupName = invitation?.group.name || "the group";

      await InvitationsAPI.respond(invitationId, { action });

      // Remove the invitation from the list
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));

      // Show success alert instead of calling parent callback
      const successMessage =
        action === "accept"
          ? `Successfully joined "${groupName}"! You can now access the group from your Groups page.`
          : `Invitation to "${groupName}" has been declined.`;

      alert(successMessage);

      // Notify parent component for any additional actions
      if (onInvitationResponse) {
        onInvitationResponse();
      }
    } catch (error: unknown) {
      console.error("Error responding to invitation:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to respond to invitation"
      );
    } finally {
      setProcessingId("");
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 24) {
      if (diffHours < 1) return "Just now";
      return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  // Load invitations on mount
  useEffect(() => {
    fetchInvitations();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--foreground)] font-inter">
            Pending Invitations
          </h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-[3px] border-current border-t-transparent rounded-full text-[var(--muted-foreground)]"></div>
        </div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[var(--foreground)] mb-4 font-inter">
          Pending Invitations
        </h3>
        <div className="text-center py-8">
          <Mail className="h-12 w-12 text-[var(--muted-foreground)] mx-auto mb-3" />
          <p className="text-sm text-[var(--muted-foreground)] font-inter">
            No pending invitations
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--foreground)] font-inter">
          Pending Invitations
        </h3>
        <span className="text-sm text-[var(--muted-foreground)] font-inter">
          {invitations.length} pending
        </span>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm font-inter">
          {error}
        </div>
      )}

      <div className="space-y-3">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/20 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-[var(--muted-foreground)] shrink-0" />
                  <h4 className="font-medium text-[var(--foreground)] truncate font-inter">
                    {invitation.group.name}
                  </h4>
                  <span className="text-xs bg-[var(--muted)] text-[var(--muted-foreground)] px-2 py-1 rounded font-inter">
                    {invitation.group.type}
                  </span>
                </div>

                <p className="text-sm text-[var(--muted-foreground)] mb-2 font-inter">
                  <strong>{invitation.inviter.name}</strong> invited you to join
                  this group
                </p>

                {invitation.message && (
                  <p className="text-sm text-[var(--foreground)] bg-[var(--muted)]/50 p-2 rounded italic font-inter">
                    &ldquo;{invitation.message}&rdquo;
                  </p>
                )}

                <div className="flex items-center gap-1 mt-2 text-xs text-[var(--muted-foreground)]">
                  <Clock className="h-3 w-3" />
                  <span className="font-inter">
                    {formatDate(invitation.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                <button
                  onClick={() => handleResponse(invitation.id, "accept")}
                  disabled={processingId === invitation.id}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-green-600 rounded hover:bg-green-500 transition-colors disabled:opacity-50 font-inter"
                >
                  <Check className="h-3 w-3" />
                  Accept
                </button>
                <button
                  onClick={() => handleResponse(invitation.id, "decline")}
                  disabled={processingId === invitation.id}
                  className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors disabled:opacity-50 font-inter"
                >
                  <X className="h-3 w-3" />
                  Decline
                </button>
              </div>
            </div>

            {processingId === invitation.id && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)] font-inter">
                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                Processing...
              </div>
            )}
          </div>
        ))}
      </div>

      {invitations.length > 0 && (
        <button
          onClick={fetchInvitations}
          className="w-full mt-4 text-sm text-[var(--primary)] hover:text-[var(--primary)]/80 font-medium font-inter flex items-center justify-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          Refresh invitations
        </button>
      )}
    </div>
  );
}
