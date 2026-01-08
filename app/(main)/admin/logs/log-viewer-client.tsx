"use client";

import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  Shield,
  FileText,
  AlertTriangle,
  Activity,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  getAuditLogs,
  getSecurityLogs,
  getApplicationLogs,
  getLogStatistics,
  type AuditLogFilter,
  type SecurityLogFilter,
  type AppLogFilter,
} from "@/app/actions/logs";

// Types
interface LogStats {
  auditLogs: { total: number; today: number };
  securityLogs: { total: number; today: number };
  highRiskEvents: number;
  failedLoginsThisWeek: number;
  errorsThisWeek: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogEntry = Record<string, any>;

export default function LogViewerClient() {
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
      const data = await getLogStatistics();
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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(actionFilter !== "all" && { action: actionFilter as any }),
        };
        const result = await getAuditLogs(filter);
        setLogs(result.logs);
        setTotal(result.total);
      } else if (activeTab === "security") {
        const filter: SecurityLogFilter = {
          limit: pageSize,
          offset,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(severityFilter !== "all" && { severity: severityFilter as any }),

          ...(eventTypeFilter !== "all" && {
            eventType: eventTypeFilter as any,
          }),
        };
        const result = await getSecurityLogs(filter);
        setLogs(result.logs);
        setTotal(result.total);
      } else {
        const filter: AppLogFilter = {
          limit: pageSize,
          offset,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          ...(severityFilter !== "all" && { level: severityFilter as any }),
        };
        const result = await getApplicationLogs(filter);
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

  // Badge color helpers
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-red-600 text-white";
      case "ERROR":
        return "bg-red-500 text-white";
      case "WARN":
        return "bg-yellow-500 text-white";
      case "INFO":
        return "bg-blue-500 text-white";
      case "DEBUG":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE":
        return "bg-green-500 text-white";
      case "UPDATE":
        return "bg-blue-500 text-white";
      case "DELETE":
        return "bg-red-500 text-white";
      case "APPROVE":
        return "bg-emerald-500 text-white";
      case "REJECT":
        return "bg-orange-500 text-white";
      case "VIEW":
        return "bg-gray-500 text-white";
      case "EXPORT":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  const getEventTypeColor = (eventType: string) => {
    switch (eventType) {
      case "LOGIN_SUCCESS":
        return "bg-green-500 text-white";
      case "LOGIN_FAILED":
        return "bg-red-500 text-white";
      case "LOGOUT":
        return "bg-gray-500 text-white";
      case "PASSWORD_CHANGE":
      case "PASSWORD_RESET":
        return "bg-yellow-500 text-white";
      case "PERMISSION_CHANGE":
      case "ROLE_CHANGE":
      case "ADMIN_ACTION":
        return "bg-purple-600 text-white";
      case "SUSPICIOUS_ACTIVITY":
        return "bg-red-600 text-white";
      case "ACCOUNT_LOCKED":
        return "bg-red-700 text-white";
      case "ACCOUNT_UNLOCKED":
        return "bg-green-600 text-white";
      default:
        return "bg-gray-400 text-white";
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.auditLogs.total.toLocaleString() ?? "-"}
            </div>
            <p className="text-xs text-blue-100">
              วันนี้: {stats?.auditLogs.today ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Logs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.securityLogs.total.toLocaleString() ?? "-"}
            </div>
            <p className="text-xs text-emerald-100">
              วันนี้: {stats?.securityLogs.today ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              High Risk Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.highRiskEvents ?? "-"}
            </div>
            <p className="text-xs text-red-100">Risk Score ≥ 60</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Failed Logins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.failedLoginsThisWeek ?? "-"}
            </div>
            <p className="text-xs text-orange-100">7 วันที่ผ่านมา</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              App Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.errorsThisWeek ?? "-"}
            </div>
            <p className="text-xs text-purple-100">7 วันที่ผ่านมา</p>
          </CardContent>
        </Card>
      </div>

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">Timestamp</TableHead>
                  {activeTab === "audit" && (
                    <>
                      <TableHead>Action</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden md:table-cell">
                        Changed Fields
                      </TableHead>
                    </>
                  )}
                  {activeTab === "security" && (
                    <>
                      <TableHead>Event</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="hidden md:table-cell">
                        IP Address
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Risk
                      </TableHead>
                    </>
                  )}
                  {activeTab === "application" && (
                    <>
                      <TableHead>Level</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead className="max-w-md">Message</TableHead>
                    </>
                  )}
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-10 text-gray-500"
                    >
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(log.timestamp), "dd/MM/yy HH:mm:ss", {
                          locale: th,
                        })}
                      </TableCell>
                      {activeTab === "audit" && (
                        <>
                          <TableCell>
                            <Badge className={getActionColor(log.action)}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{log.entityType}</div>
                            <div className="text-xs text-gray-500 truncate max-w-32">
                              {log.entityName || log.entityId}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {log.user?.name || "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.userEmail}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            {log.changedFields?.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {log.changedFields
                                  .slice(0, 3)
                                  .map((field: string) => (
                                    <Badge
                                      key={field}
                                      variant="outline"
                                      className="text-xs"
                                    >
                                      {field}
                                    </Badge>
                                  ))}
                                {log.changedFields.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{log.changedFields.length - 3}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </>
                      )}
                      {activeTab === "security" && (
                        <>
                          <TableCell>
                            <Badge className={getEventTypeColor(log.eventType)}>
                              {log.eventType.replace(/_/g, " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getSeverityColor(log.severity)}>
                              {log.severity}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {log.user?.name || "-"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {log.userEmail}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm font-mono">
                            {log.ipAddress}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {log.riskScore !== null && (
                              <Badge
                                className={
                                  log.riskScore >= 60
                                    ? "bg-red-500 text-white"
                                    : log.riskScore >= 30
                                    ? "bg-yellow-500 text-white"
                                    : "bg-green-500 text-white"
                                }
                              >
                                {log.riskScore}
                              </Badge>
                            )}
                          </TableCell>
                        </>
                      )}
                      {activeTab === "application" && (
                        <>
                          <TableCell>
                            <Badge className={getSeverityColor(log.level)}>
                              {log.level}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {log.module || "-"}
                          </TableCell>
                          <TableCell className="max-w-md">
                            <div className="truncate text-sm">
                              {log.message}
                            </div>
                            {log.errorMessage && (
                              <div className="truncate text-xs text-red-500">
                                {log.errorMessage}
                              </div>
                            )}
                          </TableCell>
                        </>
                      )}
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Log Detail
            </DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-500">ID:</span>
                  <p className="font-mono text-xs break-all">
                    {selectedLog.id}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-500">Timestamp:</span>
                  <p>
                    {format(
                      new Date(selectedLog.timestamp),
                      "dd MMMM yyyy HH:mm:ss",
                      { locale: th }
                    )}
                  </p>
                </div>
                {selectedLog.userId && (
                  <div>
                    <span className="font-medium text-gray-500">User:</span>
                    <p>
                      {selectedLog.user?.name ||
                        selectedLog.userEmail ||
                        selectedLog.userId}
                    </p>
                  </div>
                )}
                {selectedLog.ipAddress && (
                  <div>
                    <span className="font-medium text-gray-500">
                      IP Address:
                    </span>
                    <p className="font-mono">{selectedLog.ipAddress}</p>
                  </div>
                )}
                {selectedLog.requestId && (
                  <div>
                    <span className="font-medium text-gray-500">
                      Request ID:
                    </span>
                    <p className="font-mono text-xs">{selectedLog.requestId}</p>
                  </div>
                )}
              </div>

              {/* Action/Event specific info */}
              {selectedLog.action && (
                <div>
                  <span className="font-medium text-gray-500">Action:</span>
                  <Badge
                    className={`ml-2 ${getActionColor(selectedLog.action)}`}
                  >
                    {selectedLog.action}
                  </Badge>
                </div>
              )}
              {selectedLog.eventType && (
                <div>
                  <span className="font-medium text-gray-500">Event Type:</span>
                  <Badge
                    className={`ml-2 ${getEventTypeColor(
                      selectedLog.eventType
                    )}`}
                  >
                    {selectedLog.eventType}
                  </Badge>
                </div>
              )}

              {/* Changed Fields */}
              {selectedLog.changedFields?.length > 0 && (
                <div>
                  <span className="font-medium text-gray-500">
                    Changed Fields:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedLog.changedFields.map((field: string) => (
                      <Badge key={field} variant="outline">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Old/New Values */}
              {(selectedLog.oldValue || selectedLog.newValue) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLog.oldValue && (
                    <div>
                      <span className="font-medium text-gray-500">
                        Old Value:
                      </span>
                      <pre className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs overflow-auto max-h-48">
                        {JSON.stringify(selectedLog.oldValue, null, 2)}
                      </pre>
                    </div>
                  )}
                  {selectedLog.newValue && (
                    <div>
                      <span className="font-medium text-gray-500">
                        New Value:
                      </span>
                      <pre className="mt-1 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-xs overflow-auto max-h-48">
                        {JSON.stringify(selectedLog.newValue, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Details */}
              {selectedLog.details && (
                <div>
                  <span className="font-medium text-gray-500">Details:</span>
                  <pre className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-xs overflow-auto max-h-48">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}

              {/* Stack Trace */}
              {selectedLog.stackTrace && (
                <div>
                  <span className="font-medium text-gray-500">
                    Stack Trace:
                  </span>
                  <pre className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-xs overflow-auto max-h-64 text-red-700 dark:text-red-300">
                    {selectedLog.stackTrace}
                  </pre>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div>
                  <span className="font-medium text-gray-500">User Agent:</span>
                  <p className="text-xs text-gray-600 mt-1 break-all">
                    {selectedLog.userAgent}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
