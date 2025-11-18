'use client';

import React from 'react';
import { Users, Plus } from 'lucide-react';

/**
 * Groups Page - Placeholder
 * Shows user's groups and group management functionality
 */
export default function GroupsPage() {
  return (
    <div className="space-y-6">
      
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-inter">Groups</h1>
          <p className="text-muted-foreground mt-2 font-inter">
            Manage your family and friend groups
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary text-primary-foreground 
                         rounded-md hover:bg-primary/90 transition-colors font-inter">
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </button>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-16">
        <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2 font-inter">
          No Groups Yet
        </h2>
        <p className="text-muted-foreground mb-6 font-inter">
          Create your first group to start connecting with family and friends
        </p>
        <button className="px-6 py-3 bg-primary text-primary-foreground rounded-md 
                         hover:bg-primary/90 transition-colors font-inter">
          Create Your First Group
        </button>
      </div>
    </div>
  );
}