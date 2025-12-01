import expressRateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * General API Rate Limiter
 * Limits all API endpoints to 100 requests per 15 minutes per IP
 */
export const generalLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100, // Limit each IP to 100 requests per windowMs
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
      limit: 100,
      windowMs: 15 * 60 * 1000,
      type: "general",
    });
  },
});

/**
 * Authentication Rate Limiter
 * Limits authentication endpoints to 5 requests per 15 minutes per IP
 * More restrictive to prevent brute force attacks
 */
export const authLimiter = expressRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: "AUTH_RATE_LIMIT_EXCEEDED",
    message:
      "Too many authentication attempts from this IP, please try again later.",
    retryAfter: "15 minutes",
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    console.log(
      `Auth rate limit exceeded for IP: ${
        req.ip
      } at ${new Date().toISOString()}`
    );
    res.status(429).json({
      success: false,
      error: "AUTH_RATE_LIMIT_EXCEEDED",
      message:
        "Too many authentication attempts from this IP, please try again later.",
      retryAfter: "15 minutes",
      limit: 5,
      windowMs: 15 * 60 * 1000,
      type: "authentication",
    });
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
