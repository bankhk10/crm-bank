"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { ShieldCheck, Eye } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/custom/page-header";
import { Button } from "@/components/ui/button";
import { ActivityStatusBadge } from "../../ui/activity-status-badge";
import type { ActivityPlanWithRelations, ActivityStatus } from "../../types";
import { cn } from "@/lib/utils";

export default function ActivityPlanApprovalListView() {
  const { data: session } = useSession();
  const { hasPermission, isLoading } = usePermission("menu.activity_plans");

  const canApprove = hasPermission("activity.approve") || hasPermission("activity.manage");

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<ActivityPlanWithRelations[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Load all plans in pending states
  const fetchPendingPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      // Query plans in different pending statuses
      const statuses = [
        "PENDING_LINE_APPROVAL",
        "PENDING_BUDGET_APPROVAL",
        "PENDING_HELPER_APPROVAL",
      ];
      
      const allFetched: ActivityPlanWithRelations[] = [];

      for (const status of statuses) {
        const res = await fetch(`/api/activity-plans?status=${status}&perPage=50`);
        if (res.ok) {
          const json = await res.json();
          if (json.activityPlans) {
            allFetched.push(...json.activityPlans);
          }
        }
      }

      // De-duplicate just in case
      const uniquePlans = allFetched.filter(
        (plan, index, self) => self.findIndex((p) => p.id === plan.id) === index
      );

      setPlans(uniquePlans);
    } catch (err: any) {
      setError("เกิดข้อผิดพลาดในการโหลดคิวงานอนุมัติ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingPlans();
  }, []);

  if (isLoading) {
    return <div className="p-6 text-center">กำลังโหลดข้อมูล...</div>;
  }

  if (!canApprove) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>คุณไม่มีสิทธิ์เข้าถึงหน้าอนุมัติ Trip Plan</AlertDescription>
      </Alert>
    );
  }

  const userEmployeeId = session?.user?.employeeId;

  // Filter plans into categories
  // 1. Line Approvals waiting specifically for the current user
  const lineApprovalsForMe = plans.filter(
    (p) => p.status === "PENDING_LINE_APPROVAL" && p.currentApproverEmployeeId === userEmployeeId
  );


  // 2. Budget approvals (Show all pending budget approvals - user can view details and the system will check role authority inside detail view)
  const budgetApprovals = plans.filter(
    (p) => p.status === "PENDING_BUDGET_APPROVAL"
  );

  // 3. Helper approvals
  const helperApprovals = plans.filter(
    (p) => p.status === "PENDING_HELPER_APPROVAL"
  );

  return (
    <section className="space-y-6 p-6 pb-24 md:pb-8 max-w-5xl">
      <PageHeader
        title="แดชบอร์ดตรวจสอบและอนุมัติ Trip Plan"
        description="ศูนย์รวมคิวงานสำหรับตรวจสอบ Trip Plan งบประมาณ และการพิจารณาพนักงานช่วยงาน"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="py-12 text-center text-slate-500 font-medium">กำลังค้นหาคิวงานอนุมัติของคุณ...</div>
      ) : (
        <div className="space-y-8">
          
          {/* Category 1: Line Approvals */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-yellow-500" />
              1. คิวอนุมัติตามสายงานของคุณ ({lineApprovalsForMe.length} รายการ)
            </h3>
            {lineApprovalsForMe.length === 0 ? (
              <div className="bg-slate-50 border rounded-xl p-6 text-center text-sm text-slate-400 italic">
                ไม่มี Trip Plan ที่รอการอนุมัติตามสายงานของคุณในขณะนี้
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {lineApprovalsForMe.map((plan) => (
                  <PlanApprovalCard key={plan.id} plan={plan} />
                ))}
              </div>
            )}
          </div>

          {/* Category 2: Budget Approvals */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              2. คิวพิจารณางบประมาณส่วนกลาง ({budgetApprovals.length} รายการ)
            </h3>
            {budgetApprovals.length === 0 ? (
              <div className="bg-slate-50 border rounded-xl p-6 text-center text-sm text-slate-400 italic">
                ไม่มี Trip Plan ที่รองบประมาณการตลาด/ส่งเสริมการขายในขณะนี้
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {budgetApprovals.map((plan) => (
                  <PlanApprovalCard key={plan.id} plan={plan} showBudget />
                ))}
              </div>
            )}
          </div>

          {/* Category 3: Helper Approvals */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-purple-500" />
              3. คิวอนุมัติผู้ร่วมช่วยงานกิจกรรม ({helperApprovals.length} รายการ)
            </h3>
            {helperApprovals.length === 0 ? (
              <div className="bg-slate-50 border rounded-xl p-6 text-center text-sm text-slate-400 italic">
                ไม่มี Trip Plan ที่รออนุมัติให้พนักงานในสังกัดของคุณไปช่วยงานในขณะนี้
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {helperApprovals.map((plan) => (
                  <PlanApprovalCard key={plan.id} plan={plan} showHelpers />
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </section>
  );
}

// Subcomponent: Approval Card
function PlanApprovalCard({
  plan,
  showBudget = false,
  showHelpers = false,
}: {
  plan: ActivityPlanWithRelations;
  showBudget?: boolean;
  showHelpers?: boolean;
}) {
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);

  const salesPromo = plan.salesPromotionBudgetRequested ? Number(plan.salesPromotionBudgetRequested) : 0;
  const marketing = plan.marketingBudgetRequested ? Number(plan.marketingBudgetRequested) : 0;
  const budgetTotal = salesPromo + marketing;

  return (
    <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between gap-4">
      <div className="space-y-2.5">
        <div className="flex justify-between items-start gap-3">
          <h4 className="font-bold text-slate-800 line-clamp-1 text-sm" title={plan.title}>
            {plan.title}
          </h4>
          <ActivityStatusBadge status={plan.status} />
        </div>

        <div className="text-xs text-slate-500 space-y-1">
          <div>
            <strong>ผู้จัดทำ:</strong> {plan.employee.name} ({plan.employee.positionTitle || "ไม่ระบุตำแหน่ง"})
          </div>
          <div>
            <strong>ช่วงเวลา:</strong> {format(start, "dd MMM yy HH:mm", { locale: th })} - {format(end, "dd MMM yy HH:mm", { locale: th })}
          </div>
          <div>
            <strong>สถานที่:</strong> {plan.location}
          </div>
        </div>

        {showBudget && budgetTotal > 0 && (
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
            <div className="font-semibold text-slate-700">งบประมาณที่ขอใช้:</div>
            {salesPromo > 0 && (
              <div className="flex justify-between text-blue-600">
                <span>งบส่งเสริมการขาย:</span>
                <span className="font-bold">{salesPromo.toLocaleString()} บาท</span>
              </div>
            )}
            {marketing > 0 && (
              <div className="flex justify-between text-purple-600">
                <span>งบการตลาด:</span>
                <span className="font-bold">{marketing.toLocaleString()} บาท</span>
              </div>
            )}
          </div>
        )}

        {showHelpers && plan.helpers.length > 0 && (
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs space-y-1">
            <div className="font-semibold text-slate-700">พนักงานช่วยงานที่รออนุมัติ:</div>
            <ul className="list-disc list-inside space-y-0.5 text-slate-600">
              {plan.helpers.map((h) => (
                <li key={h.id} className="truncate">
                  {h.employee.name} ({h.employee.departmentName || "ไม่ระบุแผนก"})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-3 border-t">
        <Link href={`/activity-plans/${plan.id}`} className="w-full sm:w-auto">
          <Button variant="outline" size="sm" className="w-full text-blue-600 border-blue-100 hover:bg-blue-50 font-semibold flex items-center gap-1">
            <Eye className="h-4 w-4" />
            เปิดตรวจทาน & อนุมัติ
          </Button>
        </Link>
      </div>
    </div>
  );
}
