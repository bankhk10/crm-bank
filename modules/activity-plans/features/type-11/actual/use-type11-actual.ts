"use client";

import { useState, useCallback } from "react";

export function useType11Actual() {
  const [t11StockItems, setT11StockItems] = useState<any[]>([]);
  const [t11ProductList, setT11ProductList] = useState("");
  const [t11RemainingQty, setT11RemainingQty] = useState("");
  const [t11Remarks, setT11Remarks] = useState("");
  const [t11StockStatus, setT11StockStatus] = useState<
    "ใกล้หมด" | "ขาดสต็อก" | ""
  >("");
  const [t11ReorderOpportunity, setT11ReorderOpportunity] = useState<
    "สูง" | "ต่ำ" | "ยังไม่แน่ใจ" | ""
  >("");
  const [t11NextAction, setT11NextAction] = useState("");

  const hydrate = useCallback((parsed: any) => {
    if (!parsed) return;
    if (parsed.t11StockItems) setT11StockItems(parsed.t11StockItems);
    if (parsed.t11ProductList) setT11ProductList(parsed.t11ProductList);
    if (parsed.t11RemainingQty) {
      setT11RemainingQty(parsed.t11RemainingQty);
    }
    if (parsed.t11Remarks) setT11Remarks(parsed.t11Remarks);
    if (parsed.t11StockStatus) {
      const st = parsed.t11StockStatus;
      if (st === "ใกล้หมด") setT11StockStatus("ใกล้หมด");
      else if (st === "สินค้าขาดสต็อก") setT11StockStatus("ขาดสต็อก");
    }
    if (parsed.t11ReorderOpportunity) {
      const ro = parsed.t11ReorderOpportunity;
      if (ro === "สูง" || ro === "ต่ำ") setT11ReorderOpportunity(ro);
    }
    if (parsed.t11NextAction) {
      setT11NextAction(parsed.t11NextAction);
    } else if (parsed.nextAction) {
      setT11NextAction(parsed.nextAction);
    }
  }, []);

  const collectPayload = useCallback(() => {
    return {
      t11StockItems,
      t11ProductList,
      t11RemainingQty,
      t11Remarks,
      t11StockStatus,
      t11ReorderOpportunity,
      t11NextAction,
    };
  }, [
    t11StockItems,
    t11ProductList,
    t11RemainingQty,
    t11Remarks,
    t11StockStatus,
    t11ReorderOpportunity,
    t11NextAction,
  ]);

  return {
    t11StockItems,
    setT11StockItems,
    t11ProductList,
    setT11ProductList,
    t11RemainingQty,
    setT11RemainingQty,
    t11Remarks,
    setT11Remarks,
    t11StockStatus,
    setT11StockStatus,
    t11ReorderOpportunity,
    setT11ReorderOpportunity,
    t11NextAction,
    setT11NextAction,
    hydrate,
    collectPayload,
  };
}
