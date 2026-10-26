"use client";

import React, { useEffect } from "react";
import { useCalendarFilters, useActivityCalendar } from "./hooks";
import {
  CalendarHeader,
  CalendarFilterBar,
  CalendarGrid,
  CalendarEventModal,
  CalendarDayEventsModal,
} from "./components";

/**
 * ActivityCalendarView - Orchestrator View for Activity Calendar (/activity-plans/calendar)
 *
 * Coordinates calendar state, filtering, grid rendering, and modal details.
 * Modularized according to CRM Coding Standards (Vertical Slice Architecture).
 */
export function ActivityCalendarView() {
  // 1. Filter Hook (options, search, multi-selects)
  const filterState = useCalendarFilters();

  // 2. Calendar Core Hook (dates, events, fetch, day calculation, selection)
  const {
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
  } = useActivityCalendar(filterState);

  // 3. Sync loaded events into filterState for attendee options
  useEffect(() => {
    filterState.syncAttendeeOptions(events);
  }, [events, filterState.syncAttendeeOptions]);

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Navigation Controls */}
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
      />

      {/* 2. Filter Bar (Tabs, Search, Multi-selects) */}
      <CalendarFilterBar
        filterState={filterState}
        loading={loading}
        totalEventsCount={events.length}
        filteredEventsCount={filteredEvents.length}
      />

      {/* 3. Monthly Calendar Grid */}
      <CalendarGrid
        calendarDays={calendarDays}
        currentDate={currentDate}
        getEventsForDay={getEventsForDay}
        onSelectDay={(day, dayEvents) =>
          setSelectedDayEvents({ day, events: dayEvents })
        }
        onSelectEvent={setSelectedEvent}
      />

      {/* 4. Single Event Details Modal */}
      <CalendarEventModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      {/* 5. Day Events List Modal (for mobile or crowded dates) */}
      <CalendarDayEventsModal
        selection={selectedDayEvents}
        onClose={() => setSelectedDayEvents(null)}
        onSelectEvent={setSelectedEvent}
      />
    </div>
  );
}
