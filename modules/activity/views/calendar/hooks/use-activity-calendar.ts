"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
} from "date-fns";
import { getActivityCalendarEventsAction } from "@/modules/activity/server/calendar.actions";
import { matchesActivityFilters } from "@/modules/activity/constants";
import {
  CalendarEvent,
  CalendarFilterState,
  CalendarScopeCounts,
  DayEventsSelection,
} from "../types/calendar.types";

/**
 * Determine if the event belongs to the current user as creator
 */
function isOwnCalendarEvent(
  e: CalendarEvent,
  currentEmployeeId?: string | null,
  currentUserId?: string | null,
): boolean {
  if (
    currentEmployeeId &&
    (e.employeeId === currentEmployeeId ||
      e.activityPlan?.employeeId === currentEmployeeId)
  ) {
    return true;
  }
  if (
    currentUserId &&
    (e.createdById === currentUserId ||
      (e.activityPlan as any)?.createdById === currentUserId)
  ) {
    return true;
  }
  if (
    currentEmployeeId &&
    e.attendees?.some(
      (a: any) =>
        a.role === "CREATOR" &&
        (a.employeeId === currentEmployeeId ||
          a.employee?.id === currentEmployeeId),
    )
  ) {
    return true;
  }
  return false;
}

/**
 * Determine if the current user participated in the event as a helper
 */
function isHelperCalendarEvent(
  e: CalendarEvent,
  currentEmployeeId?: string | null,
  isOwn?: boolean,
): boolean {
  if (isOwn) return false;
  if (
    currentEmployeeId &&
    e.attendees?.some(
      (a: any) =>
        a.role === "HELPER" &&
        (a.employeeId === currentEmployeeId ||
          a.employee?.id === currentEmployeeId),
    )
  ) {
    return true;
  }
  return false;
}

export function useActivityCalendar(filterState: CalendarFilterState) {
  const { data: session } = useSession();
  const currentEmployeeId = session?.user?.employeeId;
  const currentUserId = session?.user?.id;

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] =
    useState<DayEventsSelection | null>(null);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const monthStart = startOfWeek(startOfMonth(currentDate), {
        weekStartsOn: 0,
      });
      const monthEnd = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });

      const res = await getActivityCalendarEventsAction({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
      });

      if (res.success) {
        const rawEvents = Array.isArray(res.events)
          ? res.events
          : Array.isArray((res as any)?.events?.events)
          ? (res as any).events.events
          : [];
        setEvents(rawEvents as CalendarEvent[]);
      }
    } catch (err) {
      console.error("Failed to load calendar events:", err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Calendar Grid generation
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Calculate Scope Counts (Own vs Team vs Helper vs All) matching other active filters
  const scopeCounts = useMemo<CalendarScopeCounts>(() => {
    let own = 0;
    let team = 0;
    let helper = 0;
    let all = 0;

    for (const e of events) {
      // Must match search & multi-select filters
      const matchesOther = matchesActivityFilters(e, {
        workTypes: filterState.workTypeFilters,
        personIds: filterState.personFilters,
        statuses: filterState.statusFilters,
        searchQuery: filterState.searchKeyword,
      });
      if (!matchesOther) continue;

      all++;
      const isOwn = isOwnCalendarEvent(e, currentEmployeeId, currentUserId);
      if (isOwn) {
        own++;
        continue;
      }

      const isHelper = isHelperCalendarEvent(e, currentEmployeeId, isOwn);
      if (isHelper) {
        helper++;
        continue;
      }

      team++;
    }

    return { own, team, helper, all };
  }, [
    events,
    filterState.workTypeFilters,
    filterState.personFilters,
    filterState.statusFilters,
    filterState.searchKeyword,
    currentEmployeeId,
    currentUserId,
  ]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    const {
      filter,
      workTypeFilters,
      personFilters,
      statusFilters,
      searchKeyword,
    } = filterState;

    return events.filter((e) => {
      // 1. Tab / Scope filter (OWN vs TEAM vs HELPER vs ALL)
      const isOwn = isOwnCalendarEvent(e, currentEmployeeId, currentUserId);
      const isHelper = isHelperCalendarEvent(e, currentEmployeeId, isOwn);
      const isTeam = !isOwn && !isHelper;

      if (filter === "OWN" || filter === "MY_EVENTS") {
        if (!isOwn) return false;
      } else if (filter === "HELPER" || filter === "HELPER_EVENTS") {
        if (!isHelper) return false;
      } else if (filter === "TEAM") {
        if (!isTeam) return false;
      }
      // "ALL" permits all events

      // 2. Shared Multi-select and Search logic
      return matchesActivityFilters(e, {
        workTypes: workTypeFilters,
        personIds: personFilters,
        statuses: statusFilters,
        searchQuery: searchKeyword,
      });
    });
  }, [events, filterState, currentEmployeeId, currentUserId]);

  const getEventsForDay = useCallback(
    (day: Date) => {
      return filteredEvents.filter((e) => {
        const evStart = new Date(e.startDate);
        const evEnd = new Date(e.endDate);
        const dayStart = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          0,
          0,
          0,
        );
        const dayEnd = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate(),
          23,
          59,
          59,
        );
        return evStart <= dayEnd && evEnd >= dayStart;
      });
    },
    [filteredEvents],
  );

  return {
    currentDate,
    setCurrentDate,
    events,
    filteredEvents,
    loading,
    calendarDays,
    getEventsForDay,
    selectedEvent,
    setSelectedEvent,
    selectedDayEvents,
    setSelectedDayEvents,
    fetchEvents,
    scopeCounts,
  };
}
