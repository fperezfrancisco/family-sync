import type { NextFunction, Request, Response } from "express";
import { verifyAccess } from "../lib/jwt.js";

interface AuthRequest extends Request {
  user?: { id: string };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Missing or invalid token" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const payload = verifyAccess(token as string);
    if (payload.type !== "access") {
      return res
        .status(401)
        .json({ message: "Unauthorized: Invalid token type" });
    }
    req.user = { id: payload.sub };
    next();
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token" });
  }
}
