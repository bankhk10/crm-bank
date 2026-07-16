/**
 * Data Scope Helper - Central data access filtering
 *
 * Replaces duplicated "Permission-based filtering" blocks across API routes.
 * Each resource has a different ownership model, configured via ResourceScopeConfig.
 *
 * Usage:
 *   import { applyDataScope, RESOURCE_CONFIGS } from "@/lib/data-scope";
 *
 *   const where = { deletedAt: null };
 *   await applyDataScope(where, session, "sale");
 */

import type { Session } from "next-auth";
import type {
  DataAccessLevel,
  EditAccessLevel,
  DeleteAccessLevel,
} from "@/lib/db";
import { db } from "@/lib/db";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Describes how a Prisma model can be filtered to the "own", "team" or "department"
 * level. Different models use different fields/relations for this purpose.
 */
export interface ResourceScopeConfig {
  /** RBAC resource key used in dataAccessByResource (e.g. "sale", "customer") */
  resource: string;

  /**
   * Strategy for VIEW_OWN filtering.
   *
   * - "employeeId"  → where.employeeId = session.user.employeeId
   *   (Used by Sale, SalesTarget, SalesForecast)
   *
   * - "responsibleEmployeeId" → where.responsibleEmployeeId = session.user.employeeId
   *   (Used by Customer)
   *
   * - "createdById" → where.createdById = session.user.id
   *   (Used by models without an explicit employee field)
   *
   * - "nestedCustomerEmployee" → where.customer.responsibleEmployeeId = ...
   *   (Used by CreditLimit, TemporaryCreditLimit where the owner is the
   *    employee responsible for the *customer*, not the record itself)
   */
  ownStrategy:
    | "employeeId"
    | "responsibleEmployeeId"
    | "createdById"
    | "nestedCustomerEmployee";

  /**
   * Strategy for VIEW_TEAM filtering.
   *
   * - "employeeTeam" → where.employeeId = { in: teamEmployeeIds }
   *   (Sale – has direct employee relation)
   *
   * - "responsibleEmployeeTeam" → where.responsibleEmployeeId = { in: teamEmployeeIds }
   *   (Customer)
   *
   * - "nestedCustomerTeam" → where.customer.responsibleEmployeeId = { in: teamEmployeeIds }
   *   (CreditLimit, TemporaryCreditLimit)
   *
   * - "createdByTeam" → uses own filter (no team concept for non-employee models)
   *
   * - "none" → No team filtering available (fallback to own)
   */
  teamStrategy:
    | "employeeTeam"
    | "responsibleEmployeeTeam"
    | "nestedCustomerTeam"
    | "createdByTeam"
    | "none";

  /**
   * Strategy for VIEW_DEPARTMENT filtering.
   *
   * - "employeeDepartment" → where.employee.departmentId = session.user.departmentId
   *   (Sale – has direct employee relation)
   *
   * - "directDepartment" → where.departmentId = session.user.departmentId
   *   (Employee – has own departmentId)
   *
   * - "responsibleEmployeeDepartment" → where.responsibleEmployee.departmentId = ...
   *   (Customer)
   *
   * - "nestedCustomerDepartment" → where.customer.responsibleEmployee.departmentId = ...
   *   (CreditLimit, TemporaryCreditLimit)
   *
   * - "none" → No department filtering available (fallback to own)
   */
  departmentStrategy:
    | "employeeDepartment"
    | "directDepartment"
    | "responsibleEmployeeDepartment"
    | "nestedCustomerDepartment"
    | "none";

  /**
   * Fallback field when user doesn't have an employeeId profile.
   * Defaults to "createdById" if not specified.
   */
  fallbackOwnerField?: string;
}

// ---------------------------------------------------------------------------
// Predefined resource configurations
// ---------------------------------------------------------------------------

export const RESOURCE_CONFIGS: Record<string, ResourceScopeConfig> = {
  sale: {
    resource: "sale",
    ownStrategy: "employeeId",
    teamStrategy: "employeeTeam",
    departmentStrategy: "employeeDepartment",
    fallbackOwnerField: "createdById",
  },
  customer: {
    resource: "customer",
    ownStrategy: "responsibleEmployeeId",
    teamStrategy: "responsibleEmployeeTeam",
    departmentStrategy: "responsibleEmployeeDepartment",
    fallbackOwnerField: "createdById",
  },
  creditlimit: {
    resource: "creditlimit",
    ownStrategy: "nestedCustomerEmployee",
    teamStrategy: "nestedCustomerTeam",
    departmentStrategy: "nestedCustomerDepartment",
    fallbackOwnerField: "createdById",
  },
  temporary_creditlimit: {
    resource: "temporary_creditlimit",
    ownStrategy: "nestedCustomerEmployee",
    teamStrategy: "nestedCustomerTeam",
    departmentStrategy: "nestedCustomerDepartment",
    fallbackOwnerField: "createdById",
  },
  employee: {
    resource: "employee",
    ownStrategy: "createdById",
    teamStrategy: "none",
    departmentStrategy: "directDepartment",
  },
  product: {
    resource: "product",
    ownStrategy: "createdById",
    teamStrategy: "none",
    departmentStrategy: "none",
  },
  sales_target: {
    resource: "sales_target",
    ownStrategy: "employeeId",
    teamStrategy: "employeeTeam",
    departmentStrategy: "employeeDepartment",
  },
  sales_forecast: {
    resource: "sales_forecast",
    ownStrategy: "employeeId",
    teamStrategy: "employeeTeam",
    departmentStrategy: "employeeDepartment",
  },
  activity_plan: {
    resource: "activity_plan",
    ownStrategy: "employeeId",
    teamStrategy: "employeeTeam",
    departmentStrategy: "employeeDepartment",
    fallbackOwnerField: "createdById",
  },
};

// ---------------------------------------------------------------------------
// Team helpers
// ---------------------------------------------------------------------------

/**
 * Get all employee IDs in the same team as the current user.
 * "Team" = employees who share the same managerId, plus the manager themselves.
 * If the user IS a manager, the team includes all their direct reports.
 */
async function getTeamEmployeeIds(session: Session): Promise<string[]> {
  const employeeId = session.user.employeeId;
  if (!employeeId) return [];

  const managerId = session.user.managerId;

  // Find all employees who share the same manager
  // Also include the manager themselves in the team
  const teamMembers = await db.employee.findMany({
    where: {
      deletedAt: null,
      OR: [
        // Employees with the same manager (same team)
        ...(managerId ? [{ managerId: managerId }] : []),
        // The manager themselves
        ...(managerId ? [{ id: managerId }] : []),
        // If user IS a manager, include their direct reports
        { managerId: employeeId },
        // Always include the user themselves
        { id: employeeId },
      ],
    },
    select: { id: true },
  });

  return [...new Set(teamMembers.map((m) => m.id))];
}

// ---------------------------------------------------------------------------
// Core functions
// ---------------------------------------------------------------------------

/**
 * Apply data-scope filtering to a Prisma `where` clause based on the user's
 * DataAccessLevel for the given resource.
 *
 * Mutates `where` in-place and also returns it for chaining.
 *
 * @example
 * ```ts
 * const where: Prisma.SaleWhereInput = { deletedAt: null };
 * await applyDataScope(where, session, "sale");
 * const sales = await prisma.sale.findMany({ where });
 * ```
 */
export async function applyDataScope<T extends Record<string, any>>(
  where: T,
  session: Session,
  resourceKey: string,
  configOverride?: Partial<ResourceScopeConfig>,
): Promise<T> {
  const baseConfig = RESOURCE_CONFIGS[resourceKey];
  if (!baseConfig) {
    console.warn(
      `[data-scope] No config found for resource "${resourceKey}". Skipping data scope.`,
    );
    return where;
  }

  const config: ResourceScopeConfig = configOverride
    ? { ...baseConfig, ...configOverride }
    : baseConfig;

  const accessLevel = session.user.dataAccessByResource?.[config.resource] as
    | DataAccessLevel
    | undefined;

  switch (accessLevel) {
    case "VIEW_ALL":
      // No additional filter
      break;

    case "VIEW_DEPARTMENT":
      applyDepartmentFilter(where, session, config);
      break;

    case "VIEW_TEAM":
      await applyTeamFilter(where, session, config);
      break;

    case "VIEW_OWN":
    default:
      // Default to VIEW_OWN when access level is undefined
      applyOwnFilter(where, session, config);
      break;
  }

  return where;
}

/**
 * Apply edit-scope filtering. Similar to applyDataScope but uses EditAccessLevel.
 */
export async function applyEditScope<T extends Record<string, any>>(
  where: T,
  session: Session,
  resourceKey: string,
): Promise<T> {
  const baseConfig = RESOURCE_CONFIGS[resourceKey];
  if (!baseConfig) return where;

  const accessLevel = session.user.editAccessByResource?.[
    baseConfig.resource
  ] as EditAccessLevel | undefined;

  switch (accessLevel) {
    case "EDIT_ALL":
      break;
    case "EDIT_DEPARTMENT":
      applyDepartmentFilter(where, session, baseConfig);
      break;
    case "EDIT_TEAM":
      await applyTeamFilter(where, session, baseConfig);
      break;
    case "EDIT_OWN":
      applyOwnFilter(where, session, baseConfig);
      break;
    case "EDIT_NONE":
    default:
      // Deny all – add impossible filter
      (where as any).id = "__DENIED__";
      break;
  }

  return where;
}

/**
 * Apply delete-scope filtering. Similar to applyDataScope but uses DeleteAccessLevel.
 */
export async function applyDeleteScope<T extends Record<string, any>>(
  where: T,
  session: Session,
  resourceKey: string,
): Promise<T> {
  const baseConfig = RESOURCE_CONFIGS[resourceKey];
  if (!baseConfig) return where;

  const accessLevel = session.user.deleteAccessByResource?.[
    baseConfig.resource
  ] as DeleteAccessLevel | undefined;

  switch (accessLevel) {
    case "DELETE_ALL":
      break;
    case "DELETE_DEPARTMENT":
      applyDepartmentFilter(where, session, baseConfig);
      break;
    case "DELETE_TEAM":
      await applyTeamFilter(where, session, baseConfig);
      break;
    case "DELETE_OWN":
      applyOwnFilter(where, session, baseConfig);
      break;
    case "DELETE_NONE":
    default:
      (where as any).id = "__DENIED__";
      break;
  }

  return where;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function applyOwnFilter(
  where: Record<string, any>,
  session: Session,
  config: ResourceScopeConfig,
): void {
  const employeeId = session.user.employeeId;
  const userId = session.user.id;
  const fallback = config.fallbackOwnerField ?? "createdById";

  switch (config.ownStrategy) {
    case "employeeId":
      if (employeeId) {
        where.employeeId = employeeId;
      } else {
        where[fallback] = userId;
      }
      break;

    case "responsibleEmployeeId":
      if (employeeId) {
        where.responsibleEmployeeId = employeeId;
      } else {
        where[fallback] = userId;
      }
      break;

    case "createdById":
      where.createdById = userId;
      break;

    case "nestedCustomerEmployee":
      if (employeeId) {
        // Merge into existing customer where, preserving search/other filters
        where.customer = {
          ...(where.customer ?? {}),
          responsibleEmployeeId: employeeId,
        };
      } else {
        where[fallback] = userId;
      }
      break;
  }
}

async function applyTeamFilter(
  where: Record<string, any>,
  session: Session,
  config: ResourceScopeConfig,
): Promise<void> {
  const teamEmployeeIds = await getTeamEmployeeIds(session);

  // If no team found, fall back to own filter
  if (teamEmployeeIds.length === 0) {
    applyOwnFilter(where, session, config);
    return;
  }

  switch (config.teamStrategy) {
    case "employeeTeam":
      where.employeeId = { in: teamEmployeeIds };
      break;

    case "responsibleEmployeeTeam":
      where.responsibleEmployeeId = { in: teamEmployeeIds };
      break;

    case "nestedCustomerTeam":
      where.customer = {
        ...(where.customer ?? {}),
        responsibleEmployeeId: { in: teamEmployeeIds },
      };
      break;

    case "createdByTeam":
    case "none":
      // No team strategy – fall back to own filter
      applyOwnFilter(where, session, config);
      break;
  }
}

function applyDepartmentFilter(
  where: Record<string, any>,
  session: Session,
  config: ResourceScopeConfig,
): void {
  const departmentId = session.user.departmentId;

  // If user has no department, fall back to own filter
  if (!departmentId) {
    applyOwnFilter(where, session, config);
    return;
  }

  switch (config.departmentStrategy) {
    case "employeeDepartment":
      where.employee = {
        ...(where.employee ?? {}),
        departmentId,
      };
      break;

    case "directDepartment":
      where.departmentId = departmentId;
      break;

    case "responsibleEmployeeDepartment":
      where.responsibleEmployee = {
        ...(where.responsibleEmployee ?? {}),
        departmentId,
      };
      break;

    case "nestedCustomerDepartment":
      where.customer = {
        ...(where.customer ?? {}),
        responsibleEmployee: {
          departmentId,
        },
      };
      break;

    case "none":
      // No department strategy – fall back to own filter
      applyOwnFilter(where, session, config);
      break;
  }
}

// ---------------------------------------------------------------------------
// Convenience: check ownership for a single record
// ---------------------------------------------------------------------------

export interface OwnershipCheckOptions {
  resourceOwnerId?: string | null;
  resourceEmployeeId?: string | null;
  resourceDepartmentId?: string | null;
}

/**
 * Check if the current user can access a specific record based on their
 * data access level. Useful for single-record GET/PUT/DELETE endpoints.
 */
export async function canAccessRecord(
  session: Session,
  resourceKey: string,
  options: OwnershipCheckOptions,
): Promise<boolean> {
  const config = RESOURCE_CONFIGS[resourceKey];
  if (!config) return false;

  const accessLevel = session.user.dataAccessByResource?.[config.resource];

  switch (accessLevel) {
    case "VIEW_ALL":
      return true;
    case "VIEW_DEPARTMENT":
      return (
        session.user.departmentId === options.resourceDepartmentId ||
        session.user.id === options.resourceOwnerId ||
        session.user.employeeId === options.resourceEmployeeId
      );
    case "VIEW_TEAM": {
      // Check if owner/employee is in the same team
      const teamIds = await getTeamEmployeeIds(session);
      return (
        session.user.id === options.resourceOwnerId ||
        (!!options.resourceEmployeeId &&
          teamIds.includes(options.resourceEmployeeId))
      );
    }
    case "VIEW_OWN":
    default:
      return (
        session.user.id === options.resourceOwnerId ||
        session.user.employeeId === options.resourceEmployeeId
      );
  }
}
