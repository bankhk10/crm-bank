import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import fs from "fs";
import path from "path";
import { format } from "date-fns";
import { th } from "date-fns/locale";

let cachedBase64Logo: string | null = null;

/**
 * Returns Base64 data URL for the company PDF logo
 */
export function getBase64Logo(): string {
  if (cachedBase64Logo) return cachedBase64Logo;

  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo_pdf.png");
    if (fs.existsSync(logoPath)) {
      const bitmap = fs.readFileSync(logoPath);
      cachedBase64Logo = `data:image/png;base64,${bitmap.toString("base64")}`;
      return cachedBase64Logo;
    }
  } catch (err) {
    console.error("Failed to read logo_pdf.png:", err);
  }
  return "";
}

/**
 * Formats a Date or date string to Thai formatted string (e.g. "15 พ.ย. 2569" or "15/11/2026")
 */
export function formatDateThai(
  date?: Date | string | null,
  formatPattern: string = "d MMM yyyy",
): string {
  if (!date) return "-";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    if (isNaN(d.getTime())) return String(date);
    return format(d, formatPattern, { locale: th });
  } catch {
    return String(date);
  }
}

/**
 * Formats a number to currency format (e.g. "1,500.00")
 */
export function formatMoney(amount?: number | string | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) return "0.00";
  return Number(amount).toLocaleString("th-TH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formats an integer or quantity
 */
export function formatQty(qty?: number | string | null): string {
  if (qty === undefined || qty === null || isNaN(Number(qty))) return "0";
  return Number(qty).toLocaleString("th-TH");
}

/**
 * Safe HTML escape
 */
export function safeHtml(value?: string | number | null): string {
  if (value === undefined || value === null) return "-";
  const s = String(value).trim();
  if (!s) return "-";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Formats a store's address components into a clean Thai address string
 */
export function formatStoreAddress(store?: {
  addressLine?: string | null;
  subdistrict?: string | null;
  district?: string | null;
  province?: string | null;
  postalCode?: string | null;
} | null): string | null {
  if (!store) return null;

  const parts: string[] = [];

  const addressLine = store.addressLine?.trim();
  if (addressLine) {
    parts.push(addressLine);
  }

  const prov = store.province?.trim() || "";
  const isBkk = prov.includes("กรุงเทพ");

  const subdistrict = store.subdistrict?.trim();
  if (subdistrict) {
    if (
      subdistrict.startsWith("ต.") ||
      subdistrict.startsWith("ตำบล") ||
      subdistrict.startsWith("แขวง")
    ) {
      parts.push(subdistrict);
    } else {
      parts.push(isBkk ? `แขวง${subdistrict}` : `ต.${subdistrict}`);
    }
  }

  const district = store.district?.trim();
  if (district) {
    if (
      district.startsWith("อ.") ||
      district.startsWith("อำเภอ") ||
      district.startsWith("เขต")
    ) {
      parts.push(district);
    } else {
      parts.push(isBkk ? `เขต${district}` : `อ.${district}`);
    }
  }

  if (prov) {
    if (prov.startsWith("จ.") || prov.startsWith("จังหวัด") || isBkk) {
      parts.push(prov);
    } else {
      parts.push(`จ.${prov}`);
    }
  }

  const postalCode = store.postalCode?.trim();
  if (postalCode) {
    parts.push(postalCode);
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

/**
 * Extracts store / target addresses from all targets of an ActivityPlan
 */
export function extractTargetAddresses(p: ActivityPlanWithRelations): string[] {
  const addresses = new Set<string>();

  const addStore = (storeObj: any) => {
    if (!storeObj) return;
    const formatted = formatStoreAddress(storeObj);
    if (formatted) {
      addresses.add(formatted);
    }
  };

  // 1. Dedicated Type 1 targets
  if (Array.isArray((p as any).type1Targets)) {
    (p as any).type1Targets.forEach((t: any) => {
      addStore(t.store);
      if (!t.store && t.province) {
        const prov = t.province.trim();
        addresses.add(prov.startsWith("จ.") ? prov : `จ.${prov}`);
      }
    });
  }

  // 2. Dedicated Type 2 targets
  if (Array.isArray((p as any).type2Targets)) {
    (p as any).type2Targets.forEach((t: any) => {
      addStore(t.store);
    });
  }

  // 3. Dedicated Type 3, 4 targets
  if (Array.isArray((p as any).type3Targets)) {
    (p as any).type3Targets.forEach((t: any) => {
      addStore(t.store);
    });
  }
  if (Array.isArray((p as any).type4Targets)) {
    (p as any).type4Targets.forEach((t: any) => {
      addStore(t.store);
    });
  }

  // 4. Dedicated Type 5, 6 targets
  if (Array.isArray((p as any).type5Targets)) {
    (p as any).type5Targets.forEach((t: any) => {
      addStore(t.store);
    });
  }
  if (Array.isArray((p as any).type6Targets)) {
    (p as any).type6Targets.forEach((t: any) => {
      addStore(t.store);
    });
  }

  // 5. Dedicated Type 7A targets (Demo Plots)
  if (Array.isArray((p as any).type7aTargets)) {
    (p as any).type7aTargets.forEach((t: any) => {
      addStore(t.store);
      if (t.district || t.province) {
        const plotAddr = formatStoreAddress({
          district: t.district,
          province: t.province,
          subdistrict: t.subdistrict,
        });
        if (plotAddr) addresses.add(plotAddr);
      }
    });
  }

  // 6. Dedicated Type 7B targets
  if (Array.isArray((p as any).type7bTargets)) {
    (p as any).type7bTargets.forEach((t: any) => {
      addStore(t.store || t.type7aTarget?.store);
    });
  }

  // 7. Dedicated Type 8 targets (Meeting / Training)
  if (Array.isArray((p as any).type8Targets)) {
    (p as any).type8Targets.forEach((t: any) => {
      addStore(t.store || t.subdealer || t.dealer);
    });
  }

  // 8. Dedicated Type 9 targets (Store Promotion)
  if (Array.isArray((p as any).type9Targets)) {
    (p as any).type9Targets.forEach((t: any) => {
      addStore(t.subdealer || t.dealer || t.store);
      if (t.district || t.province) {
        const directAddr = formatStoreAddress({
          district: t.district,
          province: t.province,
        });
        if (directAddr) addresses.add(directAddr);
      }
    });
  }

  // 9. Dedicated Type 10 targets
  if (Array.isArray((p as any).type10Targets)) {
    (p as any).type10Targets.forEach((t: any) => {
      addStore(t.store || t.type7aTarget?.store);
    });
  }

  // 10. Dedicated Type 11 targets
  if (Array.isArray((p as any).type11Targets)) {
    (p as any).type11Targets.forEach((t: any) => {
      addStore(t.store || t.dealer);
    });
  }

  // 11. Dedicated Type 12 targets
  if (Array.isArray((p as any).type12Targets)) {
    (p as any).type12Targets.forEach((t: any) => {
      addStore(t.store);
    });
  }

  // 12. Dedicated Type 13, 14 targets
  if (Array.isArray((p as any).type13Targets)) {
    (p as any).type13Targets.forEach((t: any) => {
      addStore(t.store);
    });
  }
  if (Array.isArray((p as any).type14Targets)) {
    (p as any).type14Targets.forEach((t: any) => {
      addStore(t.store || t.type13Target?.store);
    });
  }

  // 13. Stores relation (if any)
  if (Array.isArray((p as any).stores)) {
    (p as any).stores.forEach((s: any) => {
      addStore(s.store || s);
    });
  }

  // Fallback to plan header location if no target store address was found
  if (addresses.size === 0) {
    const areaParts = [
      p.district && (p.district.startsWith("อ.") || p.district.startsWith("อำเภอ") ? p.district : `อ.${p.district}`),
      p.province && (p.province.startsWith("จ.") || p.province.startsWith("จังหวัด") || p.province.includes("กรุงเทพ") ? p.province : `จ.${p.province}`),
    ].filter(Boolean);
    const fallback =
      areaParts.length > 0 ? areaParts.join(" ") : p.location || "-";
    if (fallback && fallback !== "-") {
      addresses.add(fallback);
    }
  }

  return Array.from(addresses);
}

export interface PlanCreatorInfo {
  name: string;
  employeeCode: string;
  position: string;
  department: string;
  phone: string;
}

/**
 * Extracts comprehensive plan creator / employee information from ActivityPlan
 * Supports employee relation, user relation, createdBy relation, and fallback strings.
 */
export function resolvePlanCreatorInfo(plan: any): PlanCreatorInfo {
  if (!plan) {
    return { name: "-", employeeCode: "-", position: "-", department: "-", phone: "-" };
  }

  const emp = plan.employee;
  const createdBy = plan.createdBy || plan.creator;
  const user = emp?.user || createdBy;

  // 1. Resolve Creator Name
  let name = "";
  if (emp?.name && emp.name.trim()) {
    name = emp.name.trim();
  } else if (emp?.firstName || emp?.lastName) {
    name = [emp.prefix, emp.firstName, emp.lastName].filter(Boolean).join(" ").trim();
  } else if (user?.name && user.name.trim()) {
    name = user.name.trim();
  } else if (plan.createdByName && typeof plan.createdByName === "string") {
    name = plan.createdByName.trim();
  }

  // 2. Resolve Employee Code
  const employeeCode = emp?.employeeCode?.trim() || "";

  // 3. Resolve Position
  let position = "";
  if (emp?.position?.name && emp.position.name.trim()) {
    position = emp.position.name.trim();
  } else if (emp?.positionTitle && emp.positionTitle.trim()) {
    position = emp.positionTitle.trim();
  } else if (emp?.roleTitle && emp.roleTitle.trim()) {
    position = emp.roleTitle.trim();
  } else if (user?.position?.name && user.position.name.trim()) {
    position = user.position.name.trim();
  } else if (user?.position && typeof user.position === "string" && user.position.trim()) {
    position = user.position.trim();
  } else if (user?.roleTitle && user.roleTitle.trim()) {
    position = user.roleTitle.trim();
  }

  // 4. Resolve Department
  let department = "";
  if (emp?.department?.name && emp.department.name.trim()) {
    department = emp.department.name.trim();
  } else if (emp?.departmentName && emp.departmentName.trim()) {
    department = emp.departmentName.trim();
  } else if (user?.department?.name && user.department.name.trim()) {
    department = user.department.name.trim();
  } else if (user?.department && typeof user.department === "string" && user.department.trim()) {
    department = user.department.trim();
  }

  // 5. Resolve Phone
  const phone = emp?.phone?.trim() || user?.phone?.trim() || "";

  return {
    name: name || "-",
    employeeCode: employeeCode || "-",
    position: position || "-",
    department: department || "-",
    phone: phone || "-",
  };
}
