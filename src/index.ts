/**
 * Source Module
 * Main entry point for the refactored codebase
 */

// Shared utilities, constants, and types
export * from "./shared";

// Infrastructure
export { prisma, db } from "@/lib/db";
