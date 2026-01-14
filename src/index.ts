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

// Core business logic
export * from "./core";

// Shared utilities, constants, and types
export * from "./shared";

// Infrastructure - explicitly export to avoid naming conflicts
export { prisma, db } from "./infrastructure/database";
export {
  requireAuth,
  unauthorizedResponse,
  forbiddenResponse,
  badRequestResponse,
  notFoundResponse,
  internalErrorResponse,
  hasPermission,
  // Renamed to avoid conflict with rbac.service exports
  hasAnyPermission as hasAnySessionPermission,
  hasAllPermissions as hasAllSessionPermissions,
  type ApiContext,
} from "./infrastructure/auth";
