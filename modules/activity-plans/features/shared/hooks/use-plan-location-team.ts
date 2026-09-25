import { useState, useEffect, useMemo, useRef } from "react";
import { isLocationAndTeamRequired } from "@/modules/activity-plans/constants";

export interface Employee {
  id: string;
  name: string;
  positionTitle?: string | null;
  departmentName?: string | null;
  [key: string]: any;
}

export interface UsePlanLocationTeamOptions {
  initial?: any;
  selectedWorkTypes: string[];
  employees?: Employee[];
}

export interface UsePlanLocationTeamResult {
  province: string;
  setProvince: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  locationText: string;
  setLocationText: (val: string) => void;
  helperEmployeeIds: string[];
  setHelperEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
  helperSearch: string;
  setHelperSearch: (val: string) => void;
  showHelperDropdown: boolean;
  setShowHelperDropdown: (val: boolean) => void;
  isLocationTeamVisible: boolean;
  filteredEmployees: Employee[];
  addHelper: (id: string) => void;
  removeHelper: (id: string) => void;
  validateLocationTeam: () => { isValid: boolean; error?: string };
}

export function usePlanLocationTeam({
  initial = {},
  selectedWorkTypes,
  employees = [],
}: UsePlanLocationTeamOptions): UsePlanLocationTeamResult {
  const [province, setProvince] = useState<string>(
    (initial as any)?.province ?? "",
  );
  const [district, setDistrict] = useState<string>(
    (initial as any)?.district ?? "",
  );
  const [locationText, setLocationText] = useState<string>(
    initial.location ?? "",
  );
  const [helperEmployeeIds, setHelperEmployeeIds] = useState<string[]>(() => {
    if (initial.helperEmployeeIds && Array.isArray(initial.helperEmployeeIds)) {
      return initial.helperEmployeeIds;
    }
    if ((initial as any)?.helpers && Array.isArray((initial as any).helpers)) {
      return (initial as any).helpers
        .map((h: any) => h.employeeId || h.id)
        .filter(Boolean);
    }
    return [];
  });
  const [helperSearch, setHelperSearch] = useState<string>("");
  const [showHelperDropdown, setShowHelperDropdown] = useState<boolean>(false);

  // Conditional visibility: requires at least one of TYPE_8, TYPE_9, TYPE_10
  const isLocationTeamVisible = useMemo(
    () => isLocationAndTeamRequired(selectedWorkTypes),
    [selectedWorkTypes],
  );

  // Auto-clear Location & Team when switching from visible -> hidden
  // Protected against initial mount / hydration via prevIsLocationTeamVisibleRef
  const prevIsLocationTeamVisibleRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevIsLocationTeamVisibleRef.current === null) {
      // Initial mount / hydration: record initial state, DO NOT clear
      prevIsLocationTeamVisibleRef.current = isLocationTeamVisible;
      return;
    }

    if (prevIsLocationTeamVisibleRef.current && !isLocationTeamVisible) {
      // User transitioned from eligible -> ineligible work types
      setProvince("");
      setDistrict("");
      setLocationText("");
      setHelperEmployeeIds([]);
      setHelperSearch("");
      setShowHelperDropdown(false);
    }

    prevIsLocationTeamVisibleRef.current = isLocationTeamVisible;
  }, [isLocationTeamVisible]);

  // Employee Helper Selection
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      if (helperEmployeeIds.includes(emp.id)) return false;
      const search = helperSearch.toLowerCase();
      return (
        emp.name.toLowerCase().includes(search) ||
        (emp.positionTitle?.toLowerCase() || "").includes(search) ||
        (emp.departmentName?.toLowerCase() || "").includes(search)
      );
    });
  }, [employees, helperEmployeeIds, helperSearch]);

  const addHelper = (id: string) => {
    setHelperEmployeeIds((prev) => [...prev, id]);
    setHelperSearch("");
    setShowHelperDropdown(false);
  };

  const removeHelper = (id: string) => {
    setHelperEmployeeIds((prev) => prev.filter((hid) => hid !== id));
  };

  const validateLocationTeam = () => {
    const isType9Active = selectedWorkTypes.includes("จัดกิจกรรมส่งเสริมการขายหน้าร้าน");
    const hasOtherLocationWorkType = selectedWorkTypes.some(
      (wt) => wt.includes("Field Day") || wt.includes("จัดประชุม"),
    );

    // If TYPE_9 is active and no other work type requires location text, bypass locationText check
    if (isLocationTeamVisible && isType9Active && !hasOtherLocationWorkType) {
      return { isValid: true };
    }

    if (isLocationTeamVisible && !locationText.trim()) {
      return {
        isValid: false,
        error: "กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม",
      };
    }
    return { isValid: true };
  };

  return {
    province,
    setProvince,
    district,
    setDistrict,
    locationText,
    setLocationText,
    helperEmployeeIds,
    setHelperEmployeeIds,
    helperSearch,
    setHelperSearch,
    showHelperDropdown,
    setShowHelperDropdown,
    isLocationTeamVisible,
    filteredEmployees,
    addHelper,
    removeHelper,
    validateLocationTeam,
  };
}
