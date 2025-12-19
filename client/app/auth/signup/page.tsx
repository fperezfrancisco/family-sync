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
 * Signup page component
 * Handles new user registration with name, email, password, and password confirmation
 */
export default function SignupPage() {
  const { register, user } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
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
   * Form validation with comprehensive checks
   */
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters long";
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    // Password confirmation validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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

      const res = await register(
        formData.name,
        normalizedEmail,
        formData.password
      );

      if (res && res.ok) {
        // Success - redirect to dashboard
        router.push("/dashboard");
      } else if (res && !res.ok) {
        // API returned an error
        setErrors({ general: res.message });
      }
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ general: "Registration failed. Please try again." });
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
          Create Account
        </h2>
        <p className="text-muted-foreground mt-2 font-inter">
          Join FamilySync and start connecting with your loved ones
        </p>
      </div>

      {/* Registration form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* General error message */}
        {errors.general && (
          <ErrorAlert
            message={errors.general}
            onDismiss={() => setErrors((prev) => ({ ...prev, general: "" }))}
          />
        )}

        {/* Name input */}
        <Input
          id="name"
          name="name"
          type="text"
          label="Full Name"
          placeholder="Enter your full name"
          value={formData.name}
          onChange={handleInputChange}
          error={errors.name}
          icon="user"
          required
        />

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
          placeholder="Create a strong password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          icon="lock"
          required
        />

        {/* Password confirmation input */}
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          label="Confirm Password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleInputChange}
          error={errors.confirmPassword}
          icon="lock"
          required
        />

        {/* Password requirements note */}
        <div className="text-xs text-muted-foreground space-y-1 font-inter">
          <p>Password requirements:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>At least 8 characters long</li>
            <li>Contains uppercase and lowercase letters</li>
            <li>Contains at least one number</li>
          </ul>
        </div>

        {/* Terms and conditions checkbox */}
        <div className="flex items-start space-x-2">
          <input
            type="checkbox"
            id="terms"
            className="mt-1 h-4 w-4 text-primary border-input rounded focus:ring-ring"
            required
          />
          <label
            htmlFor="terms"
            className="text-xs text-muted-foreground font-inter"
          >
            I agree to the{" "}
            <LinkButton href="#" className="text-xs">
              Terms of Service
            </LinkButton>{" "}
            and{" "}
            <LinkButton href="#" className="text-xs">
              Privacy Policy
            </LinkButton>
          </label>
        </div>

        {/* Submit button */}
        <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Create Account"}
        </Button>
      </form>

      {/* Sign in link */}
      <div className="text-center pt-4 border-t border-border">
        <p className="text-sm text-muted-foreground font-inter">
          Already have an account?{" "}
          <LinkButton href="/auth/login">Sign in here</LinkButton>
        </p>
      </div>
    </div>
  );
}
