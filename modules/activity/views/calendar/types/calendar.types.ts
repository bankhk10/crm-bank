import { MultiSelectOption } from "@/components/custom/multi-select";

export type CalendarFilter =
  | "ALL"
  | "OWN"
  | "TEAM"
  | "HELPER"
  | "MY_EVENTS"
  | "HELPER_EVENTS";

export interface CalendarScopeCounts {
  own: number;
  team: number;
  helper: number;
  all: number;
}

export interface CalendarAttendee {
  id?: string;
  calendarEventId?: string;
  employeeId: string;
  role: "CREATOR" | "HELPER" | string;
  status?: string;
  employee?: {
    id: string;
    name: string;
    positionTitle?: string | null;
    departmentName?: string | null;
  } | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  province?: string | null;
  district?: string | null;
  startDate: string | Date;
  endDate: string | Date;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | string;
  activityPlanId?: string | null;
  employeeId: string;
  createdById?: string | null;
  employee?: {
    id: string;
    name: string;
    positionTitle?: string | null;
    departmentName?: string | null;
  } | null;
  activityPlan?: {
    id: string;
    code?: string | null;
    planType?: string | null;
    title?: string | null;
    status?: string | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    employeeId?: string | null;
    createdById?: string | null;
    totalBudgetApproved?: number | null;
    activityType?: { id: string; name: string; code: string } | null;
    workTypes?: Array<{
      id: string;
      activityTypeId: string;
      activityType: { id: string; name: string; code: string };
    }>;
    type12Targets?: any[];
    result?: {
      id: string;
      resultStatus: string;
      postponedDate?: string | Date | null;
      postponedTime?: string | null;
      postponedReason?: string | null;
      postponedNotes?: string | null;
    } | null;
  } | null;
  attendees?: CalendarAttendee[];
}

export interface DayEventsSelection {
  day: Date;
  events: CalendarEvent[];
}

export interface CalendarFilterState {
  filter: CalendarFilter;
  setFilter: (f: CalendarFilter) => void;
  workTypeFilters: string[];
  setWorkTypeFilters: (v: string[]) => void;
  personFilters: string[];
  setPersonFilters: (v: string[]) => void;
  statusFilters: string[];
  setStatusFilters: (v: string[]) => void;
  searchKeyword: string;
  setSearchKeyword: (v: string) => void;
  workTypeOptions: MultiSelectOption[];
  personOptions: MultiSelectOption[];
  hasActiveFilters: boolean;
  handleClearAllFilters: () => void;
}
