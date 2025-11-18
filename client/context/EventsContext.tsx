import { EventsAPI } from "@/lib/api";
import { useAuth } from "./AuthContext";
import { CreateEventData, Event } from "@/types";
import React, { createContext, useEffect, useState } from "react";

interface EventsContextType {
  events: Event[];
  loading: boolean;
  createEvent: (
    eventData: CreateEventData
  ) => Promise<void | { event?: Event; message?: string }>;
  deleteEvent: (
    eventId: string
  ) => Promise<void | { status: number; message?: string }>;
}

const EventsContext = createContext<EventsContextType | null>(null);

export function EventsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(false);
  const [events, setEvents] = useState<Event[]>([]);

  const createEvent = async (eventData: CreateEventData) => {
    // Implementation for creating a new event
    const response = await EventsAPI.create(eventData);
    if (response.event) {
      setEvents((prev) => [...prev, response.event]);
    }
    return response;
  };

  const deleteEvent = async (eventId: string) => {
    // Implementation for deleting an event
    const response = await EventsAPI.delete(eventId);
    if (response.status === 200) {
      setEvents((prev) => prev.filter((event) => event.id !== eventId));
    }
    return response;
  };

  useEffect(() => {
    (async () => {
      if (user) {
        setLoading(true);
        try {
          // Fetch events for the authenticated user
          const response = await EventsAPI.getAll();
          if (response.events) {
            setEvents(response.events);
          }
        } catch (error) {
          console.error("Error fetching events:", error);
        } finally {
          setLoading(false);
        }
      }
    })();
  }, [user]);

  return (
    <EventsContext.Provider
      value={{ events, loading, createEvent, deleteEvent }}
    >
      {children}
    </EventsContext.Provider>
  );
}

export const useEvents = () => {
  const context = React.useContext(EventsContext);
  if (!context) {
    throw new Error("useEvents must be used within an EventsProvider");
  }
  return context;
};
