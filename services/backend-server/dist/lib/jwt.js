import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export function signAccess(payload) {
    return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
        expiresIn: parseInt(process.env.ACCESS_TOKEN_TTL, 10),
    });
}
export function signRefresh(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
        expiresIn: parseInt(process.env.REFRESH_TOKEN_TTL, 10),
    });
}
export function verifyAccess(token) {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
}
export function verifyRefresh(token) {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}
//# sourceMappingURL=jwt.js.map