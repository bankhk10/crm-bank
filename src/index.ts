/**
 * Source Module
 * Main entry point for the refactored codebase
 *
 * This module provides centralized exports for:
 * - Core business logic (src/core)
 * - Shared utilities and types (src/shared)
 * - Infrastructure services (src/infrastructure)
 *
 * Usage:
 * import { allocateStock, formatCurrency, prisma } from "@/src";
 */

// Shared utilities, constants, and types
export * from "./shared";

// Infrastructure - explicitly export to avoid naming conflicts
export { prisma, db } from "./infrastructure/database";
