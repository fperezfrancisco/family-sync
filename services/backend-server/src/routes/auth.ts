import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcrypt";
import crypto, { verify } from "crypto";
import User from "../models/User.js";
import RefreshSession from "../models/Auth.js";
import { create } from "domain";
import {
  signAccess,
  signRefresh,
  verifyAccess,
  verifyRefresh,
} from "../lib/jwt.js";
import dotenv from "dotenv";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import multer from "multer";
import sharp from "sharp";
// RATE LIMITING: Import auth rate limiters
import { authLimiter, strictAuthLimiter } from "../middleware/rateLimiter.js";

// Extend Express Request interface to include multer file
declare global {
  namespace Express {
    interface Request {
      file?: Express.Multer.File;
    }
  }
}

dotenv.config();

// Standardized cookie configuration for refresh tokens
const getRefreshCookieConfig = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // HTTPS only in production
  sameSite: "lax" as const,
  path: "/auth", // Covers /auth/refresh and /auth/logout while maintaining security
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

const router = Router();

// RATE LIMITING: Apply general auth limiting to all auth endpoints (lenient for profile updates)
router.use(authLimiter);

const BUCKET_NAME = process.env.BUCKET_NAME || "default-bucket-name";
const BUCKET_REGION = process.env.BUCKET_REGION || "us-east-1";
const BUCKET_ACCESS_KEY = process.env.BUCKET_ACCESS_KEY || "default-access-key";
const BUCKET_SECRET_ACCESS_KEY =
  process.env.BUCKET_SECRET_ACCESS_KEY || "default-secret-access-key";

const s3 = new S3Client({
  region: BUCKET_REGION,
  credentials: {
    accessKeyId: BUCKET_ACCESS_KEY,
    secretAccessKey: BUCKET_SECRET_ACCESS_KEY,
  },
});

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

const UpdateProfileSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    dob: z
      .string()
      .datetime()
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
      .optional(),
    gender: z.enum(["male", "female", "other", ""]).optional(),
    phone: z
      .object({
        countryCode: z.string().min(1).max(5),
        number: z.string().min(1).max(20),
      })
      .optional(),
  })
  .strict();

// ROUTES

// Register route
router.post("/register", strictAuthLimiter, async (req, res) => {
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
    .cookie("refreshToken", refresh, getRefreshCookieConfig())
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
        pendingInvitations: createdUser.pendingInvitations,
        avatar: createdUser.avatar || { fullSize: null, small: null },
        banner: createdUser.banner || { fullSize: null, small: null },
        avatarUrl: createdUser.avatarUrl,
        bannerUrl: createdUser.bannerUrl,
      },
      accessToken: access,
    });
});

// Login Route
router.post("/login", strictAuthLimiter, async (req, res) => {
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
  await RefreshSession.updateMany(
    { userId: user._id, isRevoked: false },
    { isRevoked: true }
  );
  // add refresh token to db
  await RefreshSession.create({
    userId: user._id,
    jti,
    isRevoked: false,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // example: 30 days from now
  });

  return res
    .cookie("refreshToken", refresh, getRefreshCookieConfig())
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
        pendingInvitations: user.pendingInvitations,
        avatar: user.avatar || { fullSize: null, small: null },
        banner: user.banner || { fullSize: null, small: null },
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
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
        await RefreshSession.findOneAndUpdate(
          { jti: payload.jti, userId: payload.sub, isRevoked: false },
          { isRevoked: true }
        );
      }
    } catch (error) {
      // token invalid or expired, nothing to do
      res.clearCookie("refreshToken", getRefreshCookieConfig());
      return res.status(200).json({ message: "Logged out successfully" });
    }
  }
  res.clearCookie("refreshToken", getRefreshCookieConfig());
  return res.status(200).json({ message: "Logged out successfully" });
});

// Refresh Token Route
router.post("/refresh", async (req, res) => {
  console.log("Refresh route hit. All cookies:", req.cookies);
  console.log("Cookie header:", req.headers.cookie);
  const refreshToken = req.cookies.refreshToken;
  console.log("Refresh token? : ", refreshToken);
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
    await RefreshSession.updateMany(
      { userId: payload.sub, isRevoked: false },
      { isRevoked: true }
    );
    // add refresh token to db
    await RefreshSession.create({
      userId: payload.sub,
      jti: newJti,
      isRevoked: false,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // example: 30 days from now
    });

    return res
      .cookie("refreshToken", newRefresh, getRefreshCookieConfig())
      .status(200)
      .json({
        message: "Token refreshed",
        accessToken: newAccess,
      });
  } catch (error) {
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
    const payload = verifyAccess(token as string);
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
        // New structured avatar/banner fields
        avatar: user.avatar || { fullSize: null, small: null },
        banner: user.banner || { fullSize: null, small: null },
        // Legacy fields for backward compatibility
        avatarUrl: user.avatarUrl,
        bannerUrl: user.bannerUrl,
      },
    });
  } catch (error) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Invalid or expired token" });
  }
});

// Configure multer for file uploads (store in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (
    req: any,
    file: Express.Multer.File,
    cb: multer.FileFilterCallback
  ) => {
    // Accept only image files
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
});

/**
 * S3 Test Upload Endpoint
 * Tests basic S3 upload functionality
 */
router.post("/test-upload", upload.single("testFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const fileExtension = req.file.originalname.split(".").pop();
    const fileName = `test-uploads/${timestamp}-${randomSuffix}.${fileExtension}`;

    // S3 upload parameters
    const uploadParams = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
    };

    // Upload to S3
    const command = new PutObjectCommand(uploadParams);
    const result = await s3.send(command);

    // Generate URLs
    const directUrl = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${fileName}`;

    // Generate presigned URL (valid for 1 hour)
    const getObjectCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });
    const presignedUrl = await getSignedUrl(s3, getObjectCommand, {
      expiresIn: 3600,
    });

    console.log("✅ S3 Upload Success:", {
      fileName,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      s3Result: result,
      directUrl,
      presignedUrl,
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded successfully to S3!",
      data: {
        fileName,
        originalName: req.file.originalname,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        s3Key: fileName,
        directUrl: directUrl,
        presignedUrl: presignedUrl,
        uploadedAt: new Date().toISOString(),
        note: "Use presignedUrl for immediate access, or configure bucket policy for directUrl access",
      },
    });
  } catch (error) {
    console.error("❌ S3 Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload file to S3",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Profile Avatar Upload Endpoint
 * Uploads user profile image with automatic resizing
 * Creates both full-size and small (225x225) versions
 */
router.post("/profile/avatar", upload.single("avatar"), async (req, res) => {
  try {
    console.log("🔧 S3 Configuration:", {
      bucket: BUCKET_NAME,
      region: BUCKET_REGION,
      hasAccessKey: !!BUCKET_ACCESS_KEY,
      hasSecretKey: !!BUCKET_SECRET_ACCESS_KEY,
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No avatar file uploaded",
      });
    }

    // Extract userId from authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or invalid token",
      });
    }

    const token = authHeader.split(" ")[1];
    let userId: string;

    try {
      const payload = verifyAccess(token as string);
      if (payload.type !== "access") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token type",
        });
      }
      userId = payload.sub;
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split(".").pop();

    // Define S3 keys for both versions (using WebP for better quality/compression)
    const fullSizeKey = `profile-images/${userId}/profileImage.webp`;
    const smallSizeKey = `profile-images/${userId}/profileImageSmall.webp`;

    // Process images with Sharp
    let fullSizeBuffer: Buffer;
    let smallSizeBuffer: Buffer;

    try {
      // Create full-size version (high quality, maintain aspect ratio)
      fullSizeBuffer = await sharp(req.file.buffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 92,
          effort: 6, // Higher effort for better compression
        })
        .toBuffer();

      // Create small version (high quality for crisp small displays)
      smallSizeBuffer = await sharp(req.file.buffer)
        .resize(300, 300, {
          fit: "cover",
          position: "center",
        })
        .webp({
          quality: 90,
          effort: 6,
        })
        .toBuffer();
    } catch (imageError) {
      console.error("❌ Image Processing Error:", imageError);
      return res.status(400).json({
        success: false,
        message: "Failed to process image",
        error:
          imageError instanceof Error
            ? imageError.message
            : "Image processing failed",
      });
    }

    // Upload full-size image to S3
    const fullSizeParams = {
      Bucket: BUCKET_NAME,
      Key: fullSizeKey,
      Body: fullSizeBuffer,
      ContentType: "image/webp",
    };

    // Upload small image to S3
    const smallSizeParams = {
      Bucket: BUCKET_NAME,
      Key: smallSizeKey,
      Body: smallSizeBuffer,
      ContentType: "image/webp",
    };

    // Execute both uploads
    console.log("🚀 Starting S3 uploads...", {
      fullSizeKey,
      smallSizeKey,
      bucket: BUCKET_NAME,
    });

    let fullSizeResult, smallSizeResult;
    try {
      [fullSizeResult, smallSizeResult] = await Promise.all([
        s3.send(new PutObjectCommand(fullSizeParams)),
        s3.send(new PutObjectCommand(smallSizeParams)),
      ]);

      console.log("✅ S3 Upload Results:", {
        fullSizeETag: fullSizeResult.ETag,
        smallSizeETag: smallSizeResult.ETag,
      });
    } catch (s3Error) {
      console.error("❌ S3 Upload Error:", s3Error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload to S3",
        error: s3Error instanceof Error ? s3Error.message : "S3 upload failed",
      });
    }

    // Generate URLs for both images
    const fullSizeUrl = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${fullSizeKey}`;
    const smallSizeUrl = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${smallSizeKey}`;

    // Generate presigned URLs (valid for 24 hours for profile images)
    const fullSizePresignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fullSizeKey,
      }),
      { expiresIn: 86400 }
    );

    const smallSizePresignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: smallSizeKey,
      }),
      { expiresIn: 86400 }
    );

    console.log("✅ Profile Avatar Upload Success:", {
      userId,
      originalSize: req.file.size,
      fullSizeKey,
      smallSizeKey,
      bucketName: BUCKET_NAME,
      region: BUCKET_REGION,
      uploadedAt: new Date().toISOString(),
    });

    console.log("🔗 Generated URLs:", {
      fullSize: {
        direct: fullSizeUrl,
        presigned: fullSizePresignedUrl,
      },
      small: {
        direct: smallSizeUrl,
        presigned: smallSizePresignedUrl,
      },
    });

    // Update user's avatar URLs in database
    try {
      await User.findByIdAndUpdate(userId, {
        avatar: {
          fullSize: fullSizeUrl,
          small: smallSizeUrl,
        },
        // Maintain legacy field for backward compatibility
        avatarUrl: smallSizeUrl,
      });
      console.log("✅ User avatar URLs updated in database:", {
        userId,
        avatar: {
          fullSize: fullSizeUrl,
          small: smallSizeUrl,
        },
      });
    } catch (dbError) {
      console.error("❌ Failed to update user avatar URLs:", dbError);
      // Don't fail the request if DB update fails, images are already uploaded
    }

    return res.status(200).json({
      message: "Profile avatar uploaded successfully!",
      urls: {
        fullSize: {
          direct: fullSizeUrl,
          presigned: fullSizePresignedUrl,
        },
        small: {
          direct: smallSizeUrl,
          presigned: smallSizePresignedUrl,
        },
      },
      metadata: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: "image/webp", // Output format
        dimensions: {
          fullSize: {
            maxWidth: 1200,
            maxHeight: 1200,
          },
          small: {
            width: 300,
            height: 300,
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Profile Avatar Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload profile avatar",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Profile Banner Upload Endpoint
 * Uploads user profile banner image with automatic resizing
 * Creates both full-size and small (800x200) versions
 */

router.post("/profile/banner", upload.single("banner"), async (req, res) => {
  try {
    console.log("🔧 S3 Configuration:", {
      bucket: BUCKET_NAME,
      region: BUCKET_REGION,
      hasAccessKey: !!BUCKET_ACCESS_KEY,
      hasSecretKey: !!BUCKET_SECRET_ACCESS_KEY,
    });

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No banner file uploaded",
      });
    }

    // Extract userId from authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or invalid token",
      });
    }

    const token = authHeader.split(" ")[1];
    let userId: string;

    try {
      const payload = verifyAccess(token as string);
      if (payload.type !== "access") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token type",
        });
      }
      userId = payload.sub;
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
    }

    // Validate file type
    if (!req.file.mimetype.startsWith("image/")) {
      return res.status(400).json({
        success: false,
        message: "Only image files are allowed",
      });
    }

    const timestamp = Date.now();
    const fileExtension = req.file.originalname.split(".").pop();

    // Define S3 keys for both versions (using WebP for better quality/compression)
    const fullSizeKey = `profile-images/${userId}/profileBanner.webp`;
    const smallSizeKey = `profile-images/${userId}/profileBannerSmall.webp`;

    // Process images with Sharp
    let fullSizeBuffer: Buffer;
    let smallSizeBuffer: Buffer;

    try {
      // Create full-size version (high quality, maintain aspect ratio)
      fullSizeBuffer = await sharp(req.file.buffer)
        .resize(1200, 675, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({
          quality: 92,
          effort: 6, // Higher effort for better compression
        })
        .toBuffer();

      // Create small version (high quality for crisp small displays)
      smallSizeBuffer = await sharp(req.file.buffer)
        .resize(800, 450, {
          fit: "cover",
          position: "center",
        })
        .webp({
          quality: 90,
          effort: 6,
        })
        .toBuffer();
    } catch (imageError) {
      console.error("❌ Image Processing Error:", imageError);
      return res.status(400).json({
        success: false,
        message: "Failed to process image",
        error:
          imageError instanceof Error
            ? imageError.message
            : "Image processing failed",
      });
    }

    // Upload full-size image to S3
    const fullSizeParams = {
      Bucket: BUCKET_NAME,
      Key: fullSizeKey,
      Body: fullSizeBuffer,
      ContentType: "image/webp",
    };

    // Upload small image to S3
    const smallSizeParams = {
      Bucket: BUCKET_NAME,
      Key: smallSizeKey,
      Body: smallSizeBuffer,
      ContentType: "image/webp",
    };

    // Execute both uploads
    console.log("🚀 Starting S3 uploads...", {
      fullSizeKey,
      smallSizeKey,
      bucket: BUCKET_NAME,
    });

    let fullSizeResult, smallSizeResult;
    try {
      [fullSizeResult, smallSizeResult] = await Promise.all([
        s3.send(new PutObjectCommand(fullSizeParams)),
        s3.send(new PutObjectCommand(smallSizeParams)),
      ]);

      console.log("✅ S3 Upload Results:", {
        fullSizeETag: fullSizeResult.ETag,
        smallSizeETag: smallSizeResult.ETag,
      });
    } catch (s3Error) {
      console.error("❌ S3 Upload Error:", s3Error);
      return res.status(500).json({
        success: false,
        message: "Failed to upload to S3",
        error: s3Error instanceof Error ? s3Error.message : "S3 upload failed",
      });
    }

    // Generate URLs for both images
    const fullSizeUrl = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${fullSizeKey}`;
    const smallSizeUrl = `https://${BUCKET_NAME}.s3.${BUCKET_REGION}.amazonaws.com/${smallSizeKey}`;

    // Generate presigned URLs (valid for 24 hours for profile images)
    const fullSizePresignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fullSizeKey,
      }),
      { expiresIn: 86400 }
    );

    const smallSizePresignedUrl = await getSignedUrl(
      s3,
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: smallSizeKey,
      }),
      { expiresIn: 86400 }
    );

    console.log("✅ Profile Banner Upload Success:", {
      userId,
      originalSize: req.file.size,
      fullSizeKey,
      smallSizeKey,
      bucketName: BUCKET_NAME,
      region: BUCKET_REGION,
      uploadedAt: new Date().toISOString(),
    });

    console.log("🔗 Generated URLs:", {
      fullSize: {
        direct: fullSizeUrl,
        presigned: fullSizePresignedUrl,
      },
      small: {
        direct: smallSizeUrl,
        presigned: smallSizePresignedUrl,
      },
    });

    // Update user's banner URLs in database
    try {
      await User.findByIdAndUpdate(userId, {
        banner: {
          fullSize: fullSizeUrl,
          small: smallSizeUrl,
        },
        // Maintain legacy field for backward compatibility
        bannerUrl: smallSizeUrl,
      });
      console.log("✅ User banner URLs updated in database:", {
        userId,
        banner: {
          fullSize: fullSizeUrl,
          small: smallSizeUrl,
        },
      });
    } catch (dbError) {
      console.error("❌ Failed to update user banner URLs:", dbError);
      // Don't fail the request if DB update fails, images are already uploaded
    }

    return res.status(200).json({
      message: "Profile banner uploaded successfully!",
      urls: {
        fullSize: {
          direct: fullSizeUrl,
          presigned: fullSizePresignedUrl,
        },
        small: {
          direct: smallSizeUrl,
          presigned: smallSizePresignedUrl,
        },
      },
      metadata: {
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: "image/webp", // Output format
        dimensions: {
          fullSize: {
            maxWidth: 1200,
            maxHeight: 675,
          },
          small: {
            width: 800,
            height: 450,
          },
        },
      },
    });
  } catch (error) {
    console.error("❌ Profile Banner Upload Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload profile banner",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * PUT /profile
 * Update user profile details (excluding password and email)
 * Only allows users to update their own profile
 */
router.put("/profile", async (req, res) => {
  try {
    // Validate request body
    const validatedData = UpdateProfileSchema.parse(req.body);

    // Extract userId from authentication token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Missing or invalid token",
      });
    }

    const token = authHeader.split(" ")[1];
    let userId: string;

    try {
      const payload = verifyAccess(token as string);
      if (payload.type !== "access") {
        return res.status(401).json({
          success: false,
          message: "Unauthorized: Invalid token type",
        });
      }
      userId = payload.sub;
    } catch (tokenError) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Invalid token",
      });
    }

    // Verify user exists
    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Prepare update data (only include provided fields)
    const updateData: any = {};

    if (validatedData.name !== undefined) {
      updateData.name = validatedData.name;
    }

    if (validatedData.dob !== undefined) {
      // Convert date string to Date object if provided
      // Handle date properly to avoid timezone issues
      const dateString = validatedData.dob;
      if (dateString) {
        // Parse as YYYY-MM-DD and create date at noon UTC to avoid timezone issues
        const dateParts = dateString.split("-").map(Number);
        if (dateParts.length === 3 && dateParts.every((num) => !isNaN(num))) {
          const year = dateParts[0]!;
          const month = dateParts[1]!;
          const day = dateParts[2]!;
          updateData.dob = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        }
      } else {
        updateData.dob = null;
      }
    }

    if (validatedData.gender !== undefined) {
      updateData.gender = validatedData.gender;
    }

    if (validatedData.phone !== undefined) {
      updateData.phone = validatedData.phone;
    }

    // Update user in database
    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true, // Return updated document
      runValidators: true, // Run mongoose validators
    });

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to update profile",
      });
    }

    console.log("✅ Profile updated successfully:", {
      userId,
      updatedFields: Object.keys(updateData),
    });

    // Return updated user data (excluding sensitive fields)
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        dob: updatedUser.dob,
        gender: updatedUser.gender,
        phone: updatedUser.phone,
        groups: updatedUser.groups,
        // New structured avatar/banner fields
        avatar: updatedUser.avatar || { fullSize: null, small: null },
        banner: updatedUser.banner || { fullSize: null, small: null },
        // Legacy fields for backward compatibility
        avatarUrl: updatedUser.avatarUrl,
        bannerUrl: updatedUser.bannerUrl,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: "Invalid request data",
        errors: error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    console.error("❌ Profile Update Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
