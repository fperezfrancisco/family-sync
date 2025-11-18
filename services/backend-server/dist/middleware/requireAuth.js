import { verifyAccess } from "../lib/jwt.js";
export function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res
            .status(401)
            .json({ message: "Unauthorized: Missing or invalid token" });
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = verifyAccess(token);
        if (payload.type !== "access") {
            return res
                .status(401)
                .json({ message: "Unauthorized: Invalid token type" });
        }
        req.user = { id: payload.sub };
        next();
    }
    catch (error) {
        return res
            .status(401)
            .json({ message: "Unauthorized: Invalid or expired token" });
    }
}
//# sourceMappingURL=requireAuth.js.map