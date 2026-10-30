"use client";

import React from "react";
import { User, Users, UserPlus, Layers, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/custom/multi-select";
import { STATUS_OPTIONS } from "@/modules/activity/constants";
import {
  CalendarFilter,
  CalendarFilterState,
  CalendarScopeCounts,
} from "../types/calendar.types";

interface CalendarFilterBarProps {
  filterState: CalendarFilterState;
  loading: boolean;
  totalEventsCount: number;
  filteredEventsCount: number;
  scopeCounts?: CalendarScopeCounts;
}

export function CalendarFilterBar({
  filterState,
  loading,
  totalEventsCount,
  filteredEventsCount,
  scopeCounts,
}: CalendarFilterBarProps) {
  const {
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
  } = filterState;

  const scopeTabs: {
    id: CalendarFilter;
    label: string;
    subtitle: string;
    count: number;
    icon: React.ElementType;
    activeClass: string;
    badgeActiveClass: string;
    iconColorClass: string;
  }[] = [
    {
      id: "OWN",
      label: "แผนงานของฉัน",
      subtitle: "ที่ฉันเป็นผู้สร้าง",
      count: scopeCounts?.own ?? 0,
      icon: User,
      activeClass:
        "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20",
      badgeActiveClass: "bg-white/20 text-white",
      iconColorClass: "text-blue-600",
    },
    {
      id: "TEAM",
      label: "แผนงานลูกทีม / ทีมงาน",
      subtitle: "ของทีมและผู้ใต้บังคับบัญชา",
      count: scopeCounts?.team ?? 0,
      icon: Users,
      activeClass:
        "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20",
      badgeActiveClass: "bg-white/20 text-white",
      iconColorClass: "text-indigo-600",
    },
    {
      id: "HELPER",
      label: "ที่ฉันร่วมทีม (Helper)",
      subtitle: "ไปช่วยปฏิบัติงาน",
      count: scopeCounts?.helper ?? 0,
      icon: UserPlus,
      activeClass:
        "bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-500/20",
      badgeActiveClass: "bg-white/20 text-white",
      iconColorClass: "text-teal-600",
    },
    {
      id: "ALL",
      label: "ทั้งหมด",
      subtitle: "รวมทุกมุมมอง",
      count: scopeCounts?.all ?? 0,
      icon: Layers,
      activeClass:
        "bg-slate-800 text-white border-slate-800 shadow-sm shadow-slate-500/20",
      badgeActiveClass: "bg-white/20 text-white",
      iconColorClass: "text-slate-600",
    },
  ];

  return (
    <div className="space-y-4">
      {/* ─── Scope Switcher Tabs (แยกข้อมูลของเรา vs ลูกทีม vs ร่วมทีม vs ทั้งหมด) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
        {scopeTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            filter === tab.id ||
            (tab.id === "OWN" && filter === "MY_EVENTS") ||
            (tab.id === "HELPER" && filter === "HELPER_EVENTS");
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "flex items-center justify-between gap-2 p-3 sm:px-4 sm:py-3 rounded-xl border text-left transition-all cursor-pointer",
                isActive
                  ? tab.activeClass
                  : "bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs",
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={cn(
                    "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-white/20 text-white"
                      : "bg-slate-50 border border-slate-200/80 shadow-2xs",
                    !isActive && tab.iconColorClass,
                  )}
                >
                  <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </div>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs sm:text-sm font-bold truncate",
                      isActive ? "text-white" : "text-slate-800",
                    )}
                  >
                    {tab.label}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] sm:text-xs truncate hidden sm:block",
                      isActive ? "text-white/80" : "text-slate-500",
                    )}
                  >
                    {tab.subtitle}
                  </p>
                </div>
              </div>

              <span
                className={cn(
                  "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-extrabold shrink-0 tabular-nums",
                  isActive
                    ? tab.badgeActiveClass
                    : "bg-slate-100 text-slate-700 border border-slate-200/80",
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search & Multi-select Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">
            ตัวกรองเพิ่มเติม
          </span>
          {loading && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              กำลังโหลดข้อมูล...
            </div>
          )}
        </div>

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
              พบ {filteredEventsCount} จากทั้งหมด {totalEventsCount} กิจกรรม
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
    </div>
  );
}
