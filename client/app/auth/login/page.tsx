"use client";

import React, { useEffect, useState } from "react";
import {
  Input,
  Button,
  LinkButton,
} from "../../../components/auth/form-components";
import { ErrorAlert } from "../../../components/auth/ErrorAlert";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * Login page component
 * Handles user authentication with email and password
 */
export default function LoginPage() {
  const { login, user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handle input field changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  /**
   * Basic form validation
   */
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Normalize email before sending
      const normalizedEmail = formData.email.trim().toLowerCase();

      const res = await login(normalizedEmail, formData.password);
      console.log("Login result:", res);

      if (res && !res.ok) {
        // Display error message from API
        setErrors({ general: res.message });
        return;
      }

      if (res && res.ok) {
        console.log("Login successful, redirecting...");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login page error:", error);
      setErrors({ general: "Login failed. Please try again." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // if user is already logged in, redirect to dashboard
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground font-inter">
          Welcome Back
        </h2>
        <p className="text-muted-foreground mt-2 font-inter">
          Sign in to your Better Together Account
        </p>
      </div>

      {/* Login form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General error message */}
        {errors.general && (
          <ErrorAlert
            message={errors.general}
            onDismiss={() => setErrors((prev) => ({ ...prev, general: "" }))}
          />
        )}

        {/* Email input */}
        <Input
          id="email"
          name="email"
          type="email"
          label="Email Address"
          placeholder="Enter your email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          icon="mail"
          required
        />

        {/* Password input */}
        <Input
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          icon="lock"
          required
        />

        {/* Forgot password link */}
        <div className="flex justify-end">
          <LinkButton href="#" className="text-xs">
            Forgot your password?
          </LinkButton>
        </div>

        {/* Submit button */}
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign In"}
        </Button>
      </form>

      {/* Sign up link */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground font-inter">
          Don&apos;t have an account?{" "}
          <LinkButton href="/auth/signup">Create one here</LinkButton>
        </p>
      </div>
    </div>
  );
}
