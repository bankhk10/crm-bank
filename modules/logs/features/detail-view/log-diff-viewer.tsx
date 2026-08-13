"use client";

import { useState, useMemo } from "react";
import {
  GitCompare,
  Plus,
  Minus,
  Edit3,
  CheckCircle2,
  Code2,
  Copy,
  Check,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LogDiffViewerProps {
  oldValue: any;
  newValue: any;
  changedFields?: string[];
}

export type DiffStatus = "modified" | "added" | "removed" | "unchanged";

export interface FieldDiff {
  key: string;
  status: DiffStatus;
  oldValFormatted: string;
  newValFormatted: string;
  isObject: boolean;
}

function formatValue(val: any): { formatted: string; isObject: boolean } {
  if (val === undefined) return { formatted: "", isObject: false };
  if (val === null) return { formatted: "null", isObject: false };
  if (typeof val === "object") {
    return { formatted: JSON.stringify(val, null, 2), isObject: true };
  }
  return { formatted: String(val), isObject: false };
}

export function LogDiffViewer({
  oldValue,
  newValue,
  changedFields = [],
}: LogDiffViewerProps) {
  const [showOnlyChanged, setShowOnlyChanged] = useState(true);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [activeTab, setActiveTab] = useState<"diff" | "raw">("diff");

  const { diffs, stats } = useMemo(() => {
    const oldObj =
      typeof oldValue === "string"
        ? tryParseJson(oldValue)
        : oldValue || {};
    const newObj =
      typeof newValue === "string"
        ? tryParseJson(newValue)
        : newValue || {};

    const allKeysSet = new Set<string>([
      ...Object.keys(oldObj),
      ...Object.keys(newObj),
      ...changedFields,
    ]);

    const allKeys = Array.from(allKeysSet).sort();

    const diffList: FieldDiff[] = [];
    let modifiedCount = 0;
    let addedCount = 0;
    let removedCount = 0;
    let unchangedCount = 0;

    for (const key of allKeys) {
      const hasOld = Object.prototype.hasOwnProperty.call(oldObj, key);
      const hasNew = Object.prototype.hasOwnProperty.call(newObj, key);

      const oldVal = oldObj[key];
      const newVal = newObj[key];

      const oldFmt = formatValue(oldVal);
      const newFmt = formatValue(newVal);

      let status: DiffStatus = "unchanged";

      if (!hasOld && hasNew) {
        status = "added";
        addedCount++;
      } else if (hasOld && !hasNew) {
        status = "removed";
        removedCount++;
      } else {
        const oldStr = JSON.stringify(oldVal);
        const newStr = JSON.stringify(newVal);
        if (oldStr !== newStr || changedFields.includes(key)) {
          status = "modified";
          modifiedCount++;
        } else {
          status = "unchanged";
          unchangedCount++;
        }
      }

      diffList.push({
        key,
        status,
        oldValFormatted: oldFmt.formatted,
        newValFormatted: newFmt.formatted,
        isObject: oldFmt.isObject || newFmt.isObject,
      });
    }

    return {
      diffs: diffList,
      stats: {
        total: allKeys.length,
        modified: modifiedCount,
        added: addedCount,
        removed: removedCount,
        unchanged: unchangedCount,
        totalChanged: modifiedCount + addedCount + removedCount,
      },
    };
  }, [oldValue, newValue, changedFields]);

  const filteredDiffs = useMemo(() => {
    if (showOnlyChanged) {
      return diffs.filter((d) => d.status !== "unchanged");
    }
    return diffs;
  }, [diffs, showOnlyChanged]);

  const handleCopyRaw = () => {
    const rawData = JSON.stringify({ oldValue, newValue }, null, 2);
    navigator.clipboard.writeText(rawData);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3 border-b bg-gray-50/50 dark:bg-gray-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <CardTitle className="text-lg font-semibold">
              เปรียบเทียบการเปลี่ยนแปลง (Data Diff)
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as "diff" | "raw")}
            >
              <TabsList className="h-8">
                <TabsTrigger value="diff" className="text-xs gap-1.5 px-3">
                  <GitCompare className="h-3.5 w-3.5" />
                  Diff View
                </TabsTrigger>
                <TabsTrigger value="raw" className="text-xs gap-1.5 px-3">
                  <Code2 className="h-3.5 w-3.5" />
                  Raw JSON
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Summary Badges */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-2 border-t border-gray-100 dark:border-gray-800">
          <Badge
            variant="outline"
            className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 gap-1 text-xs"
          >
            <Edit3 className="h-3 w-3" />
            แก้ไข ({stats.modified})
          </Badge>
          <Badge
            variant="outline"
            className="bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 gap-1 text-xs"
          >
            <Plus className="h-3 w-3" />
            เพิ่มใหม่ ({stats.added})
          </Badge>
          <Badge
            variant="outline"
            className="bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 gap-1 text-xs"
          >
            <Minus className="h-3 w-3" />
            ลบออก ({stats.removed})
          </Badge>
          <Badge
            variant="outline"
            className="text-gray-500 border-gray-200 dark:border-gray-800 gap-1 text-xs"
          >
            <CheckCircle2 className="h-3 w-3" />
            ไม่เปลี่ยนแปลง ({stats.unchanged})
          </Badge>

          {activeTab === "diff" && (
            <div className="ml-auto flex items-center gap-2">
              <Switch
                id="show-changed-only"
                checked={showOnlyChanged}
                onCheckedChange={setShowOnlyChanged}
              />
              <Label
                htmlFor="show-changed-only"
                className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer flex items-center gap-1"
              >
                <Filter className="h-3 w-3" />
                แสดงเฉพาะช่องที่เปลี่ยน ({stats.totalChanged})
              </Label>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {activeTab === "diff" ? (
          <div>
            {filteredDiffs.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {showOnlyChanged && stats.totalChanged === 0
                  ? "ไม่มีข้อมูลที่มีการเปลี่ยนแปลง"
                  : "ไม่พบข้อมูลฟิลด์"}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDiffs.map((diff) => (
                  <DiffRow key={diff.key} diff={diff} />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                JSON Data Structure
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyRaw}
                className="h-7 text-xs gap-1"
              >
                {copiedRaw ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    คัดลอกแล้ว
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    คัดลอก JSON
                  </>
                )}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 block mb-1">
                  🔴 Old Value (ก่อนแก้ไข)
                </span>
                <pre className="p-3 bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 rounded-lg text-xs font-mono overflow-auto max-h-80">
                  {JSON.stringify(oldValue, null, 2) || "null"}
                </pre>
              </div>
              <div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block mb-1">
                  🟢 New Value (หลังแก้ไข)
                </span>
                <pre className="p-3 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-lg text-xs font-mono overflow-auto max-h-80">
                  {JSON.stringify(newValue, null, 2) || "null"}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DiffRow({ diff }: { diff: FieldDiff }) {
  const { key, status, oldValFormatted, newValFormatted, isObject } = diff;

  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        status === "modified"
          ? "border-amber-300 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/10"
          : status === "added"
          ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/30 dark:bg-emerald-950/10"
          : status === "removed"
          ? "border-rose-300 dark:border-rose-800 bg-rose-50/30 dark:bg-rose-950/10"
          : "border-gray-200 dark:border-gray-800 bg-gray-50/20 dark:bg-gray-900/20 opacity-75"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100">
            {key}
          </span>
        </div>

        <div>
          {status === "modified" && (
            <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700 text-xs">
              <Edit3 className="h-3 w-3 mr-1" />
              แก้ไขแล้ว (Modified)
            </Badge>
          )}
          {status === "added" && (
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 text-xs">
              <Plus className="h-3 w-3 mr-1" />
              เพิ่มใหม่ (Added)
            </Badge>
          )}
          {status === "removed" && (
            <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700 text-xs">
              <Minus className="h-3 w-3 mr-1" />
              ลบออก (Removed)
            </Badge>
          )}
          {status === "unchanged" && (
            <Badge
              variant="outline"
              className="text-gray-400 border-gray-300 text-xs"
            >
              ไม่เปลี่ยนแปลง
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Old Value Box */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-rose-500" />
            ค่าเดิม (Old Value):
          </span>
          {status === "added" ? (
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-400 italic">
              (ไม่มีข้อมูล)
            </div>
          ) : (
            <pre
              className={`p-2.5 rounded font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all ${
                status === "modified" || status === "removed"
                  ? "bg-rose-100/70 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 line-through"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {oldValFormatted || "(empty)"}
            </pre>
          )}
        </div>

        {/* New Value Box */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-gray-500 flex items-center gap-1">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500" />
            ค่าใหม่ (New Value):
          </span>
          {status === "removed" ? (
            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded text-gray-400 italic">
              (ถูกลบออก)
            </div>
          ) : (
            <pre
              className={`p-2.5 rounded font-mono overflow-auto max-h-40 whitespace-pre-wrap break-all ${
                status === "modified" || status === "added"
                  ? "bg-emerald-100/70 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50 font-semibold"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {newValFormatted || "(empty)"}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

function tryParseJson(val: string) {
  try {
    return JSON.parse(val);
  } catch {
    return {};
  }
}
