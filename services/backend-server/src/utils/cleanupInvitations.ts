#!/usr/bin/env node
/**
 * INVITATION SYSTEM: Cleanup utility for expired invitations
 * This script can be run periodically to clean up expired invitations
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
import GroupInvitation from "../models/GroupInvitations.js";

dotenv.config();

async function cleanupExpiredInvitations() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI environment variable is not defined");
    }

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Run cleanup
    const result = await GroupInvitation.cleanupExpired();
    console.log(
      `Cleanup completed. Modified ${result.modifiedCount} expired invitations.`
    );

    // Close connection
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error during cleanup:", error);
    process.exit(1);
  }
}

// Run the cleanup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanupExpiredInvitations();
}
