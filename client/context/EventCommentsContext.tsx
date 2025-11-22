"use client";

import React, { createContext, useCallback, useState } from "react";
import { EventCommentsAPI } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";
import {
  EventComment,
  CreateCommentData,
  UpdateCommentData,
  EventCommentsResponse,
  CreateCommentResponse,
  UpdateCommentResponse,
  DeleteCommentResponse,
  ToggleLikeResponse,
} from "@/types/eventComments";

interface EventCommentsContextType {
  // Comment data management
  comments: Record<string, EventComment[]>; // Keyed by eventId
  loading: Record<string, boolean>; // Loading state per event
  commentCounts: Record<string, number>; // Comment count per event

  // Comment operations
  loadComments: (eventId: string) => Promise<void>;
  createComment: (
    eventId: string,
    commentData: CreateCommentData
  ) => Promise<EventComment | null>;
  updateComment: (
    commentId: string,
    updateData: UpdateCommentData
  ) => Promise<EventComment | null>;
  deleteComment: (commentId: string, eventId: string) => Promise<boolean>;
  toggleLike: (commentId: string, eventId: string) => Promise<boolean>;

  // Utility functions
  getEventComments: (eventId: string) => EventComment[];
  getCommentCount: (eventId: string) => number;
  refreshComments: (eventId: string) => Promise<void>;
  clearEventComments: (eventId: string) => void;
}

const EventCommentsContext = createContext<EventCommentsContextType | null>(
  null
);

export function EventCommentsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const { showToast } = useToast();

  // State management
  const [comments, setComments] = useState<Record<string, EventComment[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(
    {}
  );

  // Helper function to update loading state for specific event
  const setEventLoading = (eventId: string, isLoading: boolean) => {
    setLoading((prev) => ({
      ...prev,
      [eventId]: isLoading,
    }));
  };

  // Load comments for a specific event
  const loadComments = useCallback(
    async (eventId: string) => {
      if (!user) return;

      setEventLoading(eventId, true);
      try {
        const response: EventCommentsResponse =
          await EventCommentsAPI.getByEvent(eventId);

        if (response.success && response.data) {
          setComments((prev) => ({
            ...prev,
            [eventId]: response.data.comments,
          }));

          setCommentCounts((prev) => ({
            ...prev,
            [eventId]: response.data.count,
          }));
        }
      } catch (error) {
        console.error("Error loading comments:", error);
        showToast("Failed to load comments", "error");
      } finally {
        setEventLoading(eventId, false);
      }
    },
    [user, showToast]
  );

  // Create a new comment or reply
  const createComment = useCallback(
    async (
      eventId: string,
      commentData: CreateCommentData
    ): Promise<EventComment | null> => {
      if (!user) return null;

      try {
        const response: CreateCommentResponse = await EventCommentsAPI.create(
          eventId,
          commentData
        );

        if (response.success && response.data?.comment) {
          const newComment = response.data.comment;

          setComments((prev) => {
            const eventComments = prev[eventId] || [];

            if (commentData.parentCommentId) {
              // This is a reply - add it to the parent's replies
              const updatedComments = eventComments.map((comment) => {
                if (comment.id === commentData.parentCommentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newComment],
                  };
                }
                return comment;
              });
              return { ...prev, [eventId]: updatedComments };
            } else {
              // This is a top-level comment - add it to the beginning
              return {
                ...prev,
                [eventId]: [newComment, ...eventComments],
              };
            }
          });

          // Update comment count
          setCommentCounts((prev) => ({
            ...prev,
            [eventId]: (prev[eventId] || 0) + 1,
          }));

          showToast(
            commentData.parentCommentId ? "Reply posted!" : "Comment posted!",
            "success"
          );
          return newComment;
        }
      } catch (error) {
        console.error("Error creating comment:", error);
        showToast("Failed to post comment", "error");
      }

      return null;
    },
    [user, showToast]
  );

  // Update an existing comment
  const updateComment = useCallback(
    async (
      commentId: string,
      updateData: UpdateCommentData
    ): Promise<EventComment | null> => {
      if (!user) return null;

      try {
        const response: UpdateCommentResponse = await EventCommentsAPI.update(
          commentId,
          updateData
        );

        if (response.success && response.data?.comment) {
          const updatedComment = response.data.comment;

          // Update the comment in our state
          setComments((prev) => {
            const newComments = { ...prev };

            // Find and update the comment across all events
            Object.keys(newComments).forEach((eventId) => {
              newComments[eventId] = newComments[eventId].map((comment) => {
                // Check top-level comments
                if (comment.id === commentId) {
                  return updatedComment;
                }
                // Check replies
                if (comment.replies) {
                  const updatedReplies = comment.replies.map((reply) =>
                    reply.id === commentId ? updatedComment : reply
                  );
                  return { ...comment, replies: updatedReplies };
                }
                return comment;
              });
            });

            return newComments;
          });

          showToast("Comment updated!", "success");
          return updatedComment;
        }
      } catch (error) {
        console.error("Error updating comment:", error);
        showToast("Failed to update comment", "error");
      }

      return null;
    },
    [user, showToast]
  );

  // Delete a comment
  const deleteComment = useCallback(
    async (commentId: string, eventId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response: DeleteCommentResponse = await EventCommentsAPI.delete(
          commentId
        );

        if (response.success) {
          // Remove the comment from our state
          setComments((prev) => {
            const eventComments = prev[eventId] || [];
            const filteredComments = eventComments
              .map((comment) => {
                // Remove top-level comment
                if (comment.id === commentId) {
                  return null;
                }
                // Remove from replies
                if (comment.replies) {
                  return {
                    ...comment,
                    replies: comment.replies.filter(
                      (reply) => reply.id !== commentId
                    ),
                  };
                }
                return comment;
              })
              .filter(Boolean) as EventComment[];

            return { ...prev, [eventId]: filteredComments };
          });

          // Update comment count
          setCommentCounts((prev) => ({
            ...prev,
            [eventId]: Math.max(0, (prev[eventId] || 1) - 1),
          }));

          showToast("Comment deleted", "success");
          return true;
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        showToast("Failed to delete comment", "error");
      }

      return false;
    },
    [user, showToast]
  );

  // Toggle like on a comment
  const toggleLike = useCallback(
    async (commentId: string, eventId: string): Promise<boolean> => {
      if (!user) return false;

      try {
        const response: ToggleLikeResponse = await EventCommentsAPI.toggleLike(
          commentId
        );

        if (response.success && response.data) {
          const { likeCount, isLikedByUser } = response.data;

          // Update the comment's like status in our state
          setComments((prev) => {
            const eventComments = prev[eventId] || [];
            const updatedComments = eventComments.map((comment) => {
              // Update top-level comment
              if (comment.id === commentId) {
                return {
                  ...comment,
                  likeCount,
                  isLikedByUser,
                };
              }
              // Update reply
              if (comment.replies) {
                const updatedReplies = comment.replies.map((reply) =>
                  reply.id === commentId
                    ? { ...reply, likeCount, isLikedByUser }
                    : reply
                );
                return { ...comment, replies: updatedReplies };
              }
              return comment;
            });

            return { ...prev, [eventId]: updatedComments };
          });

          return true;
        }
      } catch (error) {
        console.error("Error toggling like:", error);
        showToast("Failed to update like", "error");
      }

      return false;
    },
    [user, showToast]
  );

  // Utility functions
  const getEventComments = useCallback(
    (eventId: string): EventComment[] => {
      return comments[eventId] || [];
    },
    [comments]
  );

  const getCommentCount = useCallback(
    (eventId: string): number => {
      return commentCounts[eventId] || 0;
    },
    [commentCounts]
  );

  const refreshComments = useCallback(
    async (eventId: string) => {
      await loadComments(eventId);
    },
    [loadComments]
  );

  const clearEventComments = useCallback((eventId: string) => {
    setComments((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [eventId]: _, ...rest } = prev;
      return rest;
    });
    setCommentCounts((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [eventId]: _, ...rest } = prev;
      return rest;
    });
    setLoading((prev) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [eventId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const contextValue: EventCommentsContextType = {
    // State
    comments,
    loading,
    commentCounts,

    // Operations
    loadComments,
    createComment,
    updateComment,
    deleteComment,
    toggleLike,

    // Utilities
    getEventComments,
    getCommentCount,
    refreshComments,
    clearEventComments,
  };

  return (
    <EventCommentsContext.Provider value={contextValue}>
      {children}
    </EventCommentsContext.Provider>
  );
}

export const useEventComments = () => {
  const context = React.useContext(EventCommentsContext);
  if (!context) {
    throw new Error(
      "useEventComments must be used within an EventCommentsProvider"
    );
  }
  return context;
};
