"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { MultiSelectOption } from "@/components/custom/multi-select";
import { getActivityTypesAction } from "@/modules/activity/server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { WORK_TYPE_CONFIG } from "@/modules/activity/constants";
import { getDefaultActivityPlanViewScope } from "@/modules/activity/domain/permissions";
import {
  CalendarFilter,
  CalendarEvent,
  CalendarFilterState,
} from "../types/calendar.types";

export function useCalendarFilters(): CalendarFilterState & {
  syncAttendeeOptions: (events: CalendarEvent[]) => void;
} {
  const { data: session } = useSession();
  const user = session?.user;

  const [filter, setFilter] = useState<CalendarFilter>(() =>
    getDefaultActivityPlanViewScope(user),
  );
  const initializedScopeUserRef = useRef<string | null>(user?.id ?? null);

  // Sync default view scope once user session resolves
  useEffect(() => {
    if (user?.id && initializedScopeUserRef.current !== user.id) {
      initializedScopeUserRef.current = user.id;
      const defaultScope = getDefaultActivityPlanViewScope(user);
      setFilter(defaultScope);
    }
  }, [user]);
  const [workTypeFilters, setWorkTypeFilters] = useState<string[]>([]);
  const [personFilters, setPersonFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const [workTypeOptions, setWorkTypeOptions] = useState<MultiSelectOption[]>([]);
  const [personOptions, setPersonOptions] = useState<MultiSelectOption[]>([]);

  // Load Work Type & Employee options
  useEffect(() => {
    let isMounted = true;

    getActivityTypesAction()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.types) && res.types.length > 0) {
          const opts: MultiSelectOption[] = res.types.map((t: any) => ({
            value: t.code,
            label: `${t.code?.replace("_", "") || ""} ${t.name || ""}`.trim(),
          }));
          setWorkTypeOptions(opts);
        } else {
          const opts: MultiSelectOption[] = Object.values(WORK_TYPE_CONFIG).map((c) => ({
            value: c.code,
            label: `${c.code.replace("_", "")} ${c.name}`,
          }));
          setWorkTypeOptions(opts);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const opts: MultiSelectOption[] = Object.values(WORK_TYPE_CONFIG).map((c) => ({
          value: c.code,
          label: `${c.code.replace("_", "")} ${c.name}`,
        }));
        setWorkTypeOptions(opts);
      });

    getAllEmployeesAction()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.employees)) {
          const opts: MultiSelectOption[] = res.employees
            .filter((e: any) => e.name)
            .map((e: any) => ({
              value: e.id,
              label: e.name,
            }));
          setPersonOptions(opts);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Merge any attendee/employee from loaded events into personOptions
  const syncAttendeeOptions = useCallback((events: CalendarEvent[]) => {
    if (!events || events.length === 0) return;
    setPersonOptions((prev) => {
      const existingIds = new Set(prev.map((o) => o.value));
      const newOpts: MultiSelectOption[] = [];
      for (const ev of events) {
        if (ev.employee?.id && ev.employee?.name && !existingIds.has(ev.employee.id)) {
          existingIds.add(ev.employee.id);
          newOpts.push({ value: ev.employee.id, label: ev.employee.name });
        }
        if (Array.isArray(ev.attendees)) {
          for (const att of ev.attendees) {
            if (att.employee?.id && att.employee?.name && !existingIds.has(att.employee.id)) {
              existingIds.add(att.employee.id);
              newOpts.push({
                value: att.employee.id,
                label: att.employee.name,
              });
            }
          }
        }
      }
      return newOpts.length > 0 ? [...prev, ...newOpts] : prev;
    });
  }, []);

  const handleClearAllFilters = () => {
    setWorkTypeFilters([]);
    setPersonFilters([]);
    setStatusFilters([]);
    setSearchKeyword("");
  };

  const hasActiveFilters =
    workTypeFilters.length > 0 ||
    personFilters.length > 0 ||
    statusFilters.length > 0 ||
    searchKeyword.trim().length > 0;

  return {
    filter,
    setFilter,
    workTypeFilters,
    setWorkTypeFilters,
    personFilters,
    setPersonFilters,
    statusFilters,
    setStatusFilters,
    searchKeyword,
    setSearchKeyword,
    workTypeOptions,
    personOptions,
    hasActiveFilters,
    handleClearAllFilters,
    syncAttendeeOptions,
  };
}
