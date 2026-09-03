import { db } from "@/lib/db";
import {
  Prisma,
  CalendarEventStatus,
  CalendarAttendeeRole,
  CalendarAttendeeStatus,
  ActivityHelperStatus,
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
  employee?: { name: string; userId?: string | null };
}

/**
 * Synchronizes an approved Activity Plan to the ActivityCalendarEvent database entity.
 * Creates/Updates the event and registers both the Plan Creator and all approved Helper employees as attendees.
 * Prevents duplicate events by using activityPlanId unique constraint.
 */
export async function syncActivityPlanToCalendarUseCase(
  plan: SyncCalendarPlanInput,
  tx: Prisma.TransactionClient | typeof db = db,
) {
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
      status: CalendarEventStatus.SCHEDULED,
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
      status: CalendarEventStatus.SCHEDULED,
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

  // 3. Upsert Approved Helper Attendees
  const approvedHelpers = await tx.activityHelper.findMany({
    where: {
      activityPlanId: plan.id,
      status: ActivityHelperStatus.APPROVED,
      deletedAt: null,
    },
  });

  for (const helper of approvedHelpers) {
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
        status: CalendarAttendeeStatus.INVITED,
      },
      update: {
        role: CalendarAttendeeRole.HELPER,
      },
    });
  }

  return {
    success: true,
    eventId: event.id,
    attendeesCount: 1 + approvedHelpers.length,
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

export interface ListCalendarEventsParams {
  employeeId?: string;
  startDate?: Date;
  endDate?: Date;
  status?: CalendarEventStatus;
  viewAll?: boolean;
}

/**
 * List calendar events for a specific user/employee or team.
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
      (where.AND as any[]).push({ endDate: { gte: params.startDate } });
    }
    if (params.endDate) {
      (where.AND as any[]).push({ startDate: { lte: params.endDate } });
    }
  }

  if (params.employeeId && !params.viewAll) {
    where.OR = [
      { employeeId: params.employeeId },
      { attendees: { some: { employeeId: params.employeeId } } },
    ];
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
          title: true,
          status: true,
          totalBudgetApproved: true,
          activityType: { select: { name: true, code: true } },
          workTypes: { select: { activityType: { select: { name: true, code: true } } } },
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
