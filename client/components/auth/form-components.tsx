"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: "mail" | "lock" | "user";
}

/**
 * Enhanced input component for forms with icons and password visibility toggle
 * Provides consistent styling across all auth forms
 */
export function Input({
  label,
  error,
  icon,
  className = "",
  type,
  ...props
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const IconComponent =
    icon === "mail"
      ? Mail
      : icon === "lock"
      ? Lock
      : icon === "user"
      ? User
      : null;

  return (
    <div className="space-y-2">
      <label
        htmlFor={props.id}
        className="block text-sm font-medium text-foreground font-inter"
      >
        {label}
      </label>
      <div className="relative">
        {IconComponent && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <IconComponent className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        <input
          {...props}
          type={inputType}
          className={`
            w-full ${IconComponent ? "pl-10" : "pl-3"} ${
            isPassword ? "pr-10" : "pr-3"
          } py-2 
            border border-input rounded-md
            bg-background text-foreground
            focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            placeholder:text-muted-foreground
            transition-colors font-inter
            ${error ? "border-red-500 focus:ring-red-500" : ""}
            ${className}
          `}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            ) : (
              <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            )}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500 font-inter">{error}</p>}
    </div>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
}

/**
 * Enhanced button component with contrast styling
 * Primary buttons use blue-500 background with white text for contrast
 */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none font-inter";

  const variantClasses = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    secondary:
      "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface LinkButtonProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Link component styled as a button
 * Used for navigation between auth pages
 */
export function LinkButton({
  href,
  children,
  className = "",
}: LinkButtonProps) {
  return (
    <a
      href={href}
      className={`text-primary hover:text-primary/80 text-sm font-medium transition-colors font-inter ${className}`}
    >
      {children}
    </a>
  );
}
