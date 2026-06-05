import { format } from "date-fns";
import { th } from "date-fns/locale";
import { FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { LogEntry } from "@/modules/logs/types";
import { getActionColor, getEventTypeColor } from "./utils";

interface LogDetailDialogProps {
  selectedLog: LogEntry | null;
  onClose: () => void;
}

export function LogDetailDialog({
  selectedLog,
  onClose,
}: LogDetailDialogProps) {
  return (
    <Dialog open={!!selectedLog} onOpenChange={(open) => !open && onClose()}>
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
                <p className="font-mono text-xs break-all">{selectedLog.id}</p>
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
                  <span className="font-medium text-gray-500">IP Address:</span>
                  <p className="font-mono">{selectedLog.ipAddress}</p>
                </div>
              )}
              {selectedLog.requestId && (
                <div>
                  <span className="font-medium text-gray-500">Request ID:</span>
                  <p className="font-mono text-xs">{selectedLog.requestId}</p>
                </div>
              )}
            </div>

            {/* Action/Event specific info */}
            {selectedLog.action && (
              <div>
                <span className="font-medium text-gray-500">Action:</span>
                <Badge className={`ml-2 ${getActionColor(selectedLog.action)}`}>
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
                <span className="font-medium text-gray-500">Stack Trace:</span>
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
  );
}
