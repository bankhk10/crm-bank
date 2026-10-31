"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ActivityPlanTable,
  isPlanSubmittable,
  type ActivityPlanViewScope,
} from "./components/activity-plan-table";
import { BatchSubmitBar } from "./components/batch-submit-bar";
import { BatchSubmitDialog } from "./components/batch-submit-dialog";
import type { ActivityPlanWithRelations } from "@/modules/activity/types";
import {
  deleteActivityPlanAction,
  submitActivityPlanAction,
  duplicateActivityPlanAction,
  batchSubmitActivityPlansAction,
  getActivityTypesAction,
} from "@/modules/activity/server/actions";
import { getAllEmployeesAction } from "@/modules/employee/server/actions";
import { WORK_TYPE_CONFIG } from "@/modules/activity/constants";
import type { MultiSelectOption } from "@/components/custom/multi-select";
import { Button } from "@/components/ui/button";
import {
  CalendarIcon,
  Copy,
  RefreshCw,
  User,
  Users,
  UserPlus,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  isActivityAdmin,
  canCreatePlannedActivity,
  canApproveActivityPlan,
} from "@/modules/activity/domain/permissions";

export default function ActivityPlanListView() {
  const { data: session } = useSession();
  const { hasPermission, allowed, isLoading } = usePermission(
    "menu.activity_plans",
  );

  const user = session?.user;
  const isAdmin = isActivityAdmin(user);

  // Centralized domain permission checks
  const canCreate = canCreatePlannedActivity(user).allowed;
  const canEdit =
    isAdmin ||
    hasPermission("activity.edit") ||
    hasPermission("activity.manage");
  const canDelete =
    isAdmin ||
    hasPermission("activity.delete") ||
    hasPermission("activity.manage");
  const canApprove = canApproveActivityPlan(user).allowed;
  const canView =
    isAdmin ||
    allowed ||
    hasPermission("activity.view") ||
    hasPermission("activity.manage") ||
    !isLoading;

  const [activityPlans, setActivityPlans] = useState<
    ActivityPlanWithRelations[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<number>(1);
  const [perPage, setPerPage] = useState<number>(10);
  const [total, setTotal] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [viewScope, setViewScope] = useState<ActivityPlanViewScope>("OWN");
  const [scopeCounts, setScopeCounts] = useState({
    own: 0,
    team: 0,
    helper: 0,
    all: 0,
  });

  const [searchDraft, setSearchDraft] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [workTypeFilter, setWorkTypeFilter] = useState<string[]>([]);
  const [personFilter, setPersonFilter] = useState<string[]>([]);

  const [workTypeOptions, setWorkTypeOptions] = useState<MultiSelectOption[]>(
    [],
  );
  const [personOptions, setPersonOptions] = useState<MultiSelectOption[]>([]);

  const [deleteCandidate, setDeleteCandidate] =
    useState<ActivityPlanWithRelations | null>(null);
  const [duplicateCandidate, setDuplicateCandidate] =
    useState<ActivityPlanWithRelations | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [submitLoadingId, setSubmitLoadingId] = useState<string | null>(null);
  const [selectedPlans, setSelectedPlans] = useState<ActivityPlanWithRelations[]>([]);
  const [batchDialogOpen, setBatchDialogOpen] = useState<boolean>(false);
  const [batchSubmitting, setBatchSubmitting] = useState<boolean>(false);

  // Load master options for Work Types and Employees
  useEffect(() => {
    let isMounted = true;

    getActivityTypesAction()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.types) && res.types.length > 0) {
          const opts: MultiSelectOption[] = res.types.map((t: any) => ({
            value: t.code,
            label: `${t.code?.replace("_", "") || ""} ${t.name || ""}`.trim(),
          }));
          setWorkTypeOptions(opts);
        } else {
          const opts: MultiSelectOption[] = Object.values(WORK_TYPE_CONFIG).map(
            (c) => ({
              value: c.code,
              label: `${c.code.replace("_", "")} ${c.name}`,
            }),
          );
          setWorkTypeOptions(opts);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        const opts: MultiSelectOption[] = Object.values(WORK_TYPE_CONFIG).map(
          (c) => ({
            value: c.code,
            label: `${c.code.replace("_", "")} ${c.name}`,
          }),
        );
        setWorkTypeOptions(opts);
      });

    getAllEmployeesAction()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && Array.isArray(res.employees)) {
          const opts: MultiSelectOption[] = res.employees
            .filter((e: any) => e.name)
            .map((e: any) => ({
              value: e.id,
              label: e.name,
            }));
          setPersonOptions(opts);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  // Debounce search input
  useEffect(() => {
    const delay = 400;
    const id = setTimeout(() => {
      setAppliedSearch(searchDraft);
      setPage(1);
    }, delay);
    return () => clearTimeout(id);
  }, [searchDraft]);

  // Fetch data
  const fetchData = React.useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("perPage", String(perPage));
        params.set("viewScope", viewScope);
        if (appliedSearch.trim()) params.set("q", appliedSearch.trim());
        if (statusFilter.length > 0)
          params.set("status", statusFilter.join(","));
        if (workTypeFilter.length > 0)
          params.set("workTypes", workTypeFilter.join(","));
        if (personFilter.length > 0)
          params.set("employeeIds", personFilter.join(","));

        const res = await fetch(`/api/activity-plans?${params.toString()}`, {
          signal,
        });
        if (!res.ok) throw new Error("ดึงข้อมูล Trip Plan ไม่สำเร็จ");
        const json = await res.json();
        setActivityPlans(json.activityPlans ?? []);
        setTotal(json.total ?? 0);
        if (json.counts) {
          setScopeCounts({
            own: json.counts.own ?? 0,
            team: json.counts.team ?? 0,
            helper: json.counts.helper ?? 0,
            all: json.counts.all ?? 0,
          });
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [
      page,
      perPage,
      viewScope,
      appliedSearch,
      statusFilter,
      workTypeFilter,
      personFilter,
    ],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [fetchData]);

  const handleScopeChange = (newScope: ActivityPlanViewScope) => {
    setViewScope(newScope);
    setPage(1);
    setSelectedPlans([]);
  };

  const handleStatusFilterChange = (statuses: string[]) => {
    setStatusFilter(statuses);
    setPage(1);
  };

  const handleWorkTypeFilterChange = (workTypes: string[]) => {
    setWorkTypeFilter(workTypes);
    setPage(1);
  };

  const handlePersonFilterChange = (persons: string[]) => {
    setPersonFilter(persons);
    setPage(1);
  };

  const handleDeleteRequest = (item: ActivityPlanWithRelations) => {
    setDeleteCandidate(item);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await deleteActivityPlanAction(deleteCandidate.id);
      if (!res.success) {
        throw new Error(res.error || "เกิดข้อผิดพลาดในการลบ");
      }
      toast.success("ลบ Trip Plan เรียบร้อยแล้ว");
      setDeleteCandidate(null);
      fetchData(); // Reload
    } catch (err: any) {
      setError(err.message || "ลบ Trip Plan ล้มเหลว");
      toast.error(err.message || "ลบ Trip Plan ล้มเหลว");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateRequest = (item: ActivityPlanWithRelations) => {
    setDuplicateCandidate(item);
  };

  const handleDuplicateConfirm = async () => {
    if (!duplicateCandidate) return;
    setDuplicateLoading(true);
    setError(null);
    try {
      const res = await duplicateActivityPlanAction(duplicateCandidate.id);
      if (!res.success) {
        throw new Error(res.error || "เกิดข้อผิดพลาดในการทำสำเนาแผนงาน");
      }
      toast.success("ทำสำเนาแผนงานเรียบร้อยแล้ว (สถานะแบบร่าง)");
      setDuplicateCandidate(null);
      fetchData(); // Reload
    } catch (err: any) {
      setError(err.message || "ทำสำเนา Trip Plan ล้มเหลว");
      toast.error(err.message || "ทำสำเนา Trip Plan ล้มเหลว");
    } finally {
      setDuplicateLoading(false);
    }
  };

  const handleSubmitApproval = async (item: ActivityPlanWithRelations) => {
    setSubmitLoadingId(item.id);
    setError(null);
    try {
      const res = await submitActivityPlanAction(item.id);
      if (!res.success) {
        throw new Error(res.error || "ส่งแผนขออนุมัติล้มเหลว");
      }
      toast.success("ส่งแผนงานขออนุมัติเรียบร้อยแล้ว");
      fetchData(); // Reload
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || "ส่งแผนขออนุมัติล้มเหลว");
    } finally {
      setSubmitLoadingId(null);
    }
  };

  const handleToggleSelectPlan = (plan: ActivityPlanWithRelations) => {
    setSelectedPlans((prev) =>
      prev.some((p) => p.id === plan.id)
        ? prev.filter((p) => p.id !== plan.id)
        : [...prev, plan],
    );
  };

  const handleToggleSelectAll = (selectAll: boolean) => {
    if (!selectAll) {
      const pageIds = new Set(activityPlans.map((p) => p.id));
      setSelectedPlans((prev) => prev.filter((p) => !pageIds.has(p.id)));
      return;
    }

    const submittableInPage = activityPlans.filter(
      (p) => isPlanSubmittable(p, user?.id, (user as any)?.employeeId).allowed,
    );

    setSelectedPlans((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = submittableInPage.filter((p) => !existingIds.has(p.id));
      return [...prev, ...toAdd];
    });
  };

  const handleClearSelection = () => {
    setSelectedPlans([]);
  };

  const handleBatchSubmitConfirm = async () => {
    if (selectedPlans.length === 0) return;
    setBatchSubmitting(true);
    setError(null);
    try {
      const ids = selectedPlans.map((p) => p.id);
      const res: any = await batchSubmitActivityPlansAction(ids);
      if (!res.success) {
        throw new Error(res.error || "ส่งแผนงานขออนุมัติล้มเหลว");
      }

      const successCount = res.successCount ?? 0;
      const failureCount = res.failureCount ?? 0;

      if (failureCount > 0) {
        toast.warning(
          `ส่งขออนุมัติสำเร็จ ${successCount} รายการ, ไม่สำเร็จ ${failureCount} รายการ`,
        );
      } else {
        toast.success(
          `ส่งแผนงานขออนุมัติเรียบร้อยแล้วทั้งหมด ${successCount} รายการ`,
        );
      }

      setSelectedPlans([]);
      setBatchDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message || "ส่งแผนขออนุมัติล้มเหลว");
      toast.error(err.message || "ส่งแผนขออนุมัติล้มเหลว");
    } finally {
      setBatchSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">กำลังโหลดข้อมูล...</div>;
  }

  if (!canView) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>
          คุณไม่มีสิทธิ์เข้าถึงหน้ารายการ Trip Plan
        </AlertDescription>
      </Alert>
    );
  }

  const scopeTabs: {
    id: ActivityPlanViewScope;
    label: string;
    subtitle: string;
    count: number;
    icon: React.ElementType;
    activeClass: string;
    badgeActiveClass: string;
    iconColorClass: string;
  }[] = [
    {
      id: "OWN",
      label: "แผนงานของฉัน",
      subtitle: "ที่ฉันเป็นผู้สร้าง",
      count: scopeCounts.own,
      icon: User,
      activeClass:
        "bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-500/20",
      badgeActiveClass: "bg-white/20 text-white",
      iconColorClass: "text-blue-600",
    },
    {
      id: "TEAM",
      label: "แผนงานลูกทีม / ทีมงาน",
      subtitle: "ของทีมและผู้ใต้บังคับบัญชา",
      count: scopeCounts.team,
      icon: Users,
      activeClass:
        "bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/20",
      badgeActiveClass: "bg-white/20 text-white",
      iconColorClass: "text-indigo-600",
    },
    {
      id: "HELPER",
      label: "ที่ฉันร่วมทีม (Helper)",
      subtitle: "ไปช่วยปฏิบัติงาน",
      count: scopeCounts.helper,
      icon: UserPlus,
      activeClass:
        "bg-teal-600 text-white border-teal-600 shadow-sm shadow-teal-500/20",
      badgeActiveClass: "bg-white/20 text-white",
      iconColorClass: "text-teal-600",
    },
    {
      id: "ALL",
      label: "ทั้งหมด",
      subtitle: "รวมทุกมุมมอง",
      count: scopeCounts.all,
      icon: Layers,
      activeClass:
        "bg-slate-800 text-white border-slate-800 shadow-sm shadow-slate-500/20",
      badgeActiveClass: "bg-white/20 text-white",
      iconColorClass: "text-slate-600",
    },
  ];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-100 shadow-sm">
      <div className="relative flex items-center justify-center gap-3 z-10 pb-5 border-b border-slate-100 mb-5">
        {/* ส่วนหัวข้อ + ไอคอน (อยู่ตรงกลาง) */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center justify-center w-11 h-11 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <div className="min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg md:text-2xl font-extrabold text-slate-900 tracking-tight">
                แผนงาน (Trip Plan)
              </h1>
            </div>
          </div>
        </div>

        {/* ปุ่มรีเฟรช (ลอยชิดขวาสุด) */}
        <div className="absolute right-0 flex items-center shrink-0">
          <Button
            variant="outline"
            size="icon"
            onClick={() => fetchData()}
            disabled={loading}
            className="rounded-xl h-9 w-9 md:h-10 md:w-10 bg-blue-50/60 border-blue-200/80 text-blue-600 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 shadow-2xs transition-colors cursor-pointer"
            title="รีเฟรชข้อมูล"
            aria-label="รีเฟรชข้อมูล"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* ─── Scope Switcher Tabs (แยกข้อมูลของเรา vs ลูกทีม vs ร่วมทีม vs ทั้งหมด) ─── */}
      <div className="mb-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
          {scopeTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = viewScope === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleScopeChange(tab.id)}
                className={cn(
                  "flex items-center justify-between gap-2 p-3 sm:px-4 sm:py-3 rounded-xl border text-left transition-all cursor-pointer",
                  isActive
                    ? tab.activeClass
                    : "bg-slate-50/70 hover:bg-slate-100/80 text-slate-700 border-slate-200/80",
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      "w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-white border border-slate-200/80 shadow-2xs",
                      !isActive && tab.iconColorClass,
                    )}
                  >
                    <Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "text-xs sm:text-sm font-bold truncate",
                        isActive ? "text-white" : "text-slate-800",
                      )}
                    >
                      {tab.label}
                    </p>
                    <p
                      className={cn(
                        "text-[10px] sm:text-xs truncate hidden sm:block",
                        isActive ? "text-white/80" : "text-slate-500",
                      )}
                    >
                      {tab.subtitle}
                    </p>
                  </div>
                </div>

                <span
                  className={cn(
                    "px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs sm:text-sm font-extrabold shrink-0 tabular-nums",
                    isActive
                      ? tab.badgeActiveClass
                      : "bg-white text-slate-700 border border-slate-200/80",
                  )}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Confirm deletion modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center p-4">
          <div
            className="bg-black/55 absolute inset-0"
            onClick={() => !actionLoading && setDeleteCandidate(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              ยืนยันการลบ Trip Plan
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              คุณแน่ใจว่าต้องการลบ Trip Plan{" "}
              <strong>{deleteCandidate.title}</strong> ใช่หรือไม่?
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeleteCandidate(null)}
                disabled={actionLoading}
              >
                ยกเลิก
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
              >
                {actionLoading ? "กำลังลบ..." : "ยืนยันการลบ"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm duplicate modal */}
      {duplicateCandidate && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center p-4">
          <div
            className="bg-black/55 absolute inset-0"
            onClick={() => !duplicateLoading && setDuplicateCandidate(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
                <Copy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  ทำสำเนาแผนงาน (Duplicate Plan)
                </h3>
                <p className="text-xs text-slate-500">
                  สร้างแผนงานใหม่จากข้อมูลของแผนงานเดิม
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between">
                <span className="text-slate-500">เลขที่แผนเดิม:</span>
                <span className="font-mono font-bold text-blue-600">
                  {(duplicateCandidate as any).code ||
                    duplicateCandidate.id.slice(0, 8)}
                </span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-slate-500 shrink-0">ชื่อกิจกรรม:</span>
                <span
                  className="font-semibold text-slate-800 truncate"
                  title={duplicateCandidate.title}
                >
                  {duplicateCandidate.title}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              ระบบจะสร้างแผนงานใหม่ในสถานะ <strong>แบบร่าง (Draft)</strong>{" "}
              โดยคัดลอกข้อมูลทั้งหมดจากแผนงานนี้
              (ยกเว้นผลการปฏิบัติงานและประวัติการอนุมัติ)
            </p>

            <div className="pt-2 flex justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={() => setDuplicateCandidate(null)}
                disabled={duplicateLoading}
                className="rounded-xl text-xs h-9"
              >
                ยกเลิก
              </Button>
              <Button
                onClick={handleDuplicateConfirm}
                disabled={duplicateLoading}
                className="rounded-xl text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white font-bold gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                {duplicateLoading ? "กำลังทำสำเนา..." : "ยืนยันทำสำเนา"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <ActivityPlanTable
        data={activityPlans}
        loading={loading}
        viewScope={viewScope}
        onScopeChange={handleScopeChange}
        scopeCounts={scopeCounts}
        pagination={{
          page,
          perPage,
          total,
          onPageChange: setPage,
          onPerPageChange: setPerPage,
          perPageOptions: [10, 20, 30],
        }}
        searchValue={searchDraft}
        onSearchChange={setSearchDraft}
        onSearchSubmit={() => {}}
        statusFilter={statusFilter}
        onStatusFilterChange={handleStatusFilterChange}
        workTypeFilter={workTypeFilter}
        onWorkTypeFilterChange={handleWorkTypeFilterChange}
        workTypeOptions={workTypeOptions}
        personFilter={personFilter}
        onPersonFilterChange={handlePersonFilterChange}
        personOptions={personOptions}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canApprove={canApprove}
        onDelete={handleDeleteRequest}
        onDuplicate={handleDuplicateRequest}
        onSubmitApproval={handleSubmitApproval}
        submitLoadingId={submitLoadingId}
        onRefresh={() => fetchData()}
        selectedPlanIds={selectedPlans.map((p) => p.id)}
        onToggleSelectPlan={handleToggleSelectPlan}
        onToggleSelectAll={handleToggleSelectAll}
      />

      {/* Floating batch submission bar & dialog */}
      <BatchSubmitBar
        selectedCount={selectedPlans.length}
        onClearSelection={handleClearSelection}
        onSubmitClick={() => setBatchDialogOpen(true)}
        isSubmitting={batchSubmitting}
      />

      <BatchSubmitDialog
        open={batchDialogOpen}
        onOpenChange={setBatchDialogOpen}
        selectedPlans={selectedPlans}
        onConfirm={handleBatchSubmitConfirm}
        isSubmitting={batchSubmitting}
      />
    </div>
  );
}
