"use client";

import { useState, useCallback } from "react";
import type { ImageFile } from "@/modules/activity-plans/features/shared/actual-view/types";

export function useType4Actual() {
  const [t4OrderNo, setT4OrderNo] = useState("");
  const [t4ReceivedAmount, setT4ReceivedAmount] = useState("");
  const [t4BillingStatus, setT4BillingStatus] = useState("");
  const [t4Detail, setT4Detail] = useState("");
  const [t4PaymentImages, setT4PaymentImages] = useState<ImageFile[]>([]);

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t4OrderNo) setT4OrderNo(parsed.t4OrderNo);
    if (parsed.t4ReceivedAmount) {
      setT4ReceivedAmount(parsed.t4ReceivedAmount);
    }
    if (parsed.t4BillingStatus) {
      setT4BillingStatus(parsed.t4BillingStatus);
    }
    if (parsed.t4Detail) {
      setT4Detail(parsed.t4Detail);
    }
  }, []);

  const collectPayload = useCallback(() => {
    return {
      t4OrderNo,
      t4ReceivedAmount,
      t4BillingStatus,
      t4Detail,
    };
  }, [t4OrderNo, t4ReceivedAmount, t4BillingStatus, t4Detail]);

  return {
    t4OrderNo,
    setT4OrderNo,
    t4ReceivedAmount,
    setT4ReceivedAmount,
    t4BillingStatus,
    setT4BillingStatus,
    t4Detail,
    setT4Detail,
    t4PaymentImages,
    setT4PaymentImages,
    hydrate,
    collectPayload,
  };
}
