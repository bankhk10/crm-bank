"use client";

import { useState, useCallback, useMemo } from "react";
import type { Type15BoomItem } from "../../shared/types";
import type {
  UseType15PlannedFormOptions,
  UseType15PlannedFormResult,
} from "../types/planned.types";
import {
  mapType15InitialData,
  mapType15ToPayload,
} from "../application/planned-mapper";
import { validateType15Planned } from "../application/planned-validation";

export function useType15PlannedForm({
  initial,
  customersList = [],
}: UseType15PlannedFormOptions = {}): UseType15PlannedFormResult {
  const [type15Items, setType15Items] = useState<Type15BoomItem[]>(() =>
    mapType15InitialData(initial),
  );

  const addType15Row = useCallback(() => {
    setType15Items((prev) => [
      ...prev,
      {
        id: `t15-${Date.now()}`,
        isSubDealer: false,
        isUnregisteredSubdealer: false,
        village: "",
        objective: "",
        detail: "",
      },
    ]);
  }, []);

  const updateType15Row = useCallback(
    (id: string, field: keyof Type15BoomItem, val: any) => {
      setType15Items((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          return { ...item, [field]: val };
        }),
      );
    },
    [],
  );

  const deleteType15Row = useCallback((id: string) => {
    setType15Items((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: `t15-${Date.now()}`,
            isSubDealer: false,
            isUnregisteredSubdealer: false,
            village: "",
            objective: "",
            detail: "",
          },
        ];
      }
      return prev.filter((item) => item.id !== id);
    });
  }, []);

  const validateType15 = useCallback(() => {
    return validateType15Planned(type15Items);
  }, [type15Items]);

  const mapType15Payload = useCallback(
    (customers: any[] = customersList) => {
      return mapType15ToPayload(type15Items, customers);
    },
    [type15Items, customersList],
  );

  return {
    type15Items,
    setType15Items,
    addType15Row,
    updateType15Row,
    deleteType15Row,
    validateType15,
    mapType15Payload,
  };
}

