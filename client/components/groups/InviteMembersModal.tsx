"use client";

import React, { useState } from "react";
import { Mail, UserPlus, Send } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { GroupsAPI } from "@/lib/api";
import { CreateInvitationData } from "@/types/invitations";

interface InviteMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groupName: string;
  onInvitationSent?: () => void;
}

/**
 * InviteMembersModal Component
 * Modal for inviting new members to a group via email
 */
export default function InviteMembersModal({
  isOpen,
  onClose,
  groupId,
  groupName,
  onInvitationSent,
}: InviteMembersModalProps) {
  const [formData, setFormData] = useState<CreateInvitationData>({
    email: "",
    message: "",
    role: "member",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  /**
   * Handle input changes
   */
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (error) setError("");
    if (success) setSuccess("");
  };

  /**
   * Validate email format
   */
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation
    if (!formData.email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!validateEmail(formData.email)) {
      setError("Please enter a valid email address");
      return;
    }

    try {
      setIsLoading(true);

      await GroupsAPI.createInvitation(groupId, {
        email: formData.email.toLowerCase().trim(),
        message: formData.message?.trim() || undefined,
        role: formData.role,
      });

      setSuccess("Invitation sent successfully!");

      // Reset form
      setFormData({
        email: "",
        message: "",
        role: "member",
      });

      // Notify parent component
      if (onInvitationSent) {
        onInvitationSent();
      }

      // Close modal after short delay
      setTimeout(() => {
        onClose();
        setSuccess("");
      }, 1500);
    } catch (error: unknown) {
      console.error("Error sending invitation:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle modal close
   */
  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        email: "",
        message: "",
        role: "member",
      });
      setError("");
      setSuccess("");
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Invite Members to ${groupName}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 font-inter">
            <Mail className="h-4 w-4 inline mr-1" />
            Email Address *
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md bg-[var(--background)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-inter ${
              error ? "border-red-500" : "border-[var(--border)]"
            }`}
            placeholder="Enter email address"
            disabled={isLoading}
            autoComplete="email"
          />
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 font-inter">
            <UserPlus className="h-4 w-4 inline mr-1" />
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-inter"
            disabled={isLoading}
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
            <option value="guest">Guest</option>
          </select>
          <p className="mt-1 text-xs text-[var(--muted-foreground)] font-inter">
            Members can create events, Admins can manage the group, Guests have
            limited access
          </p>
        </div>

        {/* Optional Message */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2 font-inter">
            Personal Message (Optional)
          </label>
          <textarea
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-[var(--border)] rounded-md bg-[var(--background)] text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-inter"
            placeholder="Add a personal message to the invitation..."
            maxLength={500}
            disabled={isLoading}
          />
          <p className="mt-1 text-xs text-[var(--muted-foreground)] font-inter">
            {formData.message?.length || 0}/500 characters
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-md text-red-700 text-sm font-inter">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-md text-green-700 text-sm font-inter">
            {success}
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-[var(--muted-foreground)] border border-[var(--border)] rounded-md hover:bg-[var(--muted)] transition-colors disabled:opacity-50 font-inter"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || !formData.email.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            {isLoading ? (
              <>
                <div className="animate-spin inline-block h-4 w-4 border-[3px] border-current border-t-transparent rounded-full mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 inline mr-2" />
                Send Invitation
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
