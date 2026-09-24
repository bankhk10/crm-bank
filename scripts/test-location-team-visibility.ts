/**
 * Automated Test Suite: Location & Team Conditional Visibility & Auto-Clear
 * Tests TC-1 through TC-10 per approved specification.
 *
 * Run with: npx tsx --env-file=.env scripts/test-location-team-visibility.ts
 */

import {
  LOCATION_TEAM_WORK_TYPE_CODES,
  isLocationAndTeamRequired,
  getWorkTypeCode,
  WORK_TYPES,
} from "../modules/activity-plans/constants";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`  ❌ [FAIL] ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

console.log("===============================================================");
console.log("TEST SUITE: Location & Team Conditional Visibility (TC-1 to TC-10)");
console.log("===============================================================\n");

// -------------------------------------------------------------
// TC-1: No work type -> hidden
// -------------------------------------------------------------
console.log("--- TC-1: No work type -> hidden ---");
const tc1_empty = isLocationAndTeamRequired([]);
const tc1_null = isLocationAndTeamRequired(null);
const tc1_undefined = isLocationAndTeamRequired(undefined);
assert(tc1_empty === false, "TC-1.1: Empty array [] returns false (hidden)");
assert(tc1_null === false, "TC-1.2: null returns false (hidden)");
assert(tc1_undefined === false, "TC-1.3: undefined returns false (hidden)");

// -------------------------------------------------------------
// TC-2: TYPE_1 -> hidden
// -------------------------------------------------------------
console.log("\n--- TC-2: TYPE_1 -> hidden ---");
const tc2_thai = isLocationAndTeamRequired(["เข้าพบร้านค้า / Key Farmer"]);
const tc2_code = isLocationAndTeamRequired(["TYPE_1"]);
assert(tc2_thai === false, "TC-2.1: Thai label 'เข้าพบร้านค้า / Key Farmer' returns false (hidden)");
assert(tc2_code === false, "TC-2.2: Code 'TYPE_1' returns false (hidden)");

// -------------------------------------------------------------
// TC-3: TYPE_7 -> hidden
// -------------------------------------------------------------
console.log("\n--- TC-3: TYPE_7 -> hidden ---");
const tc3_thai = isLocationAndTeamRequired(["ติดตามแปลงสาธิต / ทำแปลง"]);
const tc3_code = isLocationAndTeamRequired(["TYPE_7"]);
assert(tc3_thai === false, "TC-3.1: Thai label 'ติดตามแปลงสาธิต / ทำแปลง' returns false (hidden)");
assert(tc3_code === false, "TC-3.2: Code 'TYPE_7' returns false (hidden)");

// Other non-eligible types test
const nonEligibleCodes = ["TYPE_2", "TYPE_3", "TYPE_4", "TYPE_5", "TYPE_6", "TYPE_11", "TYPE_12"];
for (const code of nonEligibleCodes) {
  assert(isLocationAndTeamRequired([code]) === false, `TC-3.x: ${code} returns false (hidden)`);
}

// -------------------------------------------------------------
// TC-4: TYPE_8 -> visible
// -------------------------------------------------------------
console.log("\n--- TC-4: TYPE_8 -> visible ---");
const tc4_thai = isLocationAndTeamRequired(["จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์"]);
const tc4_code = isLocationAndTeamRequired(["TYPE_8"]);
assert(tc4_thai === true, "TC-4.1: Thai label 'จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์' returns true (visible)");
assert(tc4_code === true, "TC-4.2: Code 'TYPE_8' returns true (visible)");

// -------------------------------------------------------------
// TC-5: TYPE_9 -> visible
// -------------------------------------------------------------
console.log("\n--- TC-5: TYPE_9 -> visible ---");
const tc5_thai = isLocationAndTeamRequired(["จัดกิจกรรมส่งเสริมการขายหน้าร้าน"]);
const tc5_code = isLocationAndTeamRequired(["TYPE_9"]);
assert(tc5_thai === true, "TC-5.1: Thai label 'จัดกิจกรรมส่งเสริมการขายหน้าร้าน' returns true (visible)");
assert(tc5_code === true, "TC-5.2: Code 'TYPE_9' returns true (visible)");

// -------------------------------------------------------------
// TC-6: TYPE_10 -> visible
// -------------------------------------------------------------
console.log("\n--- TC-6: TYPE_10 -> visible ---");
const tc6_thai = isLocationAndTeamRequired(["จัดงาน Field Day"]);
const tc6_code = isLocationAndTeamRequired(["TYPE_10"]);
assert(tc6_thai === true, "TC-6.1: Thai label 'จัดงาน Field Day' returns true (visible)");
assert(tc6_code === true, "TC-6.2: Code 'TYPE_10' returns true (visible)");

// -------------------------------------------------------------
// TC-7: TYPE_1 + TYPE_8 -> visible (Multi-Work-Type)
// -------------------------------------------------------------
console.log("\n--- TC-7: TYPE_1 + TYPE_8 -> visible ---");
const tc7_mix1 = isLocationAndTeamRequired(["TYPE_1", "TYPE_8"]);
const tc7_mix2 = isLocationAndTeamRequired(["เข้าพบร้านค้า / Key Farmer", "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์"]);
const tc7_mix3 = isLocationAndTeamRequired(["TYPE_1", "TYPE_9"]);
const tc7_mix4 = isLocationAndTeamRequired(["TYPE_8", "TYPE_10"]);
assert(tc7_mix1 === true, "TC-7.1: TYPE_1 + TYPE_8 returns true (visible)");
assert(tc7_mix2 === true, "TC-7.2: Thai TYPE_1 + Thai TYPE_8 returns true (visible)");
assert(tc7_mix3 === true, "TC-7.3: TYPE_1 + TYPE_9 returns true (visible)");
assert(tc7_mix4 === true, "TC-7.4: TYPE_8 + TYPE_10 returns true (visible)");

// -------------------------------------------------------------
// Form State Simulator for Component Behavior (Hooks Simulation)
// -------------------------------------------------------------
class FormBehaviorSimulator {
  province: string;
  district: string;
  locationText: string;
  helperEmployeeIds: string[];
  helperSearch: string;
  showHelperDropdown: boolean;
  selectedWorkTypes: string[];
  prevIsLocationTeamVisible: boolean | null = null;
  error: string | null = null;

  constructor(initial: {
    selectedWorkTypes: string[];
    province?: string;
    district?: string;
    locationText?: string;
    helperEmployeeIds?: string[];
  }) {
    this.selectedWorkTypes = initial.selectedWorkTypes;
    this.province = initial.province ?? "";
    this.district = initial.district ?? "";
    this.locationText = initial.locationText ?? "";
    this.helperEmployeeIds = initial.helperEmployeeIds ?? [];
    this.helperSearch = "";
    this.showHelperDropdown = false;

    // Component Mount (Hydration)
    this.runEffect();
  }

  get isLocationTeamVisible(): boolean {
    return isLocationAndTeamRequired(this.selectedWorkTypes);
  }

  runEffect() {
    const isVisible = this.isLocationTeamVisible;
    if (this.prevIsLocationTeamVisible === null) {
      // Initial mount: record initial state, DO NOT clear
      this.prevIsLocationTeamVisible = isVisible;
      return;
    }

    if (this.prevIsLocationTeamVisible && !isVisible) {
      // Transition from eligible -> ineligible
      this.province = "";
      this.district = "";
      this.locationText = "";
      this.helperEmployeeIds = [];
      this.helperSearch = "";
      this.showHelperDropdown = false;
    }

    this.prevIsLocationTeamVisible = isVisible;
  }

  changeWorkTypes(newTypes: string[]) {
    this.selectedWorkTypes = newTypes;
    this.runEffect();
  }

  validate(): boolean {
    this.error = null;
    if (this.isLocationTeamVisible && !this.locationText.trim()) {
      this.error = "กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม";
      return false;
    }
    return true;
  }

  buildPayload() {
    const isVisible = this.isLocationTeamVisible;
    return {
      province: isVisible ? this.province.trim() || null : null,
      district: isVisible ? this.district.trim() || null : null,
      location: isVisible ? this.locationText.trim() || null : null,
      helperEmployeeIds: isVisible ? this.helperEmployeeIds : [],
    };
  }
}

// -------------------------------------------------------------
// TC-8: TYPE_8 + location/helper -> change to TYPE_1
// -------------------------------------------------------------
console.log("\n--- TC-8: TYPE_8 + location/helper -> change to TYPE_1 ---");
const simTC8 = new FormBehaviorSimulator({
  selectedWorkTypes: ["TYPE_8"],
  province: "เชียงใหม่",
  district: "เมือง",
  locationText: "โรงแรมเชียงใหม่ แกรนด์",
  helperEmployeeIds: ["emp-001", "emp-002"],
});

assert(simTC8.isLocationTeamVisible === true, "TC-8.1: Initial TYPE_8 is visible");
assert(simTC8.locationText === "โรงแรมเชียงใหม่ แกรนด์", "TC-8.2: Initial location is set");
assert(simTC8.helperEmployeeIds.length === 2, "TC-8.3: Initial helpers has 2 employees");

// User changes work type from TYPE_8 to TYPE_1
simTC8.changeWorkTypes(["TYPE_1"]);
assert(simTC8.isLocationTeamVisible === false, "TC-8.4: After change to TYPE_1, UI is hidden");
assert(simTC8.province === "", "TC-8.5: Auto-clear: province is cleared to ''");
assert(simTC8.district === "", "TC-8.6: Auto-clear: district is cleared to ''");
assert(simTC8.locationText === "", "TC-8.7: Auto-clear: locationText is cleared to ''");
assert(simTC8.helperEmployeeIds.length === 0, "TC-8.8: Auto-clear: helperEmployeeIds is cleared to []");
assert(simTC8.helperSearch === "", "TC-8.9: Auto-clear: helperSearch is cleared to ''");
assert(simTC8.showHelperDropdown === false, "TC-8.10: Auto-clear: showHelperDropdown is false");

// Validation passes even without location because section is hidden
assert(simTC8.validate() === true, "TC-8.11: Validation passes without requiring location");

// Payload defense verification
const payloadTC8 = simTC8.buildPayload();
assert(payloadTC8.location === null, "TC-8.12: Payload defense: location is null");
assert(payloadTC8.province === null, "TC-8.13: Payload defense: province is null");
assert(payloadTC8.district === null, "TC-8.14: Payload defense: district is null");
assert(Array.isArray(payloadTC8.helperEmployeeIds) && payloadTC8.helperEmployeeIds.length === 0, "TC-8.15: Payload defense: helperEmployeeIds is []");

// -------------------------------------------------------------
// TC-9: TYPE_8 + TYPE_9 -> remove TYPE_8 -> TYPE_9 still remains
// -------------------------------------------------------------
console.log("\n--- TC-9: TYPE_8 + TYPE_9 -> remove TYPE_8 (TYPE_9 remains) ---");
const simTC9 = new FormBehaviorSimulator({
  selectedWorkTypes: ["TYPE_8", "TYPE_9"],
  province: "ขอนแก่น",
  district: "เมือง",
  locationText: "สหกรณ์การเกษตรขอนแก่น",
  helperEmployeeIds: ["emp-003"],
});

assert(simTC9.isLocationTeamVisible === true, "TC-9.1: TYPE_8 + TYPE_9 is visible");

// User removes TYPE_8, TYPE_9 still remains
simTC9.changeWorkTypes(["TYPE_9"]);
assert(simTC9.isLocationTeamVisible === true, "TC-9.2: Still visible because TYPE_9 is present");
assert(simTC9.province === "ขอนแก่น", "TC-9.3: Province NOT cleared");
assert(simTC9.district === "เมือง", "TC-9.4: District NOT cleared");
assert(simTC9.locationText === "สหกรณ์การเกษตรขอนแก่น", "TC-9.5: Location NOT cleared");
assert(simTC9.helperEmployeeIds.length === 1 && simTC9.helperEmployeeIds[0] === "emp-003", "TC-9.6: Helpers NOT cleared");

// -------------------------------------------------------------
// TC-10: Edit existing TYPE_8/9/10 (Hydration Protection)
// -------------------------------------------------------------
console.log("\n--- TC-10: Edit existing TYPE_8/9/10 (Hydration Protection) ---");
// Simulate opening existing activity with TYPE_8 and pre-existing location and helpers
const simTC10 = new FormBehaviorSimulator({
  selectedWorkTypes: ["จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์"],
  province: "นครราชสีมา",
  district: "ปากช่อง",
  locationText: "ฟาร์มโชคชัย ปากช่อง",
  helperEmployeeIds: ["emp-101", "emp-102", "emp-103"],
});

// Check immediately after mount / initial hydration
assert(simTC10.isLocationTeamVisible === true, "TC-10.1: Initial edit hydration is visible");
assert(simTC10.province === "นครราชสีมา", "TC-10.2: Initial edit province preserved");
assert(simTC10.district === "ปากช่อง", "TC-10.3: Initial edit district preserved");
assert(simTC10.locationText === "ฟาร์มโชคชัย ปากช่อง", "TC-10.4: Initial edit locationText preserved");
assert(simTC10.helperEmployeeIds.length === 3, "TC-10.5: Initial edit helperEmployeeIds preserved (3 items)");

// Validation should require location when visible
simTC10.locationText = "   ";
assert(simTC10.validate() === false, "TC-10.6: Validation fails when visible and location empty");
assert(simTC10.error === "กรุณากรอกรายละเอียดพื้นที่จัดกิจกรรม", "TC-10.7: Error message matches specification");

// Restore location and submit payload
simTC10.locationText = "ฟาร์มโชคชัย ปากช่อง";
assert(simTC10.validate() === true, "TC-10.8: Validation passes when location provided");
const payloadTC10 = simTC10.buildPayload();
assert(payloadTC10.location === "ฟาร์มโชคชัย ปากช่อง", "TC-10.9: Payload contains preserved location");
assert(payloadTC10.province === "นครราชสีมา", "TC-10.10: Payload contains preserved province");
assert(payloadTC10.district === "ปากช่อง", "TC-10.11: Payload contains preserved district");
assert(payloadTC10.helperEmployeeIds.length === 3, "TC-10.12: Payload contains preserved helpers");

// -------------------------------------------------------------
// Additional Defense Test: Stale data on non-visible type submit
// -------------------------------------------------------------
console.log("\n--- Additional Defense: Stale data on ineligible type submit ---");
const simStale = new FormBehaviorSimulator({
  selectedWorkTypes: ["TYPE_1"],
  province: "Stale Province",
  district: "Stale District",
  locationText: "Stale Location",
  helperEmployeeIds: ["stale-emp"],
});
// Even if initial had stale data without changing work types, UI is hidden and payload sanitizes it:
assert(simStale.isLocationTeamVisible === false, "Stale.1: UI is hidden for TYPE_1");
const stalePayload = simStale.buildPayload();
assert(stalePayload.location === null, "Stale.2: Stale location sanitized to null");
assert(stalePayload.province === null, "Stale.3: Stale province sanitized to null");
assert(stalePayload.district === null, "Stale.4: Stale district sanitized to null");
assert(stalePayload.helperEmployeeIds.length === 0, "Stale.5: Stale helperEmployeeIds sanitized to []");

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log("\n===============================================================");
console.log(`TEST SUMMARY: ${passedCount} passed, ${failedCount} failed`);
console.log("===============================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!\n");
  process.exit(0);
}
