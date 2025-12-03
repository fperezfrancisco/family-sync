import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export type JwtAccess = { sub: string; type: string }; // user id
export type JwtRefresh = { sub: string; type: string; jti: string }; // refresh token id (session id)

export function signAccess(payload: JwtAccess) {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET as string, {
    expiresIn: 15, //parseInt(process.env.ACCESS_TOKEN_TTL as string, 10),
  });
}

export function signRefresh(payload: JwtRefresh) {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, {
    expiresIn: parseInt(process.env.REFRESH_TOKEN_TTL as string, 10),
  });
}

export function verifyAccess(token: string) {
  return jwt.verify(
    token,
    process.env.JWT_ACCESS_SECRET as string
  ) as JwtAccess;
}

export function verifyRefresh(token: string) {
  return jwt.verify(
    token,
    process.env.JWT_REFRESH_SECRET as string
  ) as JwtRefresh;
}
