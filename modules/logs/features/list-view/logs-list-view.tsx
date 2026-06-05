"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  FileText,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  getAuditLogsAction,
  getSecurityLogsAction,
  getApplicationLogsAction,
  getLogStatisticsAction,
} from "@/modules/logs/server/actions";
import type {
  AuditLogFilter,
  SecurityLogFilter,
  AppLogFilter,
  LogStats,
  LogEntry,
} from "@/modules/logs/types";

import { LogsStatsCards } from "./logs-stats-cards";
import { LogsTable } from "./logs-table";
import { LogDetailDialog } from "./log-detail-dialog";

export function LogsListView() {
  const [activeTab, setActiveTab] = useState<
    "audit" | "security" | "application"
  >("audit");
  const [stats, setStats] = useState<LogStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");

  const pageSize = 20;

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const data = await getLogStatisticsAction();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  }, []);

  // Fetch logs based on active tab
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * pageSize;

      if (activeTab === "audit") {
        const filter: AuditLogFilter = {
          limit: pageSize,
          offset,
          ...(entityTypeFilter !== "all" && { entityType: entityTypeFilter }),
          ...(actionFilter !== "all" && { action: actionFilter as any }),
          ...(searchQuery && { search: searchQuery }),
        };
        const result = await getAuditLogsAction(filter);
        setLogs(result.logs);
        setTotal(result.total);
      } else if (activeTab === "security") {
        const filter: SecurityLogFilter = {
          limit: pageSize,
          offset,
          ...(severityFilter !== "all" && { severity: severityFilter as any }),
          ...(eventTypeFilter !== "all" && {
            eventType: eventTypeFilter as any,
          }),
          ...(searchQuery && { search: searchQuery }),
        };
        const result = await getSecurityLogsAction(filter);
        setLogs(result.logs);
        setTotal(result.total);
      } else {
        const filter: AppLogFilter = {
          limit: pageSize,
          offset,
          ...(severityFilter !== "all" && { level: severityFilter as any }),
          ...(searchQuery && { search: searchQuery }),
        };
        const result = await getApplicationLogsAction(filter);
        setLogs(result.logs);
        setTotal(result.total);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
      setLogs([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    page,
    entityTypeFilter,
    actionFilter,
    severityFilter,
    eventTypeFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPage(1);
    fetchLogs();
  }, [
    activeTab,
    entityTypeFilter,
    actionFilter,
    severityFilter,
    eventTypeFilter,
  ]);

  useEffect(() => {
    fetchLogs();
  }, [page, fetchLogs]);

  const handleRefresh = () => {
    fetchStats();
    fetchLogs();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <LogsStatsCards stats={stats} />

      {/* Tabs and Logs Table */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as typeof activeTab)}
            >
              <TabsList>
                <TabsTrigger value="audit" className="gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Audit Logs</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">Security</span>
                </TabsTrigger>
                <TabsTrigger value="application" className="gap-2">
                  <Activity className="h-4 w-4" />
                  <span className="hidden sm:inline">Application</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหา..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      setPage(1);
                      handleRefresh();
                    }
                  }}
                  className="pl-10 w-48"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mt-4">
            {activeTab === "audit" && (
              <>
                <Select
                  value={entityTypeFilter}
                  onValueChange={setEntityTypeFilter}
                >
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Entity Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="Sale">Sale</SelectItem>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Product">Product</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="CreditLimit">CreditLimit</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="CREATE">CREATE</SelectItem>
                    <SelectItem value="UPDATE">UPDATE</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                    <SelectItem value="APPROVE">APPROVE</SelectItem>
                    <SelectItem value="REJECT">REJECT</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {activeTab === "security" && (
              <>
                <Select
                  value={eventTypeFilter}
                  onValueChange={setEventTypeFilter}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Event Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="LOGIN_SUCCESS">LOGIN_SUCCESS</SelectItem>
                    <SelectItem value="LOGIN_FAILED">LOGIN_FAILED</SelectItem>
                    <SelectItem value="LOGOUT">LOGOUT</SelectItem>
                    <SelectItem value="PASSWORD_CHANGE">
                      PASSWORD_CHANGE
                    </SelectItem>
                    <SelectItem value="PERMISSION_CHANGE">
                      PERMISSION_CHANGE
                    </SelectItem>
                    <SelectItem value="SUSPICIOUS_ACTIVITY">
                      SUSPICIOUS_ACTIVITY
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={severityFilter}
                  onValueChange={setSeverityFilter}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                    <SelectItem value="ERROR">ERROR</SelectItem>
                    <SelectItem value="WARN">WARN</SelectItem>
                    <SelectItem value="INFO">INFO</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}
            {activeTab === "application" && (
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                  <SelectItem value="ERROR">ERROR</SelectItem>
                  <SelectItem value="WARN">WARN</SelectItem>
                  <SelectItem value="INFO">INFO</SelectItem>
                  <SelectItem value="DEBUG">DEBUG</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <LogsTable
              logs={logs}
              loading={loading}
              activeTab={activeTab}
              onSelectLog={setSelectedLog}
            />
          </ScrollArea>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              แสดง {(page - 1) * pageSize + 1} -{" "}
              {Math.min(page * pageSize, total)} จาก {total} รายการ
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm px-2">
                หน้า {page} / {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log Detail Dialog */}
      <LogDetailDialog
        selectedLog={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
