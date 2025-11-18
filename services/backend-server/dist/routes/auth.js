import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto, { verify } from "crypto";
import User from "../models/User.js";
import RefreshSession from "../models/Auth.js";
import { create } from "domain";
import { signAccess, signRefresh, verifyAccess, verifyRefresh, } from "../lib/jwt.js";
const router = Router();
// zod schemas for request validation
const RegisterSchema = z.object({
    name: z.string().min(1).max(80),
    email: z.string().email(),
    password: z.string().min(6).max(128),
});
const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(128),
});
// ROUTES
// Register route
router.post("/register", async (req, res) => {
    // Validate request body
    const { name, email, password } = RegisterSchema.parse(req.body);
    // check db if user exists and handle db registration logic
    const passwordHash = await bcrypt.hash(password, 12);
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: "User already exists" });
    }
    const userObject = {
        name,
        email,
        passwordHash,
        dob: null,
        gender: null,
        phone: null,
        groups: [],
    };
    const createdUser = await User.create(userObject);
    const jti = crypto.randomUUID().toString();
    const access = signAccess({
        sub: createdUser._id.toString(),
        type: "access",
    });
    const refresh = signRefresh({
        sub: createdUser._id.toString(),
        type: "refresh",
        jti,
    });
    // add refresh token to db
    await RefreshSession.create({
        userId: createdUser._id,
        jti,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // example: 30 days from now
    });
    return res
        .cookie("refreshToken", refresh, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/auth/refresh",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })
        .status(201)
        .json({
        message: "User registered",
        user: {
            id: createdUser._id,
            name: createdUser.name,
            email: createdUser.email,
            dob: createdUser.dob,
            gender: createdUser.gender,
            phone: createdUser.phone,
            groups: createdUser.groups,
        },
        accessToken: access,
    });
});
// Login Route
router.post("/login", async (req, res) => {
    // Validate request body
    const { email, password } = LoginSchema.parse(req.body);
    // check db for user and handle login logic
    const user = await User.findOne({ email });
    if (!user) {
        return res
            .status(404)
            .json({ message: "User not found. Please register first." });
    }
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
    }
    // token stuff
    const jti = crypto.randomUUID().toString();
    const access = signAccess({
        sub: user._id.toString(),
        type: "access",
    });
    const refresh = signRefresh({
        sub: user._id.toString(),
        type: "refresh",
        jti,
    });
    // find latest refresh token and set isRevoked to true if exists
    await RefreshSession.updateMany({ userId: user._id, isRevoked: false }, { isRevoked: true });
    // add refresh token to db
    await RefreshSession.create({
        userId: user._id,
        jti,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // example: 30 days from now
    });
    return res
        .cookie("refreshToken", refresh, {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/auth/refresh",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    })
        .status(200)
        .json({
        message: "Login successful",
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            dob: user.dob,
            gender: user.gender,
            phone: user.phone,
            groups: user.groups,
        },
        accessToken: access,
    });
});
// Log Out Route
router.post("/logout", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (refreshToken) {
        try {
            const payload = verifyRefresh(refreshToken);
            if (payload.type === "refresh" && payload.jti && payload.sub) {
                await RefreshSession.findOneAndUpdate({ jti: payload.jti, userId: payload.sub, isRevoked: false }, { isRevoked: true });
            }
        }
        catch (error) {
            // token invalid or expired, nothing to do
        }
    }
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        path: "/auth/refresh",
    });
    return res.status(200).json({ message: "Logged out successfully" });
});
// Refresh Token Route
router.post("/refresh", async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
        return res.status(401).json({ message: "Missing refresh token" });
    }
    try {
        const payload = verifyRefresh(refreshToken);
        if (payload.type !== "refresh" || !payload.jti || !payload.sub) {
            return res.status(401).json({ message: "Invalid token type" });
        }
        const session = await RefreshSession.findOne({
            jti: payload.jti,
            userId: payload.sub,
            isRevoked: false,
        });
        if (!session) {
            return res.status(401).json({ message: "Invalid or revoked token" });
        }
        // generate new tokens
        const newJti = crypto.randomUUID().toString();
        const newAccess = signAccess({
            sub: payload.sub,
            type: "access",
        });
        const newRefresh = signRefresh({
            sub: payload.sub,
            type: "refresh",
            jti: newJti,
        });
        // find latest refresh token and set isRevoked to true if exists
        await RefreshSession.updateMany({ userId: payload.sub, isRevoked: false }, { isRevoked: true });
        // add refresh token to db
        await RefreshSession.create({
            userId: payload.sub,
            jti: newJti,
            isRevoked: false,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // example: 30 days from now
        });
        return res
            .cookie("refreshToken", newRefresh, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/auth/refresh",
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        })
            .status(200)
            .json({
            message: "Token refreshed",
            accessToken: newAccess,
        });
    }
    catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
});
// Get Current User Route
router.get("/me", async (req, res) => {
    // get user from access token
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
        const user = await User.findById(payload.sub);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                dob: user.dob,
                gender: user.gender,
                phone: user.phone,
                groups: user.groups,
            },
        });
    }
    catch (error) {
        return res
            .status(401)
            .json({ message: "Unauthorized: Invalid or expired token" });
    }
});
export default router;
//# sourceMappingURL=auth.js.map