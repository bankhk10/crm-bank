import { db } from "@/lib/db";
import {
  Prisma,
  CalendarEventStatus,
  CalendarAttendeeRole,
  CalendarAttendeeStatus,
  ActivityHelperStatus,
  ActivityResultStatus,
  ActivityPlanType,
  ActivityStatus,
} from "@prisma/client";

export interface SyncCalendarPlanInput {
  id: string;
  title: string;
  description?: string | null;
  objective?: string | null;
  location?: string | null;
  province?: string | null;
  district?: string | null;
  startDate: Date;
  endDate: Date;
  employeeId: string;
  createdById: string;
  planType?: ActivityPlanType | string;
  status?: ActivityStatus | string;
  employee?: { name: string; userId?: string | null };
}

/**
 * Synchronizes an approved or unplanned Activity Plan to the ActivityCalendarEvent database entity.
 * Creates/Updates the event and registers both the Plan Creator and Helper employees as attendees.
 * For unplanned activities (2-in-1), event status defaults to COMPLETED immediately.
 * Prevents duplicate events by using activityPlanId unique constraint.
 */
export async function syncActivityPlanToCalendarUseCase(
  plan: SyncCalendarPlanInput,
  tx: Prisma.TransactionClient | typeof db = db,
) {
  const isUnplanned =
    plan.planType === ActivityPlanType.UNPLANNED ||
    plan.planType === "UNPLANNED";

  const initialStatus = isUnplanned
    ? CalendarEventStatus.COMPLETED
    : CalendarEventStatus.SCHEDULED;

  // 1. Upsert Calendar Event
  const event = await tx.activityCalendarEvent.upsert({
    where: { activityPlanId: plan.id },
    create: {
      activityPlanId: plan.id,
      title: plan.title,
      description: plan.description || plan.objective || null,
      location: plan.location || null,
      province: plan.province || null,
      district: plan.district || null,
      startDate: plan.startDate,
      endDate: plan.endDate,
      status: initialStatus,
      createdById: plan.createdById,
      employeeId: plan.employeeId,
    },
    update: {
      title: plan.title,
      description: plan.description || plan.objective || null,
      location: plan.location || null,
      province: plan.province || null,
      district: plan.district || null,
      startDate: plan.startDate,
      endDate: plan.endDate,
      ...(isUnplanned ? { status: CalendarEventStatus.COMPLETED } : {}),
      deletedAt: null,
    },
  });

  // 2. Upsert Creator Attendee
  await tx.activityCalendarAttendee.upsert({
    where: {
      calendarEventId_employeeId: {
        calendarEventId: event.id,
        employeeId: plan.employeeId,
      },
    },
    create: {
      calendarEventId: event.id,
      employeeId: plan.employeeId,
      role: CalendarAttendeeRole.CREATOR,
      status: CalendarAttendeeStatus.ACCEPTED,
    },
    update: {
      role: CalendarAttendeeRole.CREATOR,
      status: CalendarAttendeeStatus.ACCEPTED,
    },
  });

  // 3. Upsert Helper Attendees (For unplanned activities, register helpers directly as ACCEPTED)
  const helperWhere: Prisma.ActivityHelperWhereInput = {
    activityPlanId: plan.id,
    deletedAt: null,
    ...(isUnplanned ? {} : { status: ActivityHelperStatus.APPROVED }),
  };

  const helpers = await tx.activityHelper.findMany({
    where: helperWhere,
  });

  for (const helper of helpers) {
    await tx.activityCalendarAttendee.upsert({
      where: {
        calendarEventId_employeeId: {
          calendarEventId: event.id,
          employeeId: helper.employeeId,
        },
      },
      create: {
        calendarEventId: event.id,
        employeeId: helper.employeeId,
        role: CalendarAttendeeRole.HELPER,
        status: isUnplanned
          ? CalendarAttendeeStatus.ACCEPTED
          : CalendarAttendeeStatus.INVITED,
      },
      update: {
        role: CalendarAttendeeRole.HELPER,
      },
    });
  }

  return {
    success: true,
    eventId: event.id,
    attendeesCount: 1 + helpers.length,
  };
}

/**
 * Marks calendar event as CANCELLED when an activity plan is rejected or cancelled.
 */
export async function cancelActivityPlanCalendarUseCase(
  activityPlanId: string,
  tx: Prisma.TransactionClient | typeof db = db,
) {
  return tx.activityCalendarEvent.updateMany({
    where: { activityPlanId },
    data: { status: CalendarEventStatus.CANCELLED },
  });
}

export interface SyncActivityResultOptions {
  postponedDate?: Date | null;
  postponedTime?: string | null;
}

/**
 * Synchronizes post-activity result (Actual) to ActivityCalendarEvent status and dates.
 * - COMPLETED / PARTIAL -> CalendarEventStatus.COMPLETED
 * - CANCELLED -> CalendarEventStatus.CANCELLED
 * - POSTPONED -> Keeps status SCHEDULED and reschedules startDate & endDate to postponedDate
 */
export async function syncActivityResultToCalendarUseCase(
  activityPlanId: string,
  resultStatus: ActivityResultStatus | string,
  tx: Prisma.TransactionClient | typeof db = db,
  options?: SyncActivityResultOptions,
) {
  let calendarStatus: CalendarEventStatus | null = null;

  if (
    resultStatus === ActivityResultStatus.COMPLETED ||
    resultStatus === ActivityResultStatus.PARTIAL ||
    resultStatus === ActivityResultStatus.FAILED
  ) {
    calendarStatus = CalendarEventStatus.COMPLETED;
  } else if (resultStatus === ActivityResultStatus.CANCELLED) {
    calendarStatus = CalendarEventStatus.CANCELLED;
  }

  if (calendarStatus) {
    return tx.activityCalendarEvent.updateMany({
      where: { activityPlanId },
      data: { status: calendarStatus },
    });
  }

  if (
    (resultStatus === ActivityResultStatus.POSTPONED ||
      resultStatus === "POSTPONED") &&
    options?.postponedDate
  ) {
    const newStartDate = new Date(options.postponedDate);
    if (options.postponedTime) {
      const [hh, mm] = options.postponedTime.split(":").map(Number);
      if (!isNaN(hh) && !isNaN(mm)) {
        newStartDate.setHours(hh, mm, 0, 0);
      }
    }

    const originalPlan = await tx.activityPlan.findUnique({
      where: { id: activityPlanId },
      select: { startDate: true, endDate: true },
    });
    let durationMs = 8 * 60 * 60 * 1000;
    if (originalPlan?.startDate && originalPlan?.endDate) {
      durationMs = Math.max(
        originalPlan.endDate.getTime() - originalPlan.startDate.getTime(),
        60 * 60 * 1000,
      );
    }
    const newEndDate = new Date(newStartDate.getTime() + durationMs);

    return tx.activityCalendarEvent.updateMany({
      where: { activityPlanId },
      data: {
        startDate: newStartDate,
        endDate: newEndDate,
        status: CalendarEventStatus.SCHEDULED,
      },
    });
  }

  return { count: 0 };
}

/**
 * Syncs any approved or unplanned activity plans that are currently missing a calendar event.
 * Acts as an idempotent, self-healing routine.
 */
export async function ensureCalendarEventsSyncedUseCase(
  tx: Prisma.TransactionClient | typeof db = db,
) {
  const unsyncedPlans = await tx.activityPlan.findMany({
    where: {
      deletedAt: null,
      calendarEvent: null,
      OR: [
        { status: ActivityStatus.APPROVED },
        { planType: ActivityPlanType.UNPLANNED },
      ],
    },
    select: {
      id: true,
      title: true,
      description: true,
      objective: true,
      location: true,
      province: true,
      district: true,
      startDate: true,
      endDate: true,
      createdById: true,
      employeeId: true,
      planType: true,
      status: true,
    },
  });

  for (const p of unsyncedPlans) {
    await syncActivityPlanToCalendarUseCase(p, tx);
  }

  // Also self-heal: sync calendar dates for any plans marked as POSTPONED with a postponedDate
  try {
    const postponedPlans = await tx.activityPlan.findMany({
      where: {
        deletedAt: null,
        result: {
          resultStatus: ActivityResultStatus.POSTPONED,
          postponedDate: { not: null },
        },
        calendarEvent: { isNot: null },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        result: {
          select: {
            postponedDate: true,
            postponedTime: true,
          },
        },
      },
    });

    for (const p of postponedPlans) {
      if (p.result?.postponedDate) {
        const newStartDate = new Date(p.result.postponedDate);
        if (p.result.postponedTime) {
          const [hh, mm] = p.result.postponedTime.split(":").map(Number);
          if (!isNaN(hh) && !isNaN(mm)) {
            newStartDate.setHours(hh, mm, 0, 0);
          }
        }
        let durationMs = 8 * 60 * 60 * 1000;
        if (p.startDate && p.endDate) {
          durationMs = Math.max(
            p.endDate.getTime() - p.startDate.getTime(),
            60 * 60 * 1000,
          );
        }
        const newEndDate = new Date(newStartDate.getTime() + durationMs);

        await tx.activityCalendarEvent.updateMany({
          where: { activityPlanId: p.id },
          data: {
            startDate: newStartDate,
            endDate: newEndDate,
            status: CalendarEventStatus.SCHEDULED,
          },
        });
      }
    }
  } catch (postponeSyncErr) {
    console.warn("[calendar-integration] Backfill postponed events warning:", postponeSyncErr);
  }

  return unsyncedPlans.length;
}

export interface ListCalendarEventsParams {
  employeeId?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  status?: CalendarEventStatus;
  viewAll?: boolean;
  teamEmployeeIds?: string[];
  departmentId?: string;
}

/**
 * List calendar events with RBAC Data Scope (VIEW_ALL, VIEW_DEPARTMENT, VIEW_TEAM, VIEW_OWN).
 */
export async function listActivityCalendarEventsUseCase(
  params: ListCalendarEventsParams,
) {
  const where: Prisma.ActivityCalendarEventWhereInput = {
    deletedAt: null,
  };

  if (params.status) {
    where.status = params.status;
  }

  if (params.startDate || params.endDate) {
    where.AND = [];
    if (params.startDate) {
      const s = typeof params.startDate === "string" ? new Date(params.startDate) : params.startDate;
      (where.AND as any[]).push({ endDate: { gte: s } });
    }
    if (params.endDate) {
      const e = typeof params.endDate === "string" ? new Date(params.endDate) : params.endDate;
      (where.AND as any[]).push({ startDate: { lte: e } });
    }
  }

  if (params.viewAll) {
    // VIEW_ALL: No restriction on employee/team/attendees
  } else if (params.departmentId) {
    // VIEW_DEPARTMENT: Includes events created by employees in department OR attended by dept employees
    const deptFilter = {
      OR: [
        { employee: { departmentId: params.departmentId } },
        { attendees: { some: { employee: { departmentId: params.departmentId } } } },
      ],
    };
    if (Array.isArray(where.AND)) {
      (where.AND as any[]).push(deptFilter);
    } else {
      where.AND = [deptFilter];
    }
  } else if (params.teamEmployeeIds && params.teamEmployeeIds.length > 0) {
    // VIEW_TEAM: Includes events created by team members OR attended by user/team
    const teamFilter = {
      OR: [
        { employeeId: { in: params.teamEmployeeIds } },
        { attendees: { some: { employeeId: { in: params.teamEmployeeIds } } } },
      ],
    };
    if (Array.isArray(where.AND)) {
      (where.AND as any[]).push(teamFilter);
    } else {
      where.AND = [teamFilter];
    }
  } else if (params.employeeId) {
    // VIEW_OWN: Includes events created by user OR where user is an attendee (Approved Helper)
    const ownFilter = {
      OR: [
        { employeeId: params.employeeId },
        { attendees: { some: { employeeId: params.employeeId } } },
      ],
    };
    if (Array.isArray(where.AND)) {
      (where.AND as any[]).push(ownFilter);
    } else {
      where.AND = [ownFilter];
    }
  } else {
    // Security guard: If no scope criteria provided, safely return empty
    return {
      success: true as const,
      events: [],
    };
  }

  const events = await db.activityCalendarEvent.findMany({
    where,
    include: {
      employee: {
        select: { id: true, name: true, positionTitle: true, departmentName: true },
      },
      activityPlan: {
        select: {
          id: true,
          code: true,
          planType: true,
          title: true,
          status: true,
          startDate: true,
          endDate: true,
          employeeId: true,
          totalBudgetApproved: true,
          activityType: { select: { id: true, name: true, code: true } },
          workTypes: {
            select: {
              id: true,
              activityTypeId: true,
              activityType: { select: { id: true, name: true, code: true } },
            },
          },
          type12Targets: true,
          result: {
            select: {
              id: true,
              resultStatus: true,
              postponedDate: true,
              postponedTime: true,
              postponedReason: true,
              postponedNotes: true,
            },
          },
        },
      },
      attendees: {
        include: {
          employee: {
            select: { id: true, name: true, positionTitle: true, departmentName: true },
          },
        },
      },
    },
    orderBy: { startDate: "asc" },
  });

  return {
    success: true as const,
    events,
  };
}
