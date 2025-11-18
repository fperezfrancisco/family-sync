'use client';

import React from 'react';
import { Calendar, Plus } from 'lucide-react';

/**
 * Events Page - Placeholder
 * Shows user's events and event management functionality
 */
export default function EventsPage() {
  return (
    <div className="space-y-6">
      
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-inter">Events</h1>
          <p className="text-muted-foreground mt-2 font-inter">
            Plan and manage events with your groups
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary text-primary-foreground 
                         rounded-md hover:bg-primary/90 transition-colors font-inter">
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </button>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-16">
        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2 font-inter">
          No Events Scheduled
        </h2>
        <p className="text-muted-foreground mb-6 font-inter">
          Start planning your next family gathering or friend meetup
        </p>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md 
                         hover:bg-primary/90 transition-colors font-inter">
          Plan Your First Event
        </button>
      </div>
    </div>
  );
}