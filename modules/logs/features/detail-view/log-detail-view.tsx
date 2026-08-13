"use client";

import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  ArrowLeft,
  Clock,
  User as UserIcon,
  Globe,
  FileText,
  Shield,
  Activity,
  AlertTriangle,
  Layers,
  Terminal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LogEntry } from "@/modules/logs/types";
import {
  getActionColor,
  getEventTypeColor,
  getSeverityColor,
} from "../list-view/utils";
import { LogDiffViewer } from "./log-diff-viewer";

interface LogDetailViewProps {
  log: LogEntry;
  type: "audit" | "security" | "application";
}

export function LogDetailView({ log, type }: LogDetailViewProps) {
  const hasDiffData = log.oldValue || log.newValue;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/admin/logs">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              กลับไปหน้า Log Viewer
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          {type === "audit" && (
            <Badge className="bg-blue-600 text-white gap-1 px-3 py-1">
              <FileText className="h-3.5 w-3.5" />
              Audit Log
            </Badge>
          )}
          {type === "security" && (
            <Badge className="bg-purple-600 text-white gap-1 px-3 py-1">
              <Shield className="h-3.5 w-3.5" />
              Security Log
            </Badge>
          )}
          {type === "application" && (
            <Badge className="bg-emerald-600 text-white gap-1 px-3 py-1">
              <Activity className="h-3.5 w-3.5" />
              Application Log
            </Badge>
          )}
        </div>
      </div>

      {/* Title & Key Highlights Card */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl md:text-2xl font-bold flex items-center gap-2">
                📋 Log รายละเอียด:{" "}
                <span className="font-mono text-base font-normal text-gray-500">
                  {log.id}
                </span>
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-gray-400" />
                บันทึกเมื่อ:{" "}
                {format(
                  new Date(log.timestamp),
                  "dd MMMM yyyy เวลา HH:mm:ss น.",
                  { locale: th }
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {log.action && (
                <Badge className={`text-sm px-3 py-1 ${getActionColor(log.action)}`}>
                  Action: {log.action}
                </Badge>
              )}
              {log.eventType && (
                <Badge className={`text-sm px-3 py-1 ${getEventTypeColor(log.eventType)}`}>
                  Event: {log.eventType}
                </Badge>
              )}
              {log.severity && (
                <Badge className={`text-sm px-3 py-1 ${getSeverityColor(log.severity)}`}>
                  Severity: {log.severity}
                </Badge>
              )}
              {log.level && (
                <Badge className={`text-sm px-3 py-1 ${getSeverityColor(log.level)}`}>
                  Level: {log.level}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            {/* User Info */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                <UserIcon className="h-3.5 w-3.5" /> ผู้ดำเนินการ (User)
              </div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {log.user?.name || log.userName || "-"}
              </p>
              <p className="text-xs text-gray-500 font-mono truncate">
                {log.userEmail || log.userId || "N/A"}
              </p>
            </div>

            {/* Entity / Target */}
            {log.entityType && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                  <Layers className="h-3.5 w-3.5" /> ข้อมูลที่เกี่ยวข้อง (Entity)
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {log.entityType}
                </p>
                <p className="text-xs text-gray-500 font-mono truncate">
                  {log.entityName || log.entityId || "N/A"}
                </p>
              </div>
            )}

            {/* Network & IP */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                <Globe className="h-3.5 w-3.5" /> IP Address & Request
              </div>
              <p className="font-mono font-semibold text-gray-900 dark:text-gray-100">
                {log.ipAddress || "-"}
              </p>
              <p className="text-xs text-gray-500 font-mono truncate">
                ID: {log.requestId || "N/A"}
              </p>
            </div>

            {/* Security Risk Score if applicable */}
            {log.riskScore !== undefined && log.riskScore !== null && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                  <AlertTriangle className="h-3.5 w-3.5" /> Risk Assessment
                </div>
                <div>
                  <Badge
                    className={
                      log.riskScore >= 60
                        ? "bg-red-500 text-white"
                        : log.riskScore >= 30
                        ? "bg-yellow-500 text-white"
                        : "bg-green-500 text-white"
                    }
                  >
                    Risk Score: {log.riskScore} / 100
                  </Badge>
                </div>
              </div>
            )}

            {/* App Log Module if applicable */}
            {log.module && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
                  <Terminal className="h-3.5 w-3.5" /> Module / Component
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {log.module}
                </p>
                {log.endpoint && (
                  <p className="text-xs text-gray-500 font-mono truncate">
                    {log.method} {log.endpoint}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Field Comparison Diff Viewer Component */}
      {hasDiffData && (
        <LogDiffViewer
          oldValue={log.oldValue}
          newValue={log.newValue}
          changedFields={log.changedFields}
        />
      )}

      {/* Additional Log Details / Stack Trace */}
      <div className="grid grid-cols-1 gap-6">
        {log.message && (
          <Card>
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm font-semibold">Message</CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-sm text-gray-800 dark:text-gray-200">
                {log.message}
              </p>
            </CardContent>
          </Card>
        )}

        {log.details && (
          <Card>
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm font-semibold">
                Additional Context Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs font-mono overflow-auto max-h-60">
                {JSON.stringify(log.details, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {log.stackTrace && (
          <Card className="border-red-200 dark:border-red-900/50">
            <CardHeader className="py-3 border-b bg-red-50/50 dark:bg-red-950/20">
              <CardTitle className="text-sm font-semibold text-red-700 dark:text-red-400">
                Stack Trace
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <pre className="p-3 bg-red-950 text-red-200 rounded-lg text-xs font-mono overflow-auto max-h-80 whitespace-pre-wrap">
                {log.stackTrace}
              </pre>
            </CardContent>
          </Card>
        )}

        {log.userAgent && (
          <Card>
            <CardHeader className="py-3 border-b">
              <CardTitle className="text-sm font-semibold">
                User Agent
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-3">
              <p className="text-xs font-mono text-gray-600 dark:text-gray-400 break-all">
                {log.userAgent}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
