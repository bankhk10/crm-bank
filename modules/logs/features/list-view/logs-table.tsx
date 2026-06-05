import { format } from "date-fns";
import { th } from "date-fns/locale";
import { RefreshCw, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LogEntry } from "@/modules/logs/types";
import { getActionColor, getEventTypeColor, getSeverityColor } from "./utils";

interface LogsTableProps {
  logs: LogEntry[];
  loading: boolean;
  activeTab: "audit" | "security" | "application";
  onSelectLog: (log: LogEntry) => void;
}

export function LogsTable({
  logs,
  loading,
  activeTab,
  onSelectLog,
}: LogsTableProps) {
  return (
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
              <TableHead className="hidden md:table-cell">IP Address</TableHead>
              <TableHead className="hidden lg:table-cell">Risk</TableHead>
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
            <TableCell colSpan={7} className="text-center py-10 text-gray-500">
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
                    <div className="text-sm">{log.user?.name || "-"}</div>
                    <div className="text-xs text-gray-500">{log.userEmail}</div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {log.changedFields?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {log.changedFields.slice(0, 3).map((field: string) => (
                          <Badge key={field} variant="outline" className="text-xs">
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
                      {log.eventType?.replace(/_/g, " ") || "-"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(log.severity)}>
                      {log.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{log.user?.name || "-"}</div>
                    <div className="text-xs text-gray-500">{log.userEmail}</div>
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
                  <TableCell className="text-sm">{log.module || "-"}</TableCell>
                  <TableCell className="max-w-md">
                    <div className="truncate text-sm">{log.message}</div>
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
                  onClick={() => onSelectLog(log)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
