/**
 * EVENT COMMENT TYPES
 *
 * TypeScript interfaces for event comment management
 * Matches backend EventComment schema structure
 */

export interface EventComment {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
  eventId: string;
  parentCommentId?: string;
  likeCount: number;
  isLikedByUser: boolean;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
  level: number;
  replies?: EventComment[];
}

export interface CreateCommentData {
  content: string;
  parentCommentId?: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface EventCommentsResponse {
  success: boolean;
  data: {
    comments: EventComment[];
    count: number;
  };
}

export interface CreateCommentResponse {
  success: boolean;
  data: {
    comment: EventComment;
  };
  message: string;
}

export interface UpdateCommentResponse {
  success: boolean;
  data: {
    comment: EventComment;
  };
  message: string;
}

export interface DeleteCommentResponse {
  success: boolean;
  message: string;
}

export interface ToggleLikeResponse {
  success: boolean;
  data: {
    commentId: string;
    likeCount: number;
    isLikedByUser: boolean;
  };
  message: string;
}

export interface CommentCountResponse {
  success: boolean;
  data: {
    count: number;
  };
}
