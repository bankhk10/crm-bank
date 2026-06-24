import { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import {
  approveStep,
  rejectStep,
} from "@/modules/activity-plan/application/actions";

export const metadata: Metadata = {
  title: "แผนการทำกิจกรรม",
  description: "จัดการและอนุมัติแผนการทำกิจกรรม",
};

export default async function ActivityPlanPage() {
  const plans = await db.activityPlan.findMany({
    include: {
      requester: true,
      helpers: { select: { name: true } },
      approvalSteps: {
        include: { approver: true },
        orderBy: { stepOrder: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">แผนการทำกิจกรรม</h2>
        <div className="flex items-center space-x-2">
          <Link href="/activity-plan/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> สร้างแผนกิจกรรม
            </Button>
          </Link>
          <Link href="/activity-plan/settings">
            <Button variant="outline">ตั้งค่าสายอนุมัติ</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border">
        <h3 className="text-lg font-medium mb-4">
          รายการแผนกิจกรรมที่รอการอนุมัติ / ทั้งหมด
        </h3>
        {plans.length === 0 ? (
          <p className="text-sm text-gray-500">ยังไม่มีรายการแผนกิจกรรม</p>
        ) : (
          <div className="space-y-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className="p-4 border rounded-lg flex flex-col gap-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{plan.title}</h4>
                    <p className="text-sm text-gray-600">{plan.description}</p>
                    <div className="flex gap-2 mt-2">
                      {plan.useSalesBudget && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                          งบส่งเสริมการขาย
                        </span>
                      )}
                      {plan.useMarketingBudget && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                          งบการตลาด
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      ผู้ขอ: {plan.requester.name}
                    </p>
                    {plan.helpers.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        ผู้ช่วยกิจกรรม: {plan.helpers.map(h => h.name).join(", ")}
                      </p>
                    )}
                  </div>
                  <div>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.status === "APPROVED"
                          ? "bg-green-100 text-green-800"
                          : plan.status === "REJECTED"
                            ? "bg-red-100 text-red-800"
                            : plan.status === "DRAFT"
                              ? "bg-gray-100 text-gray-800"
                              : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h5 className="text-sm font-medium mb-2">สายการอนุมัติ:</h5>
                  <div className="grid gap-2">
                    {plan.approvalSteps.map((step) => (
                      <div
                        key={step.id}
                        className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm"
                      >
                        <div className="flex gap-4">
                          <span className="font-medium min-w-[30px]">
                            ขั้นที่ {step.stepOrder}
                          </span>
                          <span className="w-48">{step.requiredRole}</span>
                          <span className="w-48 text-gray-600">
                            {step.approver.name}
                          </span>
                          <span
                            className={`font-semibold ${
                              step.status === "APPROVED" ||
                              step.status === "SKIPPED"
                                ? "text-green-600"
                                : step.status === "REJECTED"
                                  ? "text-red-600"
                                  : "text-orange-500"
                            }`}
                          >
                            {step.status}
                          </span>
                        </div>

                        {/* Simulation: Only show approve/reject if it's the CURRENT step and PENDING */}
                        {step.status === "PENDING" &&
                          step.stepOrder === plan.currentStepOrder &&
                          plan.status === "PENDING_APPROVAL" && (
                            <div className="flex gap-2">
                              <form
                                action={approveStep.bind(
                                  null,
                                  step.id,
                                  "Approve from UI",
                                )}
                              >
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                  className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                                >
                                  อนุมัติ
                                </Button>
                              </form>
                              <form
                                action={rejectStep.bind(
                                  null,
                                  step.id,
                                  "Reject from UI",
                                )}
                              >
                                <Button
                                  type="submit"
                                  size="sm"
                                  variant="outline"
                                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                                >
                                  ไม่อนุมัติ
                                </Button>
                              </form>
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
