import React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

/**
 * Layout component for authentication pages
 * Provides consistent styling and structure for login and signup pages
 */
export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* App branding section */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 font-inter">
            FamilySync
          </h1>
          <p className="text-muted-foreground font-inter">
            Connect, plan, and share with your loved ones
          </p>
        </div>

        {/* Main content area */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          {children}
        </div>

        {/* Footer section */}
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground font-inter">
            © 2025 FamilySync. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
