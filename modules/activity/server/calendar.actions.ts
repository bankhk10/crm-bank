"use server";

import {
  listActivityCalendarEventsUseCase,
  type ListCalendarEventsParams,
} from "../infrastructure/calendar-integration";

function serialize<T>(data: T): T {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Server Action for fetching activity calendar events within a specified date range and filters.
 */
export async function getActivityCalendarEventsAction(
  params: ListCalendarEventsParams = {},
) {
  try {
    const events = await listActivityCalendarEventsUseCase(params);
    return serialize({ success: true, events });
  } catch (err: any) {
    return serialize({
      success: false,
      error: err.message || "เกิดข้อผิดพลาดในการดึงข้อมูลปฏิทิน",
      events: [],
    });
  }
}

