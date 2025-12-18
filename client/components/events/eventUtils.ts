import { Event } from "@/types/events";

/**
 * Check if user can edit an event
 * Only owner can edit events (unlike groups where owner/admin can edit)
 */
export const canEditEvent = (event: Event, userId?: string): boolean => {
  if (!userId) return false;
  return event.owner.id === userId;
};

/**
 * Check if user can delete an event
 * Only owner can delete events
 */
export const canDeleteEvent = (event: Event, userId?: string): boolean => {
  if (!userId) return false;
  return event.owner.id === userId;
};
