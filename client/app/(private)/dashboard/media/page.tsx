"use client";

import React from "react";
import { Image as ImageIcon, Upload } from "lucide-react";

/**
 * Media Page - Placeholder
 * Shows shared media files and media management functionality
 */
export default function MediaPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground font-inter">
            Media
          </h1>
          <p className="text-muted-foreground mt-2 font-inter">
            Share photos, videos, and files with your groups
          </p>
        </div>
        <button
          className="flex items-center px-4 py-2 bg-primary text-primary-foreground 
                         rounded-md hover:bg-primary/90 transition-colors font-inter"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Media
        </button>
      </div>

      {/* Placeholder content */}
      <div className="text-center py-16">
        <ImageIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2 font-inter">
          No Media Shared Yet
        </h2>
        <p className="text-muted-foreground mb-6 font-inter">
          Start sharing memories with your family and friends
        </p>
        <button
          className="px-6 py-3 bg-primary text-primary-foreground rounded-md 
                         hover:bg-primary/90 transition-colors font-inter"
        >
          Upload Your First Photo
        </button>
      </div>
    </div>
  );
}
