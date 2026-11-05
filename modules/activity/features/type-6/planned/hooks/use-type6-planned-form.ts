"use client";

import { useState } from "react";
import { getWorkTypeCode } from "@/modules/activity/constants";
import type { Type6IssueItem } from "../../shared/types";
import type {
  UseType6FormOptions,
  UseType6FormResult,
  UseType6PlannedFormOptions,
  UseType6PlannedFormResult,
} from "../types/planned.types";
import { validateType6FormItems } from "../application/planned-validation";

export type {
  UseType6FormOptions,
  UseType6FormResult,
  UseType6PlannedFormOptions,
  UseType6PlannedFormResult,
};

const isFieldDayItem = (item: any) =>
  item?.itemType === "FIELD_DAY" ||
  item?.workTypeCode === "TYPE_7A" ||
  item?.workTypeCode === "TYPE_7B";

export const normalizeType6Issue = (val?: string | null): string => {
  if (!val) return "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
  if (val === "อื่นๆ") return "อื่นๆ ระบุ";
  if (
    val === "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย" ||
    val === "เกิดความเสียหายหลังการใช้สินค้า" ||
    val === "อื่นๆ ระบุ"
  ) {
    return val;
  }
  return "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย";
};

export function useType6PlannedForm({
  initial = {},
  initDetails,
  customersList = [],
  selectedWorkTypes = [],
}: UseType6FormOptions): UseType6FormResult {
  const [type6Items, setType6Items] = useState<Type6IssueItem[]>(() => {
    const dedicatedTargets =
      (initial as any)?.type6Targets || (initDetails as any)?.type6Targets;
    if (
      dedicatedTargets &&
      Array.isArray(dedicatedTargets) &&
      dedicatedTargets.length > 0
    ) {
      return dedicatedTargets.map((t: any, idx: number) => {
        const isManual = Boolean(t.isManualCustomer);
        return {
          id: t.id || String(idx + 1),
          storeId: isManual ? null : t.storeId || null,
          customerName: isManual ? "" : t.customerName || t.store?.name || "",
          manualCustomerName: isManual ? t.customerName || "" : "",
          isManualCustomer: isManual,
          issueType: normalizeType6Issue(t.issueType),
          detail: t.detail || "",
        };
      });
    }

    if (
      initDetails?.type6Items &&
      Array.isArray(initDetails.type6Items) &&
      initDetails.type6Items.length > 0
    ) {
      return initDetails.type6Items.map((item: any) => {
        const isManual =
          item.isManualCustomer !== undefined
            ? item.isManualCustomer
            : !item.storeId &&
              Boolean(item.manualCustomerName || item.customerName);
        return {
          ...item,
          customerName: isManual ? "" : item.customerName || "",
          manualCustomerName: isManual
            ? item.manualCustomerName || item.customerName || ""
            : "",
          isManualCustomer: isManual,
          issueType: normalizeType6Issue(item.issueType),
        };
      });
    }
    const type6Stores = (initial as any)?.stores?.filter(
      (s: any) => s.workTypeCode === "TYPE_6",
    );
    if (type6Stores && type6Stores.length > 0) {
      return type6Stores.map((s: any, idx: number) => {
        const isManual = !s.storeId && Boolean(s.storeName);
        return {
          id: s.id || String(idx + 1),
          storeId: s.storeId || null,
          customerName: isManual ? "" : s.store?.name || s.storeName || "",
          manualCustomerName: isManual ? s.storeName || "" : "",
          isManualCustomer: isManual,
          issueType: normalizeType6Issue(s.remarks),
          detail: s.notes || "",
        };
      });
    }
    if (Array.isArray(initDetails) && initDetails.length > 0) {
      const items = initDetails.filter(
        (item: any) =>
          !isFieldDayItem(item) &&
          item.itemType !== "MARKETING_PRODUCT" &&
          item.itemType !== "SALES_PROMOTION" &&
          (item.itemType === "TYPE_6" || item.issueType),
      );
      if (items.length > 0) {
        return items.map((item: any, idx: number) => {
          const isManual =
            item.isManualCustomer !== undefined
              ? item.isManualCustomer
              : !item.storeId &&
                Boolean(item.manualCustomerName || item.customerName);
          return {
            id: item.id || String(idx + 1),
            storeId: item.storeId || null,
            customerName: isManual ? "" : item.customerName || "",
            manualCustomerName: isManual
              ? item.manualCustomerName || item.customerName || ""
              : "",
            isManualCustomer: isManual,
            issueType: normalizeType6Issue(item.issueType),
            detail: item.detail || "",
          };
        });
      }
    }
    return [
      {
        id: "1",
        customerName: "",
        manualCustomerName: "",
        isManualCustomer: false,
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "",
      },
    ];
  });

  const addType6Row = () => {
    setType6Items((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        customerName: "",
        manualCustomerName: "",
        isManualCustomer: false,
        issueType: "สินค้าหรือบรรจุภัณฑ์ชำรุด / เสียหาย",
        detail: "",
      },
    ]);
  };

  const updateType6Row = (
    id: string,
    field: keyof Type6IssueItem,
    val: any,
  ) => {
    setType6Items((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: val } : item)),
    );
  };

  const deleteType6Row = (id: string) => {
    setType6Items((prev) => prev.filter((item) => item.id !== id));
  };

  const validateType6 = (): { isValid: boolean; error?: string } => {
    return validateType6FormItems({
      items: type6Items,
      customersList,
      selectedWorkTypes,
    });
  };

  const mapType6Payload = (customers: any[]) => {
    const hasType6 = selectedWorkTypes.some(
      (t) => getWorkTypeCode(t) === "TYPE_6",
    );
    if (!hasType6) {
      return { planStores: [], type6Items: [] };
    }

    const planStores: Array<{
      workTypeCode: string;
      storeId: string | null;
      storeName: string | null;
      remarks?: string | null;
      notes?: string | null;
    }> = [];

    type6Items.forEach((item) => {
      const detailValue = item.detail?.trim() || null;

      if (item.isManualCustomer) {
        const manualName = (
          item.manualCustomerName ||
          item.customerName ||
          ""
        ).trim();
        if (manualName) {
          planStores.push({
            workTypeCode: "TYPE_6",
            storeId: null,
            storeName: manualName,
            remarks: item.issueType || null,
            notes: detailValue,
          });
        }
      } else {
        const sId =
          item.storeId ||
          customers.find((c) => c.name === item.customerName)?.id;
        if (sId) {
          const matchedCust = customers.find((c) => c.id === sId);
          planStores.push({
            workTypeCode: "TYPE_6",
            storeId: sId,
            storeName: matchedCust?.name || item.customerName || null,
            remarks: item.issueType || null,
            notes: detailValue,
          });
        }
      }
    });

    return { planStores, type6Items };
  };

  return {
    type6Items,
    setType6Items,
    addType6Row,
    updateType6Row,
    deleteType6Row,
    validateType6,
    mapType6Payload,
  };
}

// Backward-compatible alias
export const useType6Form = useType6PlannedForm;
