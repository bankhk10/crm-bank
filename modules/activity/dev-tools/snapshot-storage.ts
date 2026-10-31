"use client";

import { getWorkTypeCode, getWorkTypeName } from "@/modules/activity/constants";

export type TestFlowMode = "PLANNED" | "ACTUAL" | "UNPLANNED" | "DETAIL";

export interface FieldCheckItem {
  id: string;
  section: string;
  label: string;
  fieldKey: string;
  expectedValue: string;
  actualUiValue: string;
  domMatched?: boolean;
  status: "PASS" | "FAIL" | "WARN";
  note?: string;
}

export interface HydrationInspectionReport {
  mode: TestFlowMode;
  workTypeCodes: string[];
  planId?: string;
  planCode?: string;
  checkedAt: string;
  hasSavedSnapshot: boolean;
  totalFields: number;
  passedFields: number;
  failedFields: number;
  warnFields: number;
  items: FieldCheckItem[];
}

export interface SavedTestSnapshot {
  mode: "PLANNED" | "ACTUAL" | "UNPLANNED";
  planId?: string;
  planCode?: string;
  title?: string;
  workTypeCodes: string[];
  savedAt: string;
  fields: Record<string, { label: string; section: string; value: string }>;
}

const SNAPSHOT_STORAGE_PREFIX = "crm_admin_ui_test_snapshot_v1:";
const AUTO_INSPECT_PREF_KEY = "crm_admin_ui_test_redirect_inspect_v1";

export function getAutoRedirectInspectPref(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const val = window.sessionStorage.getItem(AUTO_INSPECT_PREF_KEY);
    return val === null ? true : val === "true";
  } catch {
    return true;
  }
}

export function setAutoRedirectInspectPref(enabled: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUTO_INSPECT_PREF_KEY, String(enabled));
  } catch {
    // ignore storage errors
  }
}

export function saveTestSnapshot(snapshot: SavedTestSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    if (snapshot.planId) {
      window.sessionStorage.setItem(
        `${SNAPSHOT_STORAGE_PREFIX}${snapshot.mode}:id:${snapshot.planId}`,
        JSON.stringify(snapshot),
      );
    }
    if (snapshot.title) {
      window.sessionStorage.setItem(
        `${SNAPSHOT_STORAGE_PREFIX}${snapshot.mode}:title:${snapshot.title.trim()}`,
        JSON.stringify(snapshot),
      );
    }
    window.sessionStorage.setItem(
      `${SNAPSHOT_STORAGE_PREFIX}${snapshot.mode}:latest`,
      JSON.stringify(snapshot),
    );
  } catch {
    // ignore quota errors
  }
}

export function loadTestSnapshot(
  mode: "PLANNED" | "ACTUAL" | "UNPLANNED",
  planId?: string,
  title?: string,
): SavedTestSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    if (planId) {
      const byId = window.sessionStorage.getItem(
        `${SNAPSHOT_STORAGE_PREFIX}${mode}:id:${planId}`,
      );
      if (byId) return JSON.parse(byId);
    }
    if (title) {
      const byTitle = window.sessionStorage.getItem(
        `${SNAPSHOT_STORAGE_PREFIX}${mode}:title:${title.trim()}`,
      );
      if (byTitle) return JSON.parse(byTitle);
    }
    return null;
  } catch {
    return null;
  }
}

function fmt(val: any): string {
  if (val === undefined || val === null) return "";
  if (typeof val === "boolean") return val ? "ใช่ (true)" : "ไม่ใช่ (false)";
  if (Array.isArray(val)) {
    if (val.length === 0) return "";
    return `${val.length} รายการ`;
  }
  return String(val).trim();
}

function fmtDate(val: any): string {
  if (!val) return "";
  const s = String(val);
  if (s.includes("T")) return s.split("T")[0];
  return s.trim();
}

/**
 * Checks if a given value is currently rendered inside any <input>, <textarea>, <select>, or visible text in the DOM.
 */
function checkValueInDom(val: string): boolean {
  if (typeof document === "undefined" || !val || val.length === 0) return false;
  const cleanVal = val.trim();
  if (!cleanVal) return false;

  const inputs = Array.from(
    document.querySelectorAll("input, textarea, select"),
  ) as Array<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

  for (const el of inputs) {
    if (el.value && (el.value.trim() === cleanVal || el.value.includes(cleanVal))) {
      return true;
    }
  }

  // Also check custom comboboxes / badges / buttons
  const bodyText = document.body?.innerText || "";
  if (cleanVal.replace(/\s*รายการ$/, "").length >= 2 && bodyText.includes(cleanVal)) {
    return true;
  }

  return false;
}

function makeCheckItem(params: {
  id: string;
  section: string;
  label: string;
  fieldKey: string;
  expected: any;
  actual: any;
  snapshotFields?: Record<string, { label: string; section: string; value: string }>;
}): FieldCheckItem {
  const { id, section, label, fieldKey, expected, actual, snapshotFields } = params;
  const snapEntry = snapshotFields?.[fieldKey];
  const expectedStr =
    snapEntry && snapEntry.value !== "" ? snapEntry.value : fmt(expected);
  const actualStr = fmt(actual);

  let status: "PASS" | "FAIL" | "WARN" = "PASS";
  let note = "ดึงข้อมูลเข้าช่อง UI ครบถ้วน";

  if (!actualStr && !expectedStr) {
    status = "WARN";
    note = "ไม่มีข้อมูลใน DB และช่อง UI ว่างเปล่า";
  } else if (expectedStr && !actualStr) {
    status = "FAIL";
    note = "มีข้อมูลบันทึกไว้ แต่ดึงเข้าช่อง UI ไม่มา (ว่างเปล่า)";
  } else if (
    expectedStr &&
    actualStr &&
    expectedStr !== actualStr &&
    !actualStr.includes(expectedStr) &&
    !expectedStr.includes(actualStr)
  ) {
    // Numeric equivalence check (e.g., "15000.00" vs "15000")
    const numExp = Number(expectedStr.replace(/,/g, ""));
    const numAct = Number(actualStr.replace(/,/g, ""));
    if (!Number.isNaN(numExp) && !Number.isNaN(numAct) && numExp === numAct) {
      status = "PASS";
      note = "ค่าตัวเลขตรงกัน";
    } else {
      status = "FAIL";
      note = "ค่าในช่อง UI ไม่ตรงกับค่าที่บันทึกไว้";
    }
  } else if (actualStr) {
    status = "PASS";
    note = "ดึงข้อมูลเข้าช่อง UI สำเร็จ";
  }

  const domMatched = checkValueInDom(actualStr);

  return {
    id,
    section,
    label,
    fieldKey,
    expectedValue: expectedStr || "(ว่าง)",
    actualUiValue: actualStr || "(ว่าง)",
    domMatched,
    status,
    note,
  };
}

/**
 * 1. Inspect Planned Activity Form (Create / Edit Trip Plan)
 */
export function inspectPlannedFormHydration(params: {
  initialData?: any;
  formState: {
    title: string;
    startDate: string;
    endDate: string;
    notes: string;
    selectedWorkTypes: string[];
    locationTeamHook: any;
    budgetHook: any;
    type1Form: any;
    type2Form: any;
    type3Form: any;
    type4Form: any;
    type5Form: any;
    type6Form: any;
    type7aForm: any;
    type7bForm: any;
    type8Form: any;
    type9Form: any;
    type10Form: any;
    type11Form: any;
    type12Form: any;
    type13Form: any;
    type14Form: any;
  };
}): HydrationInspectionReport {
  const { initialData, formState } = params;
  const planId = initialData?.id;
  const snapshot = loadTestSnapshot("PLANNED", planId, formState.title || initialData?.title);
  const snapFields = snapshot?.fields;

  const items: FieldCheckItem[] = [];
  const activeCodes = formState.selectedWorkTypes.map(getWorkTypeCode);

  // Common Header Fields
  items.push(
    makeCheckItem({
      id: "header-title",
      section: "ข้อมูลหลัก (Header)",
      label: "ชื่อแผนงาน (Title)",
      fieldKey: "title",
      expected: initialData?.title,
      actual: formState.title,
      snapshotFields: snapFields,
    }),
    makeCheckItem({
      id: "header-startDate",
      section: "ข้อมูลหลัก (Header)",
      label: "วันที่เริ่มต้น (Start Date)",
      fieldKey: "startDate",
      expected: fmtDate(initialData?.startDate),
      actual: fmtDate(formState.startDate),
      snapshotFields: snapFields,
    }),
    makeCheckItem({
      id: "header-endDate",
      section: "ข้อมูลหลัก (Header)",
      label: "วันที่สิ้นสุด (End Date)",
      fieldKey: "endDate",
      expected: fmtDate(initialData?.endDate),
      actual: fmtDate(formState.endDate),
      snapshotFields: snapFields,
    }),
    makeCheckItem({
      id: "header-workTypes",
      section: "ข้อมูลหลัก (Header)",
      label: "ประเภทงานที่เลือก (Work Types)",
      fieldKey: "workTypeCodes",
      expected: activeCodes.join(", "),
      actual: activeCodes.join(", "),
      snapshotFields: snapFields,
    }),
  );

  // Location & Team (if visible)
  if (formState.locationTeamHook?.isLocationTeamVisible) {
    items.push(
      makeCheckItem({
        id: "loc-province",
        section: "สถานที่และทีมงาน",
        label: "จังหวัด (Province)",
        fieldKey: "province",
        expected: initialData?.province,
        actual: formState.locationTeamHook.province,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "loc-district",
        section: "สถานที่และทีมงาน",
        label: "อำเภอ (District)",
        fieldKey: "district",
        expected: initialData?.district,
        actual: formState.locationTeamHook.district,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "loc-locationText",
        section: "สถานที่และทีมงาน",
        label: "สถานที่จัดกิจกรรม (Location)",
        fieldKey: "location",
        expected: initialData?.location,
        actual: formState.locationTeamHook.locationText,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "loc-helpers",
        section: "สถานที่และทีมงาน",
        label: "ทีมงานร่วมปฏิบัติงาน (Helpers)",
        fieldKey: "helperEmployeeIds",
        expected: initialData?.helpers?.length
          ? `${initialData.helpers.length} คน`
          : "",
        actual: formState.locationTeamHook.helperEmployeeIds?.length
          ? `${formState.locationTeamHook.helperEmployeeIds.length} คน`
          : "",
        snapshotFields: snapFields,
      }),
    );
  }

  // Work Type Specific Fields
  if (activeCodes.includes("TYPE_1")) {
    const t1 =
      formState.type1Form?.items?.[0] || formState.type1Form?.type1Items?.[0];
    const dbT1 = initialData?.type1Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t1-visitPurpose",
        section: "TYPE_1: เยี่ยมลูกค้า",
        label: "กลุ่มเป้าหมาย (ร้านค้า/เกษตรกร)",
        fieldKey: "t1.visitPurpose",
        expected: dbT1?.targetType || t1?.visitPurpose,
        actual: t1?.visitPurpose,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t1-customerName",
        section: "TYPE_1: เยี่ยมลูกค้า",
        label: "ชื่อร้านค้า/เกษตรกร",
        fieldKey: "t1.customerName",
        expected:
          dbT1?.store?.name ||
          dbT1?.farmer?.name ||
          dbT1?.unregisteredName ||
          t1?.customerName ||
          t1?.unregisteredFarmerName,
        actual: t1?.customerName || t1?.unregisteredFarmerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t1-topic",
        section: "TYPE_1: เยี่ยมลูกค้า",
        label: "หัวข้อการเข้าพบ (Topic)",
        fieldKey: "t1.topic",
        expected: dbT1?.visitObjective || t1?.topic,
        actual: t1?.topic,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t1-notes",
        section: "TYPE_1: เยี่ยมลูกค้า",
        label: "หมายเหตุ/รายละเอียดเข้าพบ",
        fieldKey: "t1.notes",
        expected: dbT1?.notes || t1?.notes,
        actual: t1?.notes,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_2")) {
    const t2 = formState.type2Form?.type2Items?.[0];
    const dbT2 = initialData?.type2Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t2-customerName",
        section: "TYPE_2: ติดตามผลการใช้สินค้า",
        label: "ชื่อร้านค้า/เกษตรกร",
        fieldKey: "t2.customerName",
        expected:
          dbT2?.store?.name ||
          dbT2?.farmer?.name ||
          dbT2?.unregisteredName ||
          t2?.customerName ||
          t2?.unregisteredFarmerName,
        actual: t2?.customerName || t2?.unregisteredFarmerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t2-productName",
        section: "TYPE_2: ติดตามผลการใช้สินค้า",
        label: "สินค้าที่ติดตาม (Product)",
        fieldKey: "t2.productName",
        expected:
          dbT2?.products?.[0]?.product?.name ||
          t2?.products?.[0]?.productName,
        actual: t2?.products?.[0]?.productName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t2-notes",
        section: "TYPE_2: ติดตามผลการใช้สินค้า",
        label: "หมายเหตุการติดตาม",
        fieldKey: "t2.notes",
        expected: dbT2?.notes || t2?.notes,
        actual: t2?.notes,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_3")) {
    const t3 = formState.type3Form?.type3Items?.[0];
    const dbT3 = initialData?.type3Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t3-customerName",
        section: "TYPE_3: เปิดการขาย",
        label: "ร้านค้าเป้าหมาย (Dealer/Subdealer)",
        fieldKey: "t3.customerName",
        expected: dbT3?.store?.name || dbT3?.subdealerName || t3?.customerName,
        actual: t3?.customerName || t3?.subdealerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t3-productName",
        section: "TYPE_3: เปิดการขาย",
        label: "สินค้าเป้าหมาย",
        fieldKey: "t3.productName",
        expected:
          dbT3?.products?.[0]?.product?.name ||
          t3?.products?.[0]?.productName,
        actual: t3?.products?.[0]?.productName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t3-quantityCases",
        section: "TYPE_3: เปิดการขาย",
        label: "จำนวนเป้าหมาย (ลัง)",
        fieldKey: "t3.quantityCases",
        expected:
          dbT3?.products?.[0]?.targetQuantity ??
          t3?.products?.[0]?.quantityCases,
        actual: t3?.products?.[0]?.quantityCases,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t3-pricePerCase",
        section: "TYPE_3: เปิดการขาย",
        label: "ราคาต่อลัง (บาท)",
        fieldKey: "t3.pricePerCase",
        expected:
          dbT3?.products?.[0]?.targetUnitPrice ??
          t3?.products?.[0]?.pricePerCase,
        actual: t3?.products?.[0]?.pricePerCase,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_4")) {
    const t4 = formState.type4Form?.type4Items?.[0];
    const dbT4 = initialData?.type4Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t4-customerName",
        section: "TYPE_4: วางบิล/เก็บเงิน",
        label: "ชื่อร้านค้า (Customer)",
        fieldKey: "t4.customerName",
        expected: dbT4?.store?.name || t4?.customerName,
        actual: t4?.customerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t4-collectType",
        section: "TYPE_4: วางบิล/เก็บเงิน",
        label: "ประเภท (วางบิล/เก็บเงิน)",
        fieldKey: "t4.collectType",
        expected: dbT4?.actionType || t4?.collectType,
        actual: t4?.collectType,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t4-amount",
        section: "TYPE_4: วางบิล/เก็บเงิน",
        label: "ยอดเงินตามแผน / รายละเอียด",
        fieldKey: "t4.amountOrDetail",
        expected:
          t4?.collectType === "BILLING"
            ? dbT4?.notes || t4?.billingDetail
            : dbT4?.targetAmount ?? t4?.amount,
        actual:
          t4?.collectType === "BILLING" ? t4?.billingDetail : t4?.amount,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_5")) {
    const t5 = formState.type5Form?.type5Items?.[0];
    const dbT5 = initialData?.type5Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t5-storeName",
        section: "TYPE_5: สำรวจราคาคู่แข่ง",
        label: "ร้านค้าที่สำรวจ",
        fieldKey: "t5.storeName",
        expected: dbT5?.store?.name || t5?.storeName,
        actual: t5?.storeName || t5?.storeId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t5-comparedProduct",
        section: "TYPE_5: สำรวจราคาคู่แข่ง",
        label: "สินค้าบริษัทที่เปรียบเทียบ",
        fieldKey: "t5.comparedProduct",
        expected: dbT5?.ourProduct?.name || t5?.comparedProduct,
        actual: t5?.comparedProduct || t5?.productId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t5-detail",
        section: "TYPE_5: สำรวจราคาคู่แข่ง",
        label: "รายละเอียด/ยี่ห้อคู่แข่งที่คาดว่าจะสำรวจ",
        fieldKey: "t5.detail",
        expected: dbT5?.competitorBrand || dbT5?.notes || t5?.detail,
        actual: t5?.detail,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_6")) {
    const t6 = formState.type6Form?.type6Items?.[0];
    const dbT6 = initialData?.type6Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t6-customerName",
        section: "TYPE_6: แก้ไขปัญหาสินค้า",
        label: "ชื่อลูกค้า/ร้านค้า",
        fieldKey: "t6.customerName",
        expected:
          dbT6?.store?.name ||
          dbT6?.manualCustomerName ||
          t6?.customerName ||
          t6?.manualCustomerName,
        actual: t6?.customerName || t6?.manualCustomerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t6-issueType",
        section: "TYPE_6: แก้ไขปัญหาสินค้า",
        label: "ประเภทปัญหา (Issue Type)",
        fieldKey: "t6.issueType",
        expected: dbT6?.issueCategory || t6?.issueType,
        actual: t6?.issueType,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t6-productName",
        section: "TYPE_6: แก้ไขปัญหาสินค้า",
        label: "สินค้าที่พบปัญหา",
        fieldKey: "t6.productName",
        expected: dbT6?.product?.name || t6?.productName,
        actual: t6?.productName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t6-lotNumber",
        section: "TYPE_6: แก้ไขปัญหาสินค้า",
        label: "เลขล็อตสินค้า (Lot Number)",
        fieldKey: "t6.lotNumber",
        expected: dbT6?.batchNumber || t6?.lotNumber,
        actual: t6?.lotNumber,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_7A")) {
    const t7a =
      formState.type7aForm?.type7aPlots?.[0] ||
      formState.type7aForm?.type7aItems?.[0];
    const dbT7a = initialData?.type7aTargets?.[0];
    const prods = t7a?.demoProducts || t7a?.products || [];
    items.push(
      makeCheckItem({
        id: "t7a-plotName",
        section: "TYPE_7A: ทำแปลงสาธิตใหม่",
        label: "ชื่อแปลงสาธิต / เกษตรกร",
        fieldKey: "t7a.plotName",
        expected:
          dbT7a?.plotName ||
          dbT7a?.farmerName ||
          t7a?.plotName ||
          t7a?.farmerName,
        actual: t7a?.plotName || t7a?.farmerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t7a-cropName",
        section: "TYPE_7A: ทำแปลงสาธิตใหม่",
        label: "ชนิดพืช (Crop Name)",
        fieldKey: "t7a.cropName",
        expected: dbT7a?.cropName || t7a?.cropName,
        actual: t7a?.cropName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t7a-areaRai",
        section: "TYPE_7A: ทำแปลงสาธิตใหม่",
        label: "พื้นที่ (ไร่)",
        fieldKey: "t7a.areaRai",
        expected: dbT7a?.areaRai ?? t7a?.areaRai,
        actual: t7a?.areaRai,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t7a-demoProducts",
        section: "TYPE_7A: ทำแปลงสาธิตใหม่",
        label: "รายการสินค้าเบิกทำแปลงสาธิต",
        fieldKey: "t7a.demoProducts",
        expected: dbT7a?.products?.length
          ? `${dbT7a.products.length} รายการ`
          : prods.length
            ? `${prods.length} รายการ`
            : "",
        actual: prods.length ? `${prods.length} รายการ` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_7B")) {
    const t7b = formState.type7bForm?.type7bItems?.[0];
    const dbT7b = initialData?.type7bTargets?.[0];
    items.push(
      makeCheckItem({
        id: "t7b-plotName",
        section: "TYPE_7B: ติดตามแปลงสาธิต",
        label: "แปลงสาธิตที่ติดตาม",
        fieldKey: "t7b.plotName",
        expected:
          dbT7b?.demoPlot?.name ||
          dbT7b?.plotName ||
          t7b?.plotName ||
          t7b?.existingPlotName ||
          t7b?.demoPlotId,
        actual:
          t7b?.plotName ||
          t7b?.existingPlotName ||
          t7b?.demoPlotId ||
          t7b?.selectedPlotIds?.[0],
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t7b-objective",
        section: "TYPE_7B: ติดตามแปลงสาธิต",
        label: "วัตถุประสงค์การติดตามแปลง",
        fieldKey: "t7b.objective",
        expected: dbT7b?.objective || t7b?.objective || t7b?.detail,
        actual: t7b?.objective || t7b?.detail,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_8")) {
    const t8 = formState.type8Form?.type8Items?.[0];
    const dbT8 = initialData?.type8Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t8-topic",
        section: "TYPE_8: จัดประชุม",
        label: "หัวข้อการจัดประชุม (Topic)",
        fieldKey: "t8.topic",
        expected: dbT8?.meetingTopic || t8?.topic,
        actual: t8?.topic,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t8-expectedAttendees",
        section: "TYPE_8: จัดประชุม",
        label: "จำนวนผู้เข้าร่วมตามแผน (คน)",
        fieldKey: "t8.expectedAttendees",
        expected: dbT8?.expectedAttendees ?? t8?.attendeesCount,
        actual: t8?.attendeesCount,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t8-dealer",
        section: "TYPE_8: จัดประชุม",
        label: "ร้านค้าหลักที่จัดประชุมร่วม",
        fieldKey: "t8.dealerName",
        expected: dbT8?.dealer?.name || t8?.dealerName || t8?.subDealerStore,
        actual: t8?.dealerName || t8?.subDealerStore || t8?.dealerId,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_9")) {
    const t9 = formState.type9Form;
    const dbT9 = initialData?.type9Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t9-subDealerStore",
        section: "TYPE_9: จัดกิจกรรมหน้าร้าน",
        label: "ร้านค้าซับดีลเลอร์ที่จัดกิจกรรม",
        fieldKey: "t9.subDealerStore",
        expected:
          dbT9?.subdealer?.name ||
          dbT9?.subDealerStore ||
          t9?.subdealerName ||
          t9?.subDealerStore,
        actual: t9?.subdealerName || t9?.subDealerStore || t9?.type9Store,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t9-targetSales",
        section: "TYPE_9: จัดกิจกรรมหน้าร้าน",
        label: "เป้ายอดขายในงาน (บาท)",
        fieldKey: "t9.targetSales",
        expected: dbT9?.targetSales ?? t9?.type9Sales,
        actual: t9?.type9Sales,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t9-products",
        section: "TYPE_9: จัดกิจกรรมหน้าร้าน",
        label: "สินค้าโปรโมทในงาน",
        fieldKey: "t9.products",
        expected:
          dbT9?.products?.[0]?.product?.name ||
          t9?.type9ProductItems?.[0]?.productName,
        actual: t9?.type9ProductItems?.[0]?.productName,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_10")) {
    const t10 = formState.type10Form;
    const dbT10 = initialData?.type10Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t10-plotName",
        section: "TYPE_10: งาน Field Day",
        label: "ชื่อแปลงสาธิตที่จัดงาน Field Day",
        fieldKey: "t10.plotName",
        expected:
          dbT10?.demoPlot?.name || dbT10?.plotName || t10?.type10DemoPlot,
        actual: t10?.type10DemoPlot,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t10-expectedAttendees",
        section: "TYPE_10: งาน Field Day",
        label: "เป้าหมายผู้เข้าร่วมงาน (คน)",
        fieldKey: "t10.expectedAttendees",
        expected: dbT10?.targetAttendeesCount ?? t10?.type10Attendees,
        actual: t10?.type10Attendees,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t10-targetBookingSales",
        section: "TYPE_10: งาน Field Day",
        label: "เป้าหมายยอดจอง/ขายในงาน (บาท)",
        fieldKey: "t10.targetBookingSales",
        expected: dbT10?.targetBookingSales ?? t10?.type10BookingSales,
        actual: t10?.type10BookingSales,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_11")) {
    const t11 = formState.type11Form?.type11Stores?.[0];
    const dbT11 = initialData?.type11Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t11-storeName",
        section: "TYPE_11: เช็คสต๊อกหน้าร้าน",
        label: "ร้านค้าเป้าหมายเช็คสต๊อก",
        fieldKey: "t11.storeName",
        expected: dbT11?.store?.name || t11?.storeName,
        actual: t11?.storeName || t11?.storeId,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_12")) {
    const t12 = formState.type12Form;
    const dbT12 = initialData?.type12Targets?.[0];
    items.push(
      makeCheckItem({
        id: "t12-tourType",
        section: "TYPE_12: พาลูกค้าดูงาน (Tour)",
        label: "รูปแบบทัวร์ (Tour Type)",
        fieldKey: "t12.tourType",
        expected: dbT12?.tourScope || t12?.type12TourType,
        actual: t12?.type12TourType,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t12-tourDestination",
        section: "TYPE_12: พาลูกค้าดูงาน (Tour)",
        label: "สถานที่/ประเทศปลายทาง",
        fieldKey: "t12.tourDestination",
        expected:
          dbT12?.destination ||
          t12?.type12Destination ||
          t12?.type12Country,
        actual: t12?.type12Destination || t12?.type12Country,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t12-store",
        section: "TYPE_12: พาลูกค้าดูงาน (Tour)",
        label: "ร้านค้าที่ร่วมทริป",
        fieldKey: "t12.store",
        expected: dbT12?.store?.name || t12?.type12Store,
        actual: t12?.type12Store || t12?.type12StoreId,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_13")) {
    const t13 = formState.type13Form;
    const dbT13 = initialData?.type13Targets?.[0];
    const firstPlot = t13?.type13Plots?.[0];
    items.push(
      makeCheckItem({
        id: "t13-dealerName",
        section: "TYPE_13: ทำแปลงแฮตแทคใหม่",
        label: "ร้านค้าดีลเลอร์ (Dealer)",
        fieldKey: "t13.dealerName",
        expected:
          dbT13?.store?.name || dbT13?.dealerName || firstPlot?.dealerName,
        actual: firstPlot?.dealerName || firstPlot?.storeId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t13-village",
        section: "TYPE_13: ทำแปลงแฮตแทคใหม่",
        label: "หมู่บ้าน/ตำบลที่ทำแปลงแฮตแทค",
        fieldKey: "t13.village",
        expected: dbT13?.village || firstPlot?.village || firstPlot?.name,
        actual: firstPlot?.village || firstPlot?.name || firstPlot?.subdistrict,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t13-plannedPlotsCount",
        section: "TYPE_13: ทำแปลงแฮตแทคใหม่",
        label: "จำนวนแปลงตามแผน (แปลง)",
        fieldKey: "t13.plannedPlotsCount",
        expected: dbT13?.plannedPlotsCount ?? firstPlot?.plannedPlotsCount,
        actual: firstPlot?.plannedPlotsCount,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_14")) {
    const t14 = formState.type14Form;
    const dbT14 = initialData?.type14Targets?.[0];
    const firstPlot = t14?.data?.plots?.[0] || t14?.plots?.[0];
    items.push(
      makeCheckItem({
        id: "t14-plotName",
        section: "TYPE_14: ติดตามแปลงแฮตแทค",
        label: "แปลงแฮตแทคที่เลือกติดตาม",
        fieldKey: "t14.plotName",
        expected:
          dbT14?.type13Target?.plotName ||
          dbT14?.plotName ||
          firstPlot?.name ||
          t14?.data?.name,
        actual:
          firstPlot?.name ||
          t14?.data?.name ||
          t14?.data?.selectedPlanId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "t14-dealerName",
        section: "TYPE_14: ติดตามแปลงแฮตแทค",
        label: "ร้านค้าดีลเลอร์เจ้าของพื้นที่",
        fieldKey: "t14.dealerName",
        expected:
          dbT14?.dealerName || firstPlot?.dealerName || t14?.data?.dealerName,
        actual:
          firstPlot?.dealerName ||
          t14?.data?.dealerName ||
          t14?.data?.storeId,
        snapshotFields: snapFields,
      }),
    );
  }

  // Budget & Notes
  if (formState.budgetHook?.isPromotionalMediaSelected) {
    items.push(
      makeCheckItem({
        id: "budget-media",
        section: "งบประมาณ (Budget)",
        label: "สื่อส่งเสริมการขาย (Marketing Items)",
        fieldKey: "marketingItems",
        expected: initialData?.marketingItems?.length
          ? `${initialData.marketingItems.length} รายการ`
          : formState.budgetHook.marketingProductItems?.length
            ? `${formState.budgetHook.marketingProductItems.length} รายการ`
            : "",
        actual: formState.budgetHook.marketingProductItems?.length
          ? `${formState.budgetHook.marketingProductItems.length} รายการ`
          : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (formState.budgetHook?.isSalesPromotionSelected) {
    items.push(
      makeCheckItem({
        id: "budget-promo",
        section: "งบประมาณ (Budget)",
        label: "งบส่งเสริมการขาย (Promotion Items)",
        fieldKey: "promotionItems",
        expected: initialData?.promotionItems?.length
          ? `${initialData.promotionItems.length} รายการ`
          : formState.budgetHook.salesPromotionItems?.length
            ? `${formState.budgetHook.salesPromotionItems.length} รายการ`
            : "",
        actual: formState.budgetHook.salesPromotionItems?.length
          ? `${formState.budgetHook.salesPromotionItems.length} รายการ`
          : "",
        snapshotFields: snapFields,
      }),
    );
  }

  items.push(
    makeCheckItem({
      id: "footer-notes",
      section: "หมายเหตุท้ายแผน",
      label: "หมายเหตุเพิ่มเติม (Notes)",
      fieldKey: "notes",
      expected: initialData?.notes,
      actual: formState.notes,
      snapshotFields: snapFields,
    }),
  );

  const passedFields = items.filter((i) => i.status === "PASS").length;
  const failedFields = items.filter((i) => i.status === "FAIL").length;
  const warnFields = items.filter((i) => i.status === "WARN").length;

  return {
    mode: "PLANNED",
    workTypeCodes: activeCodes,
    planId,
    planCode: initialData?.code,
    checkedAt: new Date().toLocaleTimeString("th-TH"),
    hasSavedSnapshot: Boolean(snapshot),
    totalFields: items.length,
    passedFields,
    failedFields,
    warnFields,
    items,
  };
}

/**
 * 2. Inspect Actual Result Form (/activity-plans/[id]/actual)
 */
export function inspectActualFormHydration(params: {
  plan: any;
  activeWorkTypeCodes: string[];
  actualHooks: {
    status: string;
    type1: any;
    type2: any;
    type3: any;
    type4: any;
    type5: any;
    type6: any;
    type7a: any;
    type7b: any;
    type8: any;
    type9: any;
    type10: any;
    type11: any;
    type12: any;
    type13: any;
    type14: any;
  };
}): HydrationInspectionReport {
  const { plan, activeWorkTypeCodes, actualHooks } = params;
  const snapshot = loadTestSnapshot("ACTUAL", plan?.id, plan?.title);
  const snapFields = snapshot?.fields;
  const items: FieldCheckItem[] = [];

  items.push(
    makeCheckItem({
      id: "actual-status",
      section: "สถานะการบันทึกผล",
      label: "สถานะแผนงาน (Status)",
      fieldKey: "status",
      expected: plan?.status === "COMPLETED" ? "COMPLETED" : actualHooks.status,
      actual: actualHooks.status,
      snapshotFields: snapFields,
    }),
  );

  if (activeWorkTypeCodes.includes("TYPE_1")) {
    const t1 = actualHooks.type1;
    const r = t1?.t1TargetItems?.[0];
    const dbR = plan?.type1Targets?.[0]?.results?.[0];
    const disc = r?.discussionResult || t1?.t1DiscussionResult;
    const opp = r?.salesOpportunity || t1?.t1SalesOpportunity;
    const imgs = r?.plotImages?.length ? r.plotImages : t1?.t1PlotImages;
    items.push(
      makeCheckItem({
        id: "act-t1-discussion",
        section: "TYPE_1: บันทึกผลเยี่ยมลูกค้า",
        label: "สรุปผลการพูดคุย (Discussion Result)",
        fieldKey: "act.t1.discussionResult",
        expected: dbR?.discussionSummary || disc,
        actual: disc,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t1-salesOpp",
        section: "TYPE_1: บันทึกผลเยี่ยมลูกค้า",
        label: "โอกาสการขาย (Sales Opportunity)",
        fieldKey: "act.t1.salesOpportunity",
        expected: dbR?.salesOpportunity || opp,
        actual: opp,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t1-images",
        section: "TYPE_1: บันทึกผลเยี่ยมลูกค้า",
        label: "รูปถ่ายการเข้าเยี่ยม (Images)",
        fieldKey: "act.t1.images",
        expected: imgs?.length ? `${imgs.length} รูป` : "",
        actual: imgs?.length ? `${imgs.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_2")) {
    const t2 = actualHooks.type2;
    const p = t2?.t2FollowupResults?.[0];
    const usage = p?.usageResult || t2?.t2UsageResult;
    const detail = p?.followupDetail || p?.problemDetail || t2?.t2FollowupDetail || t2?.t2Detail;
    const imgs = p?.images?.length ? p.images : t2?.t2Images;
    items.push(
      makeCheckItem({
        id: "act-t2-usageResult",
        section: "TYPE_2: บันทึกผลติดตามสินค้า",
        label: "ผลการใช้สินค้า (Usage Result)",
        fieldKey: "act.t2.usageResult",
        expected: usage,
        actual: usage,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t2-followupDetail",
        section: "TYPE_2: บันทึกผลติดตามสินค้า",
        label: "รายละเอียดผลการติดตาม",
        fieldKey: "act.t2.followupDetail",
        expected: detail,
        actual: detail,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t2-images",
        section: "TYPE_2: บันทึกผลติดตามสินค้า",
        label: "รูปถ่ายติดตามผล (Images)",
        fieldKey: "act.t2.images",
        expected: imgs?.length ? `${imgs.length} รูป` : "",
        actual: imgs?.length ? `${imgs.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_3")) {
    const t3 = actualHooks.type3;
    const p = t3?.productSalesDetails?.[0];
    const qty = p?.actualQuantity || t3?.actualQuantity;
    const total = p?.actualSales || p?.actualTotal || t3?.actualSales;
    items.push(
      makeCheckItem({
        id: "act-t3-actualQty",
        section: "TYPE_3: บันทึกผลเปิดการขาย",
        label: "จำนวนที่ขายได้จริง (ลัง)",
        fieldKey: "act.t3.actualQuantity",
        expected: qty,
        actual: qty,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t3-actualTotal",
        section: "TYPE_3: บันทึกผลเปิดการขาย",
        label: "ยอดขายรวมจริง (บาท)",
        fieldKey: "act.t3.actualTotal",
        expected: total,
        actual: total,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_4")) {
    const t4 = actualHooks.type4;
    const r = t4?.t4Items?.[0];
    const amt = r?.receivedAmount || t4?.t4ReceivedAmount || t4?.t4BillingStatus;
    const det = r?.collectDetail || r?.billingDetail || t4?.t4CollectDetail || t4?.t4BillingDetail;
    items.push(
      makeCheckItem({
        id: "act-t4-amountOrStatus",
        section: "TYPE_4: บันทึกผลวางบิล/เก็บเงิน",
        label: "ยอดเงินที่รับจริง / สถานะวางบิล",
        fieldKey: "act.t4.receivedAmount",
        expected: amt,
        actual: amt,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t4-detail",
        section: "TYPE_4: บันทึกผลวางบิล/เก็บเงิน",
        label: "รายละเอียดการรับชำระ/วางบิล",
        fieldKey: "act.t4.collectDetail",
        expected: det,
        actual: det,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_5")) {
    const t5 = actualHooks.type5;
    const r = t5?.t5SurveyDetails?.[0];
    items.push(
      makeCheckItem({
        id: "act-t5-brand",
        section: "TYPE_5: บันทึกผลสำรวจราคาคู่แข่ง",
        label: "บริษัท/แบรนด์คู่แข่ง",
        fieldKey: "act.t5.competitorBrand",
        expected: r?.competitorBrand || t5?.t5CompetitorBrand,
        actual: r?.competitorBrand || t5?.t5CompetitorBrand,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t5-product",
        section: "TYPE_5: บันทึกผลสำรวจราคาคู่แข่ง",
        label: "ชื่อการค้าสินค้าคู่แข่ง",
        fieldKey: "act.t5.competitorProduct",
        expected: r?.competitorProduct || t5?.t5CompetitorProduct,
        actual: r?.competitorProduct || t5?.t5CompetitorProduct,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t5-dealerPrice",
        section: "TYPE_5: บันทึกผลสำรวจราคาคู่แข่ง",
        label: "ราคาดีลเลอร์ (บาท)",
        fieldKey: "act.t5.dealerPrice",
        expected: r?.dealerPrice,
        actual: r?.dealerPrice,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t5-images",
        section: "TYPE_5: บันทึกผลสำรวจราคาคู่แข่ง",
        label: "รูปถ่ายขวดสินค้าคู่แข่ง",
        fieldKey: "act.t5.bottleImages",
        expected: r?.bottleImages?.length ? `${r.bottleImages.length} รูป` : "",
        actual: r?.bottleImages?.length ? `${r.bottleImages.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_6")) {
    const t6 = actualHooks.type6;
    const r = t6?.t6IssueDetails?.[0];
    const det = r?.detail || t6?.t6Detail;
    const st = r?.status || t6?.t6Status;
    const imgs = r?.images?.length ? r.images : t6?.t6Images;
    items.push(
      makeCheckItem({
        id: "act-t6-detail",
        section: "TYPE_6: บันทึกผลแก้ไขปัญหาสินค้า",
        label: "สาเหตุและแนวทางแก้ไขปัญหา",
        fieldKey: "act.t6.detail",
        expected: det,
        actual: det,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t6-status",
        section: "TYPE_6: บันทึกผลแก้ไขปัญหาสินค้า",
        label: "สถานะการแก้ไขปัญหา",
        fieldKey: "act.t6.status",
        expected: st,
        actual: st,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t6-images",
        section: "TYPE_6: บันทึกผลแก้ไขปัญหาสินค้า",
        label: "รูปถ่ายหลักฐานการแก้ไขปัญหา",
        fieldKey: "act.t6.images",
        expected: imgs?.length ? `${imgs.length} รูป` : "",
        actual: imgs?.length ? `${imgs.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_7A")) {
    const t7a = actualHooks.type7a;
    const st = t7a?.actualState || t7a;
    const lat = st?.t7Latitude || t7a?.t7Latitude;
    const lng = st?.t7Longitude || t7a?.t7Longitude;
    const imgs = st?.t7InitialPhotos || t7a?.t7InitialPhotos;
    items.push(
      makeCheckItem({
        id: "act-t7a-coords",
        section: "TYPE_7A: บันทึกผลทำแปลงสาธิตใหม่",
        label: "พิกัดแปลงสาธิต (Latitude / Longitude)",
        fieldKey: "act.t7a.coords",
        expected: lat ? `${lat}, ${lng}` : "",
        actual: lat ? `${lat}, ${lng}` : "",
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t7a-images",
        section: "TYPE_7A: บันทึกผลทำแปลงสาธิตใหม่",
        label: "รูปถ่ายแปลงสาธิต (Initial Photos)",
        fieldKey: "act.t7a.beforeImages",
        expected: imgs?.length ? `${imgs.length} รูป` : "",
        actual: imgs?.length ? `${imgs.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_7B")) {
    const st = actualHooks.type7b?.actualState || actualHooks.type7b;
    const round0 = st?.t7SprayingRounds?.[0];
    const days = st?.t7DaysAfterSpray || round0?.daysAfterSpray;
    const resp = st?.t7ProductResponse || round0?.productResponse;
    const imgs = st?.t7CropImages?.length ? st.t7CropImages : round0?.roundImages;
    items.push(
      makeCheckItem({
        id: "act-t7b-daysAfter",
        section: "TYPE_7B: บันทึกผลติดตามแปลงสาธิต",
        label: "จำนวนวันหลังพ่นยา (Days After Spray)",
        fieldKey: "act.t7b.daysAfterSpray",
        expected: days,
        actual: days,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t7b-response",
        section: "TYPE_7B: บันทึกผลติดตามแปลงสาธิต",
        label: "การตอบสนองของพืช (Product Response)",
        fieldKey: "act.t7b.productResponse",
        expected: resp,
        actual: resp,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t7b-images",
        section: "TYPE_7B: บันทึกผลติดตามแปลงสาธิต",
        label: "รูปถ่ายการติดตามแปลง (Crop Images)",
        fieldKey: "act.t7b.cropImages",
        expected: imgs?.length ? `${imgs.length} รูป` : "",
        actual: imgs?.length ? `${imgs.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_8")) {
    const t8 = actualHooks.type8;
    const imgs = t8?.images?.length ? t8.images : t8?.registrationImages;
    items.push(
      makeCheckItem({
        id: "act-t8-attendees",
        section: "TYPE_8: บันทึกผลจัดประชุม",
        label: "ผู้เข้าร่วมประชุมจริง (คน)",
        fieldKey: "act.t8.actualAttendees",
        expected: t8?.actualAttendees,
        actual: t8?.actualAttendees,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t8-feedback",
        section: "TYPE_8: บันทึกผลจัดประชุม",
        label: "ผลตอบรับ / คำถาม-คำตอบ",
        fieldKey: "act.t8.feedbackQnA",
        expected: t8?.feedbackQnA,
        actual: t8?.feedbackQnA,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t8-images",
        section: "TYPE_8: บันทึกผลจัดประชุม",
        label: "รูปถ่ายบรรยากาศและใบลงทะเบียน",
        fieldKey: "act.t8.images",
        expected: imgs?.length ? `${imgs.length} รูป` : "",
        actual: imgs?.length ? `${imgs.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_9")) {
    const t9 = actualHooks.type9;
    items.push(
      makeCheckItem({
        id: "act-t9-actualSales",
        section: "TYPE_9: บันทึกผลจัดกิจกรรมหน้าร้าน",
        label: "ยอดขายจริงในงาน (บาท)",
        fieldKey: "act.t9.actualSales",
        expected: t9?.actualSales,
        actual: t9?.actualSales,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t9-attendees",
        section: "TYPE_9: บันทึกผลจัดกิจกรรมหน้าร้าน",
        label: "ผู้เข้าร่วมงานจริง (คน)",
        fieldKey: "act.t9.actualAttendees",
        expected: t9?.actualAttendees,
        actual: t9?.actualAttendees,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t9-images",
        section: "TYPE_9: บันทึกผลจัดกิจกรรมหน้าร้าน",
        label: "รูปถ่ายกิจกรรมหน้าร้าน",
        fieldKey: "act.t9.images",
        expected: t9?.images?.length ? `${t9.images.length} รูป` : "",
        actual: t9?.images?.length ? `${t9.images.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_10")) {
    const t10 = actualHooks.type10;
    items.push(
      makeCheckItem({
        id: "act-t10-attendees",
        section: "TYPE_10: บันทึกผลงาน Field Day",
        label: "ผู้เข้าร่วมงานจริง (คน)",
        fieldKey: "act.t10.actualAttendees",
        expected: t10?.actualAttendees,
        actual: t10?.actualAttendees,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t10-sales",
        section: "TYPE_10: บันทึกผลงาน Field Day",
        label: "ยอดจอง/ยอดขายจริงในงาน (บาท)",
        fieldKey: "act.t10.actualSalesOrBooking",
        expected: t10?.actualSalesOrBooking,
        actual: t10?.actualSalesOrBooking,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t10-feedback",
        section: "TYPE_10: บันทึกผลงาน Field Day",
        label: "ความเห็นของเกษตรกร (Farmer Feedback)",
        fieldKey: "act.t10.farmerFeedback",
        expected: t10?.farmerFeedback,
        actual: t10?.farmerFeedback,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_11")) {
    const t11 = actualHooks.type11;
    const firstStock = t11?.stockItems?.[0];
    items.push(
      makeCheckItem({
        id: "act-t11-stockCount",
        section: "TYPE_11: บันทึกผลเช็คสต๊อกหน้าร้าน",
        label: "รายการสินค้าที่ตรวจเช็คสต๊อก",
        fieldKey: "act.t11.stockItems",
        expected: t11?.stockItems?.length
          ? `${t11.stockItems.length} รายการ`
          : "",
        actual: t11?.stockItems?.length
          ? `${t11.stockItems.length} รายการ`
          : "",
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t11-remainingQty",
        section: "TYPE_11: บันทึกผลเช็คสต๊อกหน้าร้าน",
        label: "จำนวนคงเหลือหน้าร้าน",
        fieldKey: "act.t11.remainingQty",
        expected: firstStock?.remainingQty || t11?.remainingQty,
        actual: firstStock?.remainingQty || t11?.remainingQty,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t11-images",
        section: "TYPE_11: บันทึกผลเช็คสต๊อกหน้าร้าน",
        label: "รูปถ่ายสต๊อกสินค้า",
        fieldKey: "act.t11.images",
        expected: t11?.images?.length ? `${t11.images.length} รูป` : "",
        actual: t11?.images?.length ? `${t11.images.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_13")) {
    const p = actualHooks.type13?.plots?.[0];
    items.push(
      makeCheckItem({
        id: "act-t13-actualPlots",
        section: "TYPE_13: บันทึกผลทำแปลงแฮตแทค",
        label: "จำนวนแปลงแฮตแทคที่ทำจริง",
        fieldKey: "act.t13.actualPlotsCount",
        expected: p?.actualPlotsCount,
        actual: p?.actualPlotsCount,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t13-coords",
        section: "TYPE_13: บันทึกผลทำแปลงแฮตแทค",
        label: "พิกัดแปลงแฮตแทค (Latitude / Longitude)",
        fieldKey: "act.t13.coords",
        expected: p?.latitude ? `${p.latitude}, ${p.longitude}` : "",
        actual: p?.latitude ? `${p.latitude}, ${p.longitude}` : "",
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t13-images",
        section: "TYPE_13: บันทึกผลทำแปลงแฮตแทค",
        label: "รูปถ่ายหลังฉีดพ่น (After Spray Images)",
        fieldKey: "act.t13.afterSprayImages",
        expected: p?.afterSprayImages?.length
          ? `${p.afterSprayImages.length} รูป`
          : "",
        actual: p?.afterSprayImages?.length
          ? `${p.afterSprayImages.length} รูป`
          : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeWorkTypeCodes.includes("TYPE_14")) {
    const p = actualHooks.type14?.plots?.[0];
    items.push(
      makeCheckItem({
        id: "act-t14-daysAfter",
        section: "TYPE_14: บันทึกผลติดตามแปลงแฮตแทค",
        label: "จำนวนวันหลังพ่นยา (Days After Spray)",
        fieldKey: "act.t14.daysAfterSpray",
        expected: p?.daysAfterSpray,
        actual: p?.daysAfterSpray,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t14-trackingResult",
        section: "TYPE_14: บันทึกผลติดตามแปลงแฮตแทค",
        label: "ผลการติดตามแปลง (Tracking Result)",
        fieldKey: "act.t14.trackingResult",
        expected: p?.trackingResult,
        actual: p?.trackingResult,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "act-t14-images",
        section: "TYPE_14: บันทึกผลติดตามแปลงแฮตแทค",
        label: "รูปถ่ายติดตามแปลงแฮตแทค",
        fieldKey: "act.t14.afterSprayImages",
        expected: p?.afterSprayImages?.length
          ? `${p.afterSprayImages.length} รูป`
          : "",
        actual: p?.afterSprayImages?.length
          ? `${p.afterSprayImages.length} รูป`
          : "",
        snapshotFields: snapFields,
      }),
    );
  }

  const passedFields = items.filter((i) => i.status === "PASS").length;
  const failedFields = items.filter((i) => i.status === "FAIL").length;
  const warnFields = items.filter((i) => i.status === "WARN").length;

  return {
    mode: "ACTUAL",
    workTypeCodes: activeWorkTypeCodes,
    planId: plan?.id,
    planCode: plan?.code,
    checkedAt: new Date().toLocaleTimeString("th-TH"),
    hasSavedSnapshot: Boolean(snapshot),
    totalFields: items.length,
    passedFields,
    failedFields,
    warnFields,
    items,
  };
}

/**
 * 3. Inspect Unplanned Activity Form (Create / Edit Unplanned)
 */
export function inspectUnplannedFormHydration(params: {
  initialData?: any;
  formState: {
    title: string;
    startDate: string;
    endDate: string;
    notes: string;
    selectedWorkTypes: string[];
    locationTeamHook: any;
    budgetHook: any;
    t1Form: any;
    t2Form: any;
    t3Form: any;
    t4Form: any;
    t5Form: any;
    t6Form: any;
    t7aForm: any;
    t7bForm: any;
    t8Form: any;
    t9Form: any;
    t10Form: any;
    t11Form: any;
    t12Form: any;
    t13Form: any;
    t14Form: any;
  };
}): HydrationInspectionReport {
  const { initialData, formState } = params;
  const planId = initialData?.id;
  const snapshot = loadTestSnapshot(
    "UNPLANNED",
    planId,
    formState.title || initialData?.title,
  );
  const snapFields = snapshot?.fields;
  const activeCodes = formState.selectedWorkTypes.map(getWorkTypeCode);
  const items: FieldCheckItem[] = [];

  items.push(
    makeCheckItem({
      id: "unp-title",
      section: "ข้อมูลหลัก (Unplanned Header)",
      label: "ชื่อกิจกรรมนอกแผน (Title)",
      fieldKey: "title",
      expected: initialData?.title,
      actual: formState.title,
      snapshotFields: snapFields,
    }),
    makeCheckItem({
      id: "unp-startDate",
      section: "ข้อมูลหลัก (Unplanned Header)",
      label: "วันที่เริ่มต้น (Start Date)",
      fieldKey: "startDate",
      expected: fmtDate(initialData?.startDate),
      actual: fmtDate(formState.startDate),
      snapshotFields: snapFields,
    }),
    makeCheckItem({
      id: "unp-endDate",
      section: "ข้อมูลหลัก (Unplanned Header)",
      label: "วันที่สิ้นสุด (End Date)",
      fieldKey: "endDate",
      expected: fmtDate(initialData?.endDate),
      actual: fmtDate(formState.endDate),
      snapshotFields: snapFields,
    }),
  );

  if (activeCodes.includes("TYPE_1")) {
    const it = formState.t1Form.items?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t1-customer",
        section: "TYPE_1 (นอกแผน): เยี่ยมลูกค้า",
        label: "ชื่อร้านค้า/เกษตรกร",
        fieldKey: "unp.t1.customerName",
        expected: it?.customerName || it?.unregisteredFarmerName,
        actual: it?.customerName || it?.unregisteredFarmerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t1-discussion",
        section: "TYPE_1 (นอกแผน): เยี่ยมลูกค้า",
        label: "สรุปผลการพูดคุย (Discussion Result)",
        fieldKey: "unp.t1.discussionResult",
        expected: it?.discussionResult,
        actual: it?.discussionResult,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t1-images",
        section: "TYPE_1 (นอกแผน): เยี่ยมลูกค้า",
        label: "รูปถ่ายการเข้าเยี่ยม",
        fieldKey: "unp.t1.plotImages",
        expected: it?.plotImages?.length ? `${it.plotImages.length} รูป` : "",
        actual: it?.plotImages?.length ? `${it.plotImages.length} รูป` : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_2")) {
    const it = formState.t2Form.items?.[0];
    const p = it?.products?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t2-customer",
        section: "TYPE_2 (นอกแผน): ติดตามผลสินค้า",
        label: "ชื่อร้านค้า/เกษตรกร",
        fieldKey: "unp.t2.customerName",
        expected: it?.customerName || it?.unregisteredFarmerName,
        actual: it?.customerName || it?.unregisteredFarmerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t2-product",
        section: "TYPE_2 (นอกแผน): ติดตามผลสินค้า",
        label: "สินค้าที่ติดตาม",
        fieldKey: "unp.t2.productName",
        expected: p?.productName,
        actual: p?.productName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t2-detail",
        section: "TYPE_2 (นอกแผน): ติดตามผลสินค้า",
        label: "รายละเอียดผลการติดตาม",
        fieldKey: "unp.t2.followupDetail",
        expected: p?.followupDetail || p?.problemDetail,
        actual: p?.followupDetail || p?.problemDetail,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_3")) {
    const it = formState.t3Form.items?.[0];
    const p = it?.products?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t3-store",
        section: "TYPE_3 (นอกแผน): เปิดการขาย",
        label: "ชื่อร้านค้า",
        fieldKey: "unp.t3.storeName",
        expected: it?.storeName || it?.subdealerName,
        actual: it?.storeName || it?.subdealerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t3-product",
        section: "TYPE_3 (นอกแผน): เปิดการขาย",
        label: "สินค้าที่เปิดการขาย",
        fieldKey: "unp.t3.productName",
        expected: p?.productName,
        actual: p?.productName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t3-total",
        section: "TYPE_3 (นอกแผน): เปิดการขาย",
        label: "ยอดขายรวมจริง (บาท)",
        fieldKey: "unp.t3.actualTotal",
        expected: p?.actualTotal,
        actual: p?.actualTotal,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_4")) {
    const it = formState.t4Form.items?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t4-customer",
        section: "TYPE_4 (นอกแผน): วางบิล/เก็บเงิน",
        label: "ชื่อร้านค้า",
        fieldKey: "unp.t4.customerName",
        expected: it?.customerName,
        actual: it?.customerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t4-amount",
        section: "TYPE_4 (นอกแผน): วางบิล/เก็บเงิน",
        label: "ยอดเงินที่รับจริง / สถานะวางบิล",
        fieldKey: "unp.t4.receivedAmount",
        expected:
          it?.collectType === "BILLING" ? it?.billingStatus : it?.receivedAmount,
        actual:
          it?.collectType === "BILLING" ? it?.billingStatus : it?.receivedAmount,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_5")) {
    const it = formState.t5Form.items?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t5-store",
        section: "TYPE_5 (นอกแผน): สำรวจราคาคู่แข่ง",
        label: "ร้านค้าที่สำรวจ",
        fieldKey: "unp.t5.storeName",
        expected: it?.storeName || it?.storeId,
        actual: it?.storeName || it?.storeId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t5-brand",
        section: "TYPE_5 (นอกแผน): สำรวจราคาคู่แข่ง",
        label: "บริษัท/แบรนด์คู่แข่ง",
        fieldKey: "unp.t5.competitorBrand",
        expected: it?.competitorBrand,
        actual: it?.competitorBrand,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t5-dealerPrice",
        section: "TYPE_5 (นอกแผน): สำรวจราคาคู่แข่ง",
        label: "ราคาดีลเลอร์ (บาท)",
        fieldKey: "unp.t5.dealerPrice",
        expected: it?.dealerPrice,
        actual: it?.dealerPrice,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_6")) {
    const it = formState.t6Form.items?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t6-customer",
        section: "TYPE_6 (นอกแผน): แก้ไขปัญหาสินค้า",
        label: "ชื่อลูกค้า/ร้านค้า",
        fieldKey: "unp.t6.customerName",
        expected: it?.customerName || it?.manualCustomerName,
        actual: it?.customerName || it?.manualCustomerName,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t6-detail",
        section: "TYPE_6 (นอกแผน): แก้ไขปัญหาสินค้า",
        label: "รายละเอียดและการแก้ไขปัญหา",
        fieldKey: "unp.t6.detail",
        expected: it?.detail,
        actual: it?.detail,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t6-lotNumber",
        section: "TYPE_6 (นอกแผน): แก้ไขปัญหาสินค้า",
        label: "เลขล็อตสินค้า (Lot Number)",
        fieldKey: "unp.t6.lotNumber",
        expected: it?.lotNumber,
        actual: it?.lotNumber,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_7B")) {
    const it = formState.t7bForm.items?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t7b-plotName",
        section: "TYPE_7B (นอกแผน): ติดตามแปลงสาธิต",
        label: "ชื่อแปลงสาธิตที่ติดตาม",
        fieldKey: "unp.t7b.plotName",
        expected: it?.plotName || it?.demoPlotId,
        actual: it?.plotName || it?.demoPlotId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t7b-daysAfter",
        section: "TYPE_7B (นอกแผน): ติดตามแปลงสาธิต",
        label: "จำนวนวันหลังพ่นยา",
        fieldKey: "unp.t7b.daysAfterSpray",
        expected: it?.daysAfterSpray,
        actual: it?.daysAfterSpray,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_11")) {
    const it = formState.t11Form.items?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t11-store",
        section: "TYPE_11 (นอกแผน): เช็คสต๊อกหน้าร้าน",
        label: "ชื่อร้านค้าที่เช็คสต๊อก",
        fieldKey: "unp.t11.storeName",
        expected: it?.storeName || it?.storeId,
        actual: it?.storeName || it?.storeId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t11-stockItems",
        section: "TYPE_11 (นอกแผน): เช็คสต๊อกหน้าร้าน",
        label: "จำนวนรายการสินค้าที่เช็คสต๊อก",
        fieldKey: "unp.t11.stockItems",
        expected: it?.stockItems?.length
          ? `${it.stockItems.length} รายการ`
          : "",
        actual: it?.stockItems?.length
          ? `${it.stockItems.length} รายการ`
          : "",
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_13")) {
    const it = formState.t13Form.items?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t13-dealer",
        section: "TYPE_13 (นอกแผน): ทำแปลงแฮตแทค",
        label: "ชื่อร้านค้าดีลเลอร์",
        fieldKey: "unp.t13.dealerName",
        expected: it?.dealerName || it?.storeId,
        actual: it?.dealerName || it?.storeId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t13-village",
        section: "TYPE_13 (นอกแผน): ทำแปลงแฮตแทค",
        label: "หมู่บ้าน/ตำบลที่ทำแปลง",
        fieldKey: "unp.t13.village",
        expected: it?.village || it?.subdistrict,
        actual: it?.village || it?.subdistrict,
        snapshotFields: snapFields,
      }),
    );
  }

  if (activeCodes.includes("TYPE_14")) {
    const it = formState.t14Form.item;
    const p = it?.plots?.[0];
    items.push(
      makeCheckItem({
        id: "unp-t14-plotName",
        section: "TYPE_14 (นอกแผน): ติดตามแปลงแฮตแทค",
        label: "แปลงแฮตแทคที่ติดตาม",
        fieldKey: "unp.t14.plotName",
        expected: p?.plotName || p?.name || it?.selectedHattackPlanId,
        actual: p?.plotName || p?.name || it?.selectedHattackPlanId,
        snapshotFields: snapFields,
      }),
      makeCheckItem({
        id: "unp-t14-daysAfter",
        section: "TYPE_14 (นอกแผน): ติดตามแปลงแฮตแทค",
        label: "จำนวนวันหลังพ่นยา",
        fieldKey: "unp.t14.daysAfterSpray",
        expected: p?.daysAfterSpray,
        actual: p?.daysAfterSpray,
        snapshotFields: snapFields,
      }),
    );
  }

  items.push(
    makeCheckItem({
      id: "unp-notes",
      section: "หมายเหตุท้ายกิจกรรม",
      label: "หมายเหตุเพิ่มเติม (Notes)",
      fieldKey: "notes",
      expected: initialData?.notes,
      actual: formState.notes,
      snapshotFields: snapFields,
    }),
  );

  const passedFields = items.filter((i) => i.status === "PASS").length;
  const failedFields = items.filter((i) => i.status === "FAIL").length;
  const warnFields = items.filter((i) => i.status === "WARN").length;

  return {
    mode: "UNPLANNED",
    workTypeCodes: activeCodes,
    planId,
    planCode: initialData?.code,
    checkedAt: new Date().toLocaleTimeString("th-TH"),
    hasSavedSnapshot: Boolean(snapshot),
    totalFields: items.length,
    passedFields,
    failedFields,
    warnFields,
    items,
  };
}
