"use client";

import React from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MultiSelect } from "@/components/custom/multi-select";
import { STATUS_OPTIONS } from "@/modules/activity/constants";
import { CalendarFilterState } from "../types/calendar.types";

interface CalendarFilterBarProps {
  filterState: CalendarFilterState;
  loading: boolean;
  totalEventsCount: number;
  filteredEventsCount: number;
}

export function CalendarFilterBar({
  filterState,
  loading,
  totalEventsCount,
  filteredEventsCount,
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

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
        <div className="flex items-center gap-2">
          <Button
            variant={filter === "ALL" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("ALL")}
            className="rounded-xl text-xs"
          >
            ทั้งหมด ({hasActiveFilters ? filteredEventsCount : totalEventsCount})
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

