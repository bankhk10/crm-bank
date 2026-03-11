"use client";

import * as React from "react";
import { Clock, ChevronDown, ChevronRight, Loader2, History } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/currency-utils";
import { getSalesTargetHistoryAction } from "../../server/actions";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface HistoryItem {
  id: string;
  changeType: "CREATED" | "UPDATED" | "DELETED";
  changedAt: Date | string;
  changeSummary: string | null;
  snapshotBefore: any;
  snapshotAfter: any;
  changedBy: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface Props {
  salesTargetId: string;
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const CHANGE_TYPE_CONFIG = {
  CREATED: {
    label: "สร้างใหม่",
    className:
      "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  UPDATED: {
    label: "แก้ไข",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  DELETED: {
    label: "ลบ",
    className: "bg-red-100 text-red-800 border-red-200",
  },
} as const;

function formatThaiDateTime(date: Date | string) {
  const d = new Date(date);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─────────────────────────────────────────────
// Snapshot Viewer
// ─────────────────────────────────────────────

function SnapshotStoreList({ snapshot }: { snapshot: any }) {
  if (!snapshot?.stores?.length) {
    return <p className="text-sm text-slate-400 italic">ไม่มีข้อมูลร้านค้า</p>;
  }

  const totalAmount = snapshot.stores.reduce(
    (sum: number, store: any) =>
      sum +
      store.items.reduce((s: number, i: any) => s + Number(i.targetAmount), 0),
    0,
  );

  return (
    <div className="space-y-3">
      {snapshot.stores.map((store: any, idx: number) => {
        const storeTotal = store.items.reduce(
          (s: number, i: any) => s + Number(i.targetAmount),
          0,
        );
        return (
          <div key={idx} className="border rounded-lg overflow-hidden text-sm">
            <div className="bg-slate-50 px-3 py-2 flex items-center justify-between border-b">
              <span className="font-semibold text-slate-700">
                {store.customerName || store.customerId}
                {store.customerCode && (
                  <span className="ml-1 text-slate-400 font-normal text-xs">
                    ({store.customerCode})
                  </span>
                )}
              </span>
              <span className="text-xs text-emerald-700 font-semibold">
                {formatCurrency(storeTotal)}
              </span>
            </div>
            <div className="divide-y">
              {store.items.map((item: any, iIdx: number) => (
                <div key={iIdx} className="px-3 py-1.5 flex items-center justify-between gap-2">
                  <span className="text-slate-600">
                    {item.productName || item.productId}
                    {item.productCode && (
                      <span className="ml-1 text-slate-400 text-xs">
                        ({item.productCode})
                      </span>
                    )}
                  </span>
                  <span className="text-slate-800 font-medium shrink-0">
                    {formatCurrency(Number(item.targetAmount))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <div className="flex justify-between items-center px-1 pt-1">
        <span className="text-xs text-slate-500">รวมทั้งหมด</span>
        <span className="text-sm font-bold text-emerald-700">
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Single History Card
// ─────────────────────────────────────────────

function HistoryCard({ item }: { item: HistoryItem }) {
  const [expanded, setExpanded] = React.useState(false);
  const config = CHANGE_TYPE_CONFIG[item.changeType];

  return (
    <div className="border rounded-xl overflow-hidden transition-all">
      {/* Header */}
      <div className="px-4 py-3 bg-white flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="mt-0.5">
            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs font-semibold shrink-0 ${config.className}`}
              >
                {config.label}
              </Badge>
              <span className="text-sm text-slate-700">
                {item.changeSummary || "เปลี่ยนแปลงข้อมูล"}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-xs text-slate-400">
              <span>โดย {item.changedBy?.name ?? "ไม่ทราบ"}</span>
              <span>·</span>
              <span>{formatThaiDateTime(item.changedAt)}</span>
            </div>
          </div>
        </div>
        {/* Expand toggle */}
        {(item.snapshotBefore || item.snapshotAfter) && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 h-7 px-2 text-slate-500 hover:text-slate-800"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
            <span className="ml-1 text-xs">รายละเอียด</span>
          </Button>
        )}
      </div>

      {/* Expanded snapshots */}
      {expanded && (
        <div className="border-t bg-slate-50/50">
          {item.changeType === "UPDATED" &&
          item.snapshotBefore &&
          item.snapshotAfter ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x">
              {/* Before */}
              <div className="p-4">
                <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wide">
                  ก่อนแก้ไข
                </p>
                <SnapshotStoreList snapshot={item.snapshotBefore} />
              </div>
              {/* After */}
              <div className="p-4">
                <p className="text-xs font-semibold text-emerald-600 mb-3 uppercase tracking-wide">
                  หลังแก้ไข
                </p>
                <SnapshotStoreList snapshot={item.snapshotAfter} />
              </div>
            </div>
          ) : item.changeType === "CREATED" && item.snapshotAfter ? (
            <div className="p-4">
              <p className="text-xs font-semibold text-emerald-600 mb-3 uppercase tracking-wide">
                ข้อมูลที่สร้าง
              </p>
              <SnapshotStoreList snapshot={item.snapshotAfter} />
            </div>
          ) : item.changeType === "DELETED" && item.snapshotBefore ? (
            <div className="p-4">
              <p className="text-xs font-semibold text-red-500 mb-3 uppercase tracking-wide">
                ข้อมูลก่อนลบ
              </p>
              <SnapshotStoreList snapshot={item.snapshotBefore} />
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function SalesTargetHistoryTab({ salesTargetId }: Props) {
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getSalesTargetHistoryAction(salesTargetId)
      .then((res) => {
        if (cancelled) return;
        if (res.success) {
          setHistory(res.history as HistoryItem[]);
        } else {
          setError(res.error ?? "เกิดข้อผิดพลาด");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [salesTargetId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 gap-2 text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">กำลังโหลดประวัติ...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500 text-sm">{error}</div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
        <History className="w-10 h-10 opacity-30" />
        <p className="text-sm">ยังไม่มีประวัติการเปลี่ยนแปลง</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((item) => (
        <HistoryCard key={item.id} item={item} />
      ))}
    </div>
  );
}
