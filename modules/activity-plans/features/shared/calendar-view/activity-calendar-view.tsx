"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Users,
  User,
  XCircle,
  Loader2,
  ExternalLink,
  ArrowLeft,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  MultiSelect,
  type MultiSelectOption,
} from "@/components/custom/multi-select";
import {
  getActivityCalendarEventsAction,
  getActivityTypesAction,
} from "../../../server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import {
  STATUS_OPTIONS,
  WORK_TYPE_CONFIG,
  matchesActivityFilters,
} from "../../../constants";
import { cn } from "@/lib/utils";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
} from "date-fns";
import { th } from "date-fns/locale";

type CalendarFilter = "ALL" | "MY_EVENTS" | "HELPER_EVENTS";

export function ActivityCalendarView() {
  const router = useRouter();
  const { data: session } = useSession();
  const currentEmployeeId = session?.user?.employeeId;

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<CalendarFilter>("ALL");
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{
    day: Date;
    events: any[];
  } | null>(null);

  // Multi-select & Search filter states
  const [workTypeFilters, setWorkTypeFilters] = useState<string[]>([]);
  const [personFilters, setPersonFilters] = useState<string[]>([]);
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState<string>("");

  const [workTypeOptions, setWorkTypeOptions] = useState<MultiSelectOption[]>(
    [],
  );
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
          const opts: MultiSelectOption[] = Object.values(WORK_TYPE_CONFIG).map(
            (c) => ({
              value: c.code,
              label: `${c.code.replace("_", "")} ${c.name}`,
            }),
          );
          setWorkTypeOptions(opts);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const opts: MultiSelectOption[] = Object.values(WORK_TYPE_CONFIG).map(
          (c) => ({
            value: c.code,
            label: `${c.code.replace("_", "")} ${c.name}`,
          }),
        );
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
  useEffect(() => {
    if (!events || events.length === 0) return;
    setPersonOptions((prev) => {
      const existingIds = new Set(prev.map((o) => o.value));
      const newOpts: MultiSelectOption[] = [];
      for (const ev of events) {
        if (
          ev.employee?.id &&
          ev.employee?.name &&
          !existingIds.has(ev.employee.id)
        ) {
          existingIds.add(ev.employee.id);
          newOpts.push({ value: ev.employee.id, label: ev.employee.name });
        }
        if (Array.isArray(ev.attendees)) {
          for (const att of ev.attendees) {
            if (
              att.employee?.id &&
              att.employee?.name &&
              !existingIds.has(att.employee.id)
            ) {
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
  }, [events]);

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
        setEvents(res.events);
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

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      // 1. Tab filter (Preserved!)
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
  }, [
    events,
    filter,
    workTypeFilters,
    personFilters,
    statusFilters,
    searchKeyword,
    currentEmployeeId,
  ]);

  const getEventsForDay = (day: Date) => {
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
  };

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

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/activity-plans")}
            className="rounded-xl shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                ปฏิทินกิจกรรม (Activity Calendar)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              ตารางนัดหมายกิจกรรมที่ได้รับอนุมัติแล้ว
              สำหรับผู้สร้างแผนและผู้ช่วยงาน
            </p>
          </div>
        </div>

        {/* Month Navigation & Today Button */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center p-1 rounded-xl border border-slate-200">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </Button>
            <span className="text-sm font-semibold text-slate-800 px-3 min-w-[130px] text-center">
              {format(currentDate, "MMMM yyyy", { locale: th })}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              className="h-8 w-8 rounded-lg"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
            className="rounded-xl text-xs font-semibold"
          >
            วันนี้
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
            className="rounded-xl text-xs"
          >
            ทั้งหมด ({hasActiveFilters ? filteredEvents.length : events.length})
          </Button>
          <Button
            variant={filter === "MY_EVENTS" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("MY_EVENTS")}
            className="rounded-xl text-xs"
          >
            กิจกรรมหลัก
          </Button>
          <Button
            variant={filter === "HELPER_EVENTS" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("HELPER_EVENTS")}
            className="rounded-xl text-xs"
          >
            กิจกรรมที่เป็นผู้ช่วย
          </Button>
        </div>

        {loading && (
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            กำลังโหลดข้อมูล...
          </div>
        )}
      </div>

      {/* Search & Multi-select Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. ค้นหา */}
          <div className="space-y-1">
            <label className="mx-1 text-xs font-semibold text-slate-700 block">
              ค้นหา
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input
                placeholder="ค้นหาชื่อกิจกรรม, รหัส, สถานที่..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="pl-8 h-9 text-xs bg-white"
              />
            </div>
          </div>

          {/* 2. ประเภทงาน */}
          <div className="space-y-1">
            <label className="mx-1 text-xs font-semibold text-slate-700 block">
              ประเภทงาน
            </label>
            <MultiSelect
              options={workTypeOptions}
              defaultValue={workTypeFilters}
              onValueChange={setWorkTypeFilters}
              placeholder="ทุกประเภทงาน"
              searchPlaceholder="ค้นหาประเภทงาน..."
              emptyIndicator="ไม่พบประเภทงาน"
              maxCount={1}
              className="bg-white h-9 text-xs"
            />
          </div>

          {/* 3. บุคคล */}
          <div className="space-y-1">
            <label className="mx-1 text-xs font-semibold text-slate-700 block">
              บุคคล
            </label>
            <MultiSelect
              options={personOptions}
              defaultValue={personFilters}
              onValueChange={setPersonFilters}
              placeholder="ทุกคน"
              searchPlaceholder="ค้นหาชื่อบุคคล..."
              emptyIndicator="ไม่พบบุคคล"
              maxCount={1}
              className="bg-white h-9 text-xs"
            />
          </div>

          {/* 4. สถานะกิจกรรม */}
          <div className="space-y-1">
            <label className="mx-1 text-xs font-semibold text-slate-700 block">
              สถานะกิจกรรม
            </label>
            <MultiSelect
              options={STATUS_OPTIONS}
              defaultValue={statusFilters}
              onValueChange={setStatusFilters}
              placeholder="ทุกสถานะ"
              searchPlaceholder="ค้นหาสถานะ..."
              emptyIndicator="ไม่พบสถานะ"
              maxCount={1}
              className="bg-white h-9 text-xs"
            />
          </div>
        </div>

        {/* Active filter summary / Clear button */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
            <span>
              พบ {filteredEvents.length} จากทั้งหมด {events.length} กิจกรรม
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAllFilters}
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2 cursor-pointer"
            >
              ล้างตัวกรองทั้งหมด
            </Button>
          </div>
        )}
      </div>

      {/* Calendar Grid Container */}
      <Card className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white">
        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center">
          {[
            "อาทิตย์",
            "จันทร์",
            "อังคาร",
            "พุธ",
            "พฤหัสบดี",
            "ศุกร์",
            "เสาร์",
          ].map((d, i) => (
            <div
              key={d}
              className={cn(
                "py-2.5 text-xs font-bold",
                i === 0
                  ? "text-red-500"
                  : i === 6
                    ? "text-blue-600"
                    : "text-slate-600",
              )}
            >
              <span className="hidden sm:inline">{d}</span>
              <span className="sm:hidden">{d.slice(0, 2)}</span>
            </div>
          ))}
        </div>

        {/* Day Cells */}
        <div className="grid grid-cols-7 auto-rows-fr bg-slate-200 gap-[1px]">
          {calendarDays.map((day) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isDayToday = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => {
                  if (dayEvents.length > 0) {
                    setSelectedDayEvents({ day, events: dayEvents });
                  }
                }}
                className={cn(
                  "min-h-[90px] sm:min-h-[120px] p-1.5 sm:p-2 bg-white flex flex-col justify-between transition-colors",
                  !isCurrentMonth && "bg-slate-50/70 text-slate-300",
                  isDayToday && "bg-blue-50/40",
                  dayEvents.length > 0 && "cursor-pointer hover:bg-slate-50/90",
                )}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <span
                    className={cn(
                      "text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full",
                      isDayToday
                        ? "bg-blue-600 text-white font-bold"
                        : isCurrentMonth
                          ? "text-slate-700"
                          : "text-slate-400",
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {dayEvents.length > 0 && (
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md sm:hidden">
                      {dayEvents.length}
                    </span>
                  )}
                </div>

                {/* Event Tags */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {dayEvents.slice(0, 3).map((ev) => {
                    const isUnplanned =
                      ev.activityPlan?.planType === "UNPLANNED";
                    return (
                      <div
                        key={ev.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className={cn(
                          "text-[11px] font-medium px-1.5 py-0.5 rounded-md truncate cursor-pointer transition-all border",
                          ev.status === "CANCELLED"
                            ? "bg-red-50 text-red-600 border-red-200 line-through"
                            : ev.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              : isUnplanned
                                ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                : "bg-blue-50/90 text-blue-700 border-blue-200 hover:bg-blue-100",
                        )}
                      >
                        <span className="font-semibold">
                          {format(new Date(ev.startDate), "HH:mm")}
                        </span>{" "}
                        {isUnplanned && (
                          <span className="font-bold text-[10px] mr-0.5 text-purple-600">
                            [นอกแผน]
                          </span>
                        )}
                        {ev.title}
                      </div>
                    );
                  })}
                  {dayEvents.length > 3 && (
                    <div className="text-[10px] text-slate-500 font-medium text-center">
                      +{dayEvents.length - 3} เพิ่มเติม
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-semibold",
                      selectedEvent.status === "COMPLETED" &&
                        "bg-emerald-50 text-emerald-700 border-emerald-200",
                      selectedEvent.status === "SCHEDULED" &&
                        "bg-blue-50 text-blue-700 border-blue-200",
                      selectedEvent.status === "CANCELLED" &&
                        "bg-red-50 text-red-700 border-red-200",
                    )}
                  >
                    {selectedEvent.status === "COMPLETED"
                      ? "ดำเนินการเสร็จสิ้น"
                      : selectedEvent.status === "SCHEDULED"
                        ? "มีนัดหมายตามกำหนด"
                        : "ยกเลิกนัดหมาย"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-semibold",
                      selectedEvent.activityPlan?.planType === "UNPLANNED"
                        ? "bg-purple-50 text-purple-700 border-purple-200"
                        : "bg-blue-50 text-blue-700 border-blue-200",
                    )}
                  >
                    {selectedEvent.activityPlan?.planType === "UNPLANNED"
                      ? "นอกแผน"
                      : "ตามแผน"}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedEvent.title}
                </h3>
                {selectedEvent.activityPlan?.code && (
                  <p className="text-xs text-slate-400 font-mono">
                    รหัส: {selectedEvent.activityPlan.code}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedEvent(null)}
                className="rounded-full"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </Button>
            </div>

            {/* Date & Time */}
            <div className="space-y-2 text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  <strong>เวลา:</strong>{" "}
                  {format(
                    new Date(selectedEvent.startDate),
                    "d MMMM yyyy HH:mm",
                    { locale: th },
                  )}{" "}
                  -{" "}
                  {format(new Date(selectedEvent.endDate), "HH:mm น.", {
                    locale: th,
                  })}
                </span>
              </div>
              {selectedEvent.location && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span>
                    <strong>สถานที่:</strong> {selectedEvent.location}
                    {selectedEvent.district && ` อ.${selectedEvent.district}`}
                    {selectedEvent.province && ` จ.${selectedEvent.province}`}
                  </span>
                </div>
              )}
              {selectedEvent.employee && (
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-purple-500 shrink-0" />
                  <span>
                    <strong>ผู้สร้างแผนงาน:</strong>{" "}
                    {selectedEvent.employee.name} (
                    {selectedEvent.employee.positionTitle || "พนักงาน"})
                  </span>
                </div>
              )}
            </div>

            {/* Attendees / Helpers */}
            {selectedEvent.attendees && selectedEvent.attendees.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  รายชื่อผู้เข้าร่วมและผู้ช่วยงาน (
                  {selectedEvent.attendees.length} คน)
                </label>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {selectedEvent.attendees.map((att: any, idx: number) => (
                    <div
                      key={att.id || idx}
                      className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800">
                          {att.employee?.name || "พนักงาน"}
                        </span>
                        <span className="text-slate-400">
                          (
                          {att.employee?.positionTitle ||
                            att.employee?.departmentName ||
                            "พนักงาน"}
                          )
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          att.role === "CREATOR"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-blue-50 text-blue-700",
                        )}
                      >
                        {att.role === "CREATOR" ? "ผู้สร้างแผน" : "ผู้ช่วยงาน"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                variant="outline"
                onClick={() => setSelectedEvent(null)}
                className="rounded-xl text-xs"
              >
                ปิด
              </Button>
              {selectedEvent.activityPlanId && (
                <Button
                  onClick={() =>
                    router.push(
                      `/activity-plans/${selectedEvent.activityPlanId}`,
                    )
                  }
                  className="rounded-xl text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  ดูรายละเอียดแผนงาน
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Day Events List Modal */}
      {selectedDayEvents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-base font-bold text-slate-900">
                กิจกรรมวันที่{" "}
                {format(selectedDayEvents.day, "d MMMM yyyy", { locale: th })}
              </h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedDayEvents(null)}
                className="rounded-full h-8 w-8"
              >
                <XCircle className="w-4 h-4 text-slate-400" />
              </Button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {selectedDayEvents.events.map((ev) => (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedDayEvents(null);
                    setSelectedEvent(ev);
                  }}
                  className="p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50/50 cursor-pointer transition-colors space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={cn(
                        "font-bold text-xs",
                        ev.status === "CANCELLED"
                          ? "text-red-600 line-through"
                          : ev.status === "COMPLETED"
                            ? "text-emerald-700"
                            : "text-slate-900",
                      )}
                    >
                      {ev.title}
                    </span>
                    <span
                      className={cn(
                        "text-[11px] font-semibold",
                        ev.status === "CANCELLED"
                          ? "text-red-500"
                          : ev.status === "COMPLETED"
                            ? "text-emerald-600"
                            : "text-blue-600",
                      )}
                    >
                      {format(new Date(ev.startDate), "HH:mm")} น.
                    </span>
                  </div>
                  {ev.location && (
                    <p className="text-xs text-slate-500 truncate">
                      📍 {ev.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
