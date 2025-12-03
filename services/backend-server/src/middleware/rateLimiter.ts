import expressRateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * General API Rate Limiter - Environment Aware & Family-Friendly
 * Development: Very high limit for smooth development
 * Production: 1000 requests per 15 minutes per IP (generous for family usage)
 * Covers all non-auth endpoints like groups, tasks, events, messages, etc.
 */
export const generalLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: process.env.NODE_ENV === "production" ? 1000 : 10000, // Very generous in prod, high in dev
  message: {
    success: false,
    error: "RATE_LIMIT_EXCEEDED",
    message: "Too many requests from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    res.status(429).json({
      success: false,
      error: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests from this IP, please try again later.",
      retryAfter: "15 minutes",
      limit: 1000,
      windowMs: 15 * 60 * 1000,
      type: "general",
    });
  },
});

/**
 * Authentication Rate Limiter - Very Generous for Normal App Usage
 * Development: Unlimited requests (no rate limiting for dev workflow)
 * Production: 500 requests per 15 minutes (very generous for auth/me, refresh, profile updates)
 * This covers endpoints like /auth/me, /auth/refresh, /auth/logout, /auth/profile/*
 * Multiple users on same IP (family household) should have no issues with normal usage
 */
export const authLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: process.env.NODE_ENV === "production" ? 500 : 999999, // Very generous in prod, unlimited in dev
  message: {
    success: false,
    error: "AUTH_RATE_LIMIT_EXCEEDED",
    message:
      process.env.NODE_ENV === "production"
        ? "Too many authentication requests from this IP, please try again later."
        : "Development mode - rate limiting disabled for testing",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      console.log(
        `🔒 Auth rate limit exceeded for IP: ${req.ip} on ${
          req.path
        } at ${new Date().toISOString()}`
      );
      res.status(429).json({
        success: false,
        error: "AUTH_RATE_LIMIT_EXCEEDED",
        message:
          "Too many authentication requests from this IP, please try again later.",
        retryAfter: "15 minutes",
        limit: 500,
        windowMs: 15 * 60 * 1000,
        type: "authentication",
      });
    } else {
      // In development, this should never trigger due to high limit
      console.log(`🧪 Dev mode - auth rate limit bypassed for IP: ${req.ip}`);
      res.status(200).json({
        success: true,
        message: "Development mode - continuing request",
      });
    }
  },
});

/**
 * Strict Auth Limiter for Login/Register Only - Balanced Security
 * Production: 20 requests per 15 minutes for login/register (family households)
 * Development: Still unlimited for ease of testing
 * This provides security against brute force while allowing reasonable family usage
 */
export const strictAuthLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 20 : 999999,
  message: {
    success: false,
    error: "LOGIN_RATE_LIMIT_EXCEEDED",
    message:
      process.env.NODE_ENV === "production"
        ? "Too many login attempts from this IP for security. Please try again later."
        : "Development mode - rate limiting disabled",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    if (process.env.NODE_ENV === "production") {
      console.log(
        `🚨 Strict auth rate limit exceeded for IP: ${req.ip} on ${
          req.path
        } at ${new Date().toISOString()}`
      );
      res.status(429).json({
        success: false,
        error: "LOGIN_RATE_LIMIT_EXCEEDED",
        message:
          "Too many login attempts for security. Please try again later.",
        retryAfter: "15 minutes",
        limit: 20,
        windowMs: 15 * 60 * 1000,
        type: "strict_authentication",
      });
    } else {
      console.log(
        `🧪 Dev mode - strict auth rate limit bypassed for IP: ${req.ip} on ${req.path}`
      );
      res.status(200).json({
        success: true,
        message: "Development mode - continuing request",
      });
    }
  },
});

/**
 * Test Rate Limiter for demonstration purposes
 * Very low limits to easily test rate limiting functionality
 */
export const testLimiter = expressRateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 3, // Only 3 requests per minute for easy testing
  message: {
    success: false,
    error: "TEST_RATE_LIMIT_EXCEEDED",
    message: "Test rate limit exceeded - only 3 requests per minute allowed.",
    retryAfter: "1 minute",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    console.log(
      `🧪 Test rate limit exceeded for IP: ${
        req.ip
      } at ${new Date().toISOString()}`
    );
    res.status(429).json({
      success: false,
      error: "TEST_RATE_LIMIT_EXCEEDED",
      message: "Test rate limit exceeded - only 3 requests per minute allowed.",
      retryAfter: "1 minute",
      limit: 3,
      windowMs: 1 * 60 * 1000,
      type: "test",
    });
  },
});
