"use server";

import { auth } from "@/modules/auth/infrastructure/next-auth";
import { getTeamEmployeeIds } from "@/lib/data-scope";
import type { DataAccessLevel } from "@/lib/db";
import { findOrCreateEmployeeForUser } from "../infrastructure/employee-lookup.repository";
import {
  listActivityCalendarEventsUseCase,
  ensureCalendarEventsSyncedUseCase,
  type ListCalendarEventsParams,
} from "../infrastructure/calendar-integration";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Server Action for fetching activity calendar events within a specified date range and filters.
 * Applies RBAC and Data Scope (VIEW_ALL, VIEW_DEPARTMENT, VIEW_TEAM, VIEW_OWN).
 */
export async function getActivityCalendarEventsAction(
  params: ListCalendarEventsParams = {},
) {
  const session = await auth();
  if (!session?.user) {
    return serialize({
      success: false,
      error: "Unauthorized: กรุณาเข้าสู่ระบบ",
      events: [],
    });
  }

  try {
    // 1. Backfill any unsynced calendar events (self-healing for unplanned / approved plans)
    try {
      await ensureCalendarEventsSyncedUseCase();
    } catch (backfillErr) {
      console.warn("[calendar.actions] Backfill warning:", backfillErr);
    }

    // 2. Resolve roles and data access scope
    const roles = session.user.roles ?? [];
    const isSuperAdmin =
      roles.includes("administrator") ||
      roles.includes("admin") ||
      roles.includes("ceo") ||
      (session.user as any)?.role === "administrator" ||
      (session.user as any)?.role === "ADMIN";

    const accessLevel = session.user.dataAccessByResource?.["activity_plan"] as
      | DataAccessLevel
      | undefined;

    let currentEmployeeId: string | undefined = session.user.employeeId ?? undefined;
    if (!currentEmployeeId && session.user.id) {
      const emp = await findOrCreateEmployeeForUser(
        session.user.id,
        session.user.name ?? undefined,
        session.user.email ?? undefined,
      );
      currentEmployeeId = emp?.id ?? undefined;
    }

    let viewAll = false;
    let teamEmployeeIds: string[] | undefined;
    let departmentId: string | undefined;

    if (isSuperAdmin || accessLevel === "VIEW_ALL") {
      viewAll = true;
    } else if (accessLevel === "VIEW_DEPARTMENT" && session.user.departmentId) {
      departmentId = session.user.departmentId;
    } else if (accessLevel === "VIEW_TEAM") {
      teamEmployeeIds = await getTeamEmployeeIds(session);
      if (teamEmployeeIds.length === 0 && currentEmployeeId) {
        teamEmployeeIds = [currentEmployeeId];
      }
    } else {
      // Default to VIEW_OWN
      if (!currentEmployeeId) {
        return serialize({
          success: true,
          events: [],
        });
      }
    }

    const result = await listActivityCalendarEventsUseCase({
      ...params,
      viewAll,
      departmentId,
      teamEmployeeIds,
      employeeId: currentEmployeeId,
    });

    return serialize({ success: true, events: result.events || [] });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทิน",
      events: [],
    });
  }
}
