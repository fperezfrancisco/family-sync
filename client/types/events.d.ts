import { User } from "./auth";

/**
 * Event Attendee interface
 * Represents an attendee's RSVP status for an event
 */
export interface EventAttendee {
  user: User;
  status: "pending" | "attending" | "not_attending" | "maybe";
  invitedAt: string;
  respondedAt?: string;
}

/**
 * Event Owner interface (simplified user info)
 * Owner information as returned by API
 */
export interface EventOwner {
  id: string;
  name: string;
  email: string;
}

/**
 * Event Group interface (simplified group info)
 * Group information as returned by API for events
 */
export interface EventGroup {
  id: string;
  name: string;
  type: "family" | "friends" | "work" | "other";
}

/**
 * Main Event interface
 * Represents an event as returned by the API
 */
export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay: boolean;
  timezone: string;
  location?: string;
  locationUrl?: string;
  isVirtual: boolean;
  owner: EventOwner;
  group?: EventGroup;
  isPrivate: boolean;
  allowGuestInvites: boolean;
  requireRSVP: boolean;
  maxAttendees?: number;
  attendees: EventAttendee[];
  status: "draft" | "published" | "cancelled" | "completed";
  attendeeCount: number;
  pendingInvites?: number;
  userRSVPStatus?: "pending" | "attending" | "not_attending" | "maybe" | null;
  canEdit?: boolean;
  canDelete?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Simplified Event interface for list views
 * Used in events list API responses
 */
export interface EventListItem {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay: boolean;
  location?: string;
  isVirtual: boolean;
  owner: EventOwner;
  group?: EventGroup;
  isPrivate: boolean;
  status: "draft" | "published" | "cancelled" | "completed";
  attendeeCount: number;
  userRSVPStatus?: "pending" | "attending" | "not_attending" | "maybe" | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Create Event request body interface
 * Data structure for creating a new event
 */
export interface CreateEventData {
  id?: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  isAllDay?: boolean;
  timezone?: string;
  location?: string;
  locationUrl?: string;
  isVirtual?: boolean;
  owner: { id: string; name: string; email: string }; // Owner ID
  group?: EventGroup; // Group ID
  isPrivate?: boolean;
  allowGuestInvites?: boolean;
  requireRSVP?: boolean;
  maxAttendees?: number;
  inviteUserIds?: string[];
}

/**
 * Update Event request body interface
 * Data structure for updating an existing event
 */
export interface UpdateEventData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  isAllDay?: boolean;
  timezone?: string;
  location?: string;
  locationUrl?: string;
  isVirtual?: boolean;
  isPrivate?: boolean;
  allowGuestInvites?: boolean;
  requireRSVP?: boolean;
  maxAttendees?: number;
  owner?: { id: string; name: string; email: string }; // Owner ID
  status?: "draft" | "published" | "cancelled" | "completed";
}

/**
 * RSVP request body interface
 * Data structure for RSVPing to an event
 */
export interface RSVPData {
  status: "attending" | "not_attending" | "maybe";
}

/**
 * Invite Users request body interface
 * Data structure for inviting users to an event
 */
export interface InviteUsersData {
  userIds: string[];
}

/**
 * API Response interfaces
 */

/**
 * Events List API Response
 */
export interface EventsListResponse {
  message: string;
  events: EventListItem[];
  total: number;
  hasMore: boolean;
}

/**
 * Single Event API Response
 */
export interface EventResponse {
  message: string;
  event: Event;
}

/**
 * Create/Update Event API Response
 */
export interface EventMutationResponse {
  message: string;
  event: Event;
}

/**
 * RSVP API Response
 */
export interface RSVPResponse {
  message: string;
  rsvpStatus: "attending" | "not_attending" | "maybe";
  attendeeCount: number;
}

/**
 * Invite Users API Response
 */
export interface InviteUsersResponse {
  message: string;
  newInvites: Array<{
    user: User;
    status: "pending";
  }>;
  totalInvites: number;
}

/**
 * Delete Event API Response
 */
export interface DeleteEventResponse {
  message: string;
}

/**
 * Event Query Parameters interface
 * For filtering and pagination
 */
export interface EventQueryParams {
  startDate?: string;
  endDate?: string;
  groupId?: string;
  status?: "draft" | "published" | "cancelled" | "completed" | "all";
  limit?: number;
  offset?: number;
}
