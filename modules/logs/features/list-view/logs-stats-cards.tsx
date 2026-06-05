import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, AlertTriangle, Activity } from "lucide-react";
import type { LogStats } from "@/modules/logs/types";

interface LogsStatsCardsProps {
  stats: LogStats | null;
}

export function LogsStatsCards({ stats }: LogsStatsCardsProps) {
  return (
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
  );
}
