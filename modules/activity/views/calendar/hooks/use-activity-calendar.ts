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
  DayEventsSelection,
} from "../types/calendar.types";

export function useActivityCalendar(filterState: CalendarFilterState) {
  const { data: session } = useSession();
  const currentEmployeeId = session?.user?.employeeId;

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

      if (res.success && Array.isArray(res.events)) {
        setEvents(res.events as CalendarEvent[]);
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
      // 1. Tab filter
      if (filter === "MY_EVENTS") {
        const isCreator =
          e.attendees?.some(
            (a: any) => a.role === "CREATOR" && a.employeeId === e.employeeId,
          ) ||
          (currentEmployeeId && e.employeeId === currentEmployeeId);
        if (!isCreator) return false;
      } else if (filter === "HELPER_EVENTS") {
        const isHelper = e.attendees?.some((a: any) => a.role === "HELPER");
        if (!isHelper) return false;
      }

      // 2. Shared Multi-select and Search logic
      return matchesActivityFilters(e, {
        workTypes: workTypeFilters,
        personIds: personFilters,
        statuses: statusFilters,
        searchQuery: searchKeyword,
      });
    });
  }, [events, filterState, currentEmployeeId]);

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
  };
}

