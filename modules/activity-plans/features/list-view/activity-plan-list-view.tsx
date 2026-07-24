"use client";

import React, { useEffect, useState } from "react";
import { usePermission } from "@/hooks/use-permission";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PageHeader } from "@/components/custom/page-header";
import { ActivityPlanTable } from "./activity-plan-table";
import type { ActivityPlanWithRelations } from "../../types";
import {
  deleteActivityPlanAction,
  submitActivityPlanAction,
} from "../../server/actions";
import { Button } from "@/components/ui/button";

export default function ActivityPlanListView() {
  const { hasPermission, allowed, isLoading } = usePermission(
    "menu.activity_plans",
  );

  // Custom fallback permission check if menu permission is not seeded yet
  const canCreate =
    hasPermission("activity.create") || hasPermission("activity.manage");
  const canEdit =
    hasPermission("activity.edit") || hasPermission("activity.manage");
  const canDelete =
    hasPermission("activity.delete") || hasPermission("activity.manage");
  const canView =
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

  const [searchDraft, setSearchDraft] = useState<string>("");
  const [appliedSearch, setAppliedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const [deleteCandidate, setDeleteCandidate] =
    useState<ActivityPlanWithRelations | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [submitLoadingId, setSubmitLoadingId] = useState<string | null>(null);

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
  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("perPage", String(perPage));
      if (appliedSearch.trim()) params.set("q", appliedSearch.trim());
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/activity-plans?${params.toString()}`, {
        signal,
      });
      if (!res.ok) throw new Error("ดึงข้อมูลแผนกิจกรรมไม่สำเร็จ");
      const json = await res.json();
      setActivityPlans(json.activityPlans ?? []);
      setTotal(json.total ?? 0);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchData(controller.signal);
    return () => controller.abort();
  }, [page, perPage, appliedSearch, statusFilter]);

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
      setDeleteCandidate(null);
      fetchData(); // Reload
    } catch (err: any) {
      setError(err.message || "ลบแผนกิจกรรมล้มเหลว");
    } finally {
      setActionLoading(false);
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
      fetchData(); // Reload
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitLoadingId(null);
    }
  };

  if (isLoading) {
    return <div className="p-6 text-center">กำลังโหลดข้อมูล...</div>;
  }

  if (!canView) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertDescription>
          คุณไม่มีสิทธิ์เข้าถึงหน้ารายการแผนกิจกรรม
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-6 p-6 pb-24 md:pb-8">
      <PageHeader
        title="การวางแผนจัดกิจกรรม"
        description="สร้างและตรวจสอบความคืบหน้าของแผนกิจกรรมและงบประมาณการตลาด/ส่งเสริมการขาย"
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Confim deletion modal */}
      {deleteCandidate && (
        <div className="fixed inset-0 min-h-screen z-50 flex items-center justify-center">
          <div
            className="bg-black/55 absolute inset-0"
            onClick={() => setDeleteCandidate(null)}
          />
          <div className="relative z-10 w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">
              ยืนยันการลบแผนงาน
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              คุณแน่ใจว่าต้องการลบแผนกิจกรรม{" "}
              <strong>{deleteCandidate.title}</strong> ใช่หรือไม่?
              การลบจะเป็นแบบ Soft Delete
              ประวัติของแผนงานนี้จะไม่ถูกลบออกจากฐานข้อมูลถาวร
              แต่จะไม่แสดงบนหน้าจอรายการ
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

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <ActivityPlanTable
          data={activityPlans}
          loading={loading}
          pagination={{
            page,
            perPage,
            total,
            onPageChange: setPage,
            onPerPageChange: setPerPage,
          }}
          searchValue={searchDraft}
          onSearchChange={setSearchDraft}
          onSearchSubmit={() => {}}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          onDelete={handleDeleteRequest}
          onSubmitApproval={handleSubmitApproval}
          submitLoadingId={submitLoadingId}
        />
      </div>
    </section>
  );
}
