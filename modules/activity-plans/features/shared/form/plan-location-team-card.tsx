import React from "react";
import { LocationTeamSection } from "./components/location-team-section";
import type { Employee } from "../hooks/use-plan-location-team";

export interface PlanLocationTeamCardProps {
  isVisible: boolean;
  selectedWorkTypes: string[];
  readonly?: boolean;
  helperSearch: string;
  setHelperSearch: (val: string) => void;
  showHelperDropdown: boolean;
  setShowHelperDropdown: (val: boolean) => void;
  filteredEmployees: Employee[];
  addHelper: (id: string) => void;
  helperEmployeeIds: string[];
  employees: Employee[];
  removeHelper: (id: string) => void;
  locationText: string;
  setLocationText: (val: string) => void;
  province: string;
  setProvince: (val: string) => void;
  district: string;
  setDistrict: (val: string) => void;
  // Optional TYPE_8 specific props
  isType8Active?: boolean;
  selectedDealer?: any;
  venueType?: "STORE" | "OTHER";
  onVenueTypeChange?: (val: "STORE" | "OTHER") => void;
}

export function PlanLocationTeamCard({
  isVisible,
  selectedWorkTypes,
  readonly = false,
  helperSearch,
  setHelperSearch,
  showHelperDropdown,
  setShowHelperDropdown,
  filteredEmployees,
  addHelper,
  helperEmployeeIds,
  employees,
  removeHelper,
  locationText,
  setLocationText,
  province,
  setProvince,
  district,
  setDistrict,
  isType8Active = false,
  selectedDealer,
  venueType,
  onVenueTypeChange,
}: PlanLocationTeamCardProps) {
  if (!isVisible) return null;

  return (
    <LocationTeamSection
      selectedWorkTypes={selectedWorkTypes}
      readonly={readonly}
      helperSearch={helperSearch}
      setHelperSearch={setHelperSearch}
      showHelperDropdown={showHelperDropdown}
      setShowHelperDropdown={setShowHelperDropdown}
      filteredEmployees={filteredEmployees}
      addHelper={addHelper}
      helperEmployeeIds={helperEmployeeIds}
      employees={employees}
      removeHelper={removeHelper}
      locationText={locationText}
      setLocationText={setLocationText}
      province={province}
      setProvince={setProvince}
      district={district}
      setDistrict={setDistrict}
      isType8Active={isType8Active}
      selectedDealer={selectedDealer}
      venueType={venueType}
      onVenueTypeChange={onVenueTypeChange}
    />
  );
}
