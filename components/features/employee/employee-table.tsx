"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import {
  Trash2,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  Search,
  Edit2,
  Eye,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { usePermission } from "@/hooks/use-permission";
import type { Employee } from "@/types/Employee";

// Note: mock data removed — component will show fetched data or empty state

type EmployeesGridProps = {
  employees?: Employee[];
};

export default function EmployeesGrid({ employees }: EmployeesGridProps) {
  const router = useRouter();
  const { allowed, isLoading, hasPermission } = usePermission("menu.employees");

  const permissionHint =
    "จำเป็นต้องมีสิทธิ์ employee.manage เพื่อเพิ่มพนักงานใหม่";
  const canCreate =
    !isLoading &&
    (hasPermission("employee.manage") || hasPermission("employee.create"));
  const canEdit =
    hasPermission("employee.manage") || hasPermission("employee.edit");
  const canDelete =
    hasPermission("employee.manage") || hasPermission("employee.delete");
  const canView =
    hasPermission("menu.employees") || hasPermission("employee.view");

  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);

  // fetched employees (client-side). If `employees` prop provided prefer it,
  // otherwise fetch from the API and fall back to mock data for visuals.
  const [fetched, setFetched] = useState<Employee[] | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchLoading, setFetchLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      // don't fetch if server provided employees prop
      if (employees && employees.length > 0) return;
      setFetchLoading(true);
      try {
        const res = await fetch(`/api/employee`, { method: "GET" });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || `Status ${res.status}`);
        }
        const json = await res.json();
        if (!mounted) return;
        setFetched(json.employees ?? []);
      } catch (err: any) {
        if (!mounted) return;
        setFetchError(err?.message ?? String(err));
      } finally {
        if (!mounted) return;
        setFetchLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [employees]);

  // If no employees passed, use fetched data (if any), otherwise empty list
  const data: Employee[] =
    employees && employees.length > 0
      ? employees
      : fetched && fetched.length
      ? fetched
      : [];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter((e) =>
      [e.id, e.name, e.email, e.role]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [data, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const pageItems = filtered.slice(startIndex, startIndex + itemsPerPage);
  const startDisplay = filtered.length ? startIndex + 1 : 0;
  const endDisplay = Math.min(startIndex + itemsPerPage, filtered.length);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/employee/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Status ${res.status}`);
      }
      setDeleteTarget(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      setDeleteTarget(null);
    }
  };

  if (isLoading || fetchLoading) {
    return (
      <Card className="p-4 text-sm text-slate-500">
        กำลังโหลดรายการพนักงาน...
      </Card>
    );
  }

  if (!allowed) {
    return (
      <Card className="p-4">
        <div className="text-sm text-red-600">
          คุณไม่มีสิทธิ์เปิดดูเมนูพนักงาน
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      {/* header: search + add */}
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between mt-3">
        <div className="relative w-full max-w-md">
          {" "}
          {/* 1. เปลี่ยน Div หลักเป็น relative */}
          <Input
            placeholder="ค้นหา"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            // 2. ปรับ padding ซ้าย (pl) ของ Input ให้เว้นที่ว่างสำหรับไอคอน
            className="pl-10 pr-4 max-w-full"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            {" "}
            {/* 3. วางไอคอนแบบ absolute */}
            <Search className="h-4 w-4 text-slate-400" />
          </span>
        </div>

        {canCreate ? (
          <Link href="/employee/new">
            <Button className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 mt-2 md:mt-0">
              <span className="inline-flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                เพิ่มพนักงาน
              </span>
            </Button>
          </Link>
        ) : (
          <Button
            className="w-full md:w-auto mt-2 md:mt-0"
            variant="outline"
            disabled
            title={permissionHint}
          >
            <span className="inline-flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              เพิ่มพนักงาน
            </span>
          </Button>
        )}
      </div>

      {/* grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
        {pageItems.map((e) => (
          <div
            key={e.id}
            className="relative rounded-xl border bg-white p-4 shadow-sm"
          >
            {canDelete && (
              <button
                aria-label="ลบ"
                onClick={() => setDeleteTarget(e)}
                className="absolute right-3 top-3 rounded-md p-1 text-red-600 hover:bg-red-50"
                title="ลบ"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}

            <div className="flex flex-col items-center">
              <div className="relative mb-2 h-24 w-24 overflow-hidden rounded-full bg-slate-100">
                <Image
                  src="/images/man-avatar.png"
                  alt={e.name ?? "avatar"}
                  fill
                  style={{ objectFit: "cover" }}
                />
              </div>
              <div className="text-center">
                <div className="text-sm font-semibold text-slate-900">
                  {e.name}
                </div>
                <div className="mt-1 text-xs text-slate-500">{e.role}</div>
              </div>

              <div className="mt-3 flex gap-3">
                {canEdit && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/employees/${e.id}/edit`}>
                      <span className="inline-flex items-center gap-2">
                        <Edit2 className="h-4 w-4" />
                        แก้ไข
                      </span>
                    </Link>
                  </Button>
                )}
                {canView && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/dashboard/employees/${e.id}`}>
                      <span className="inline-flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        ประวัติ
                      </span>
                    </Link>
                  </Button>
                )}
              </div>

              <div className="mt-4 w-full border-t pt-3 text-center text-sm text-slate-700">
                <div className="flex justify-around">
                  <div>
                    <div className="text-lg font-bold">
                      {(e.id.charCodeAt(0) + 0 * 7) % 50}
                    </div>
                    <div className="text-xs text-slate-500">ที่เหลือ</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {(e.id.charCodeAt(0) + 1 * 7) % 50}
                    </div>
                    <div className="text-xs text-slate-500">กำลังทำ</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold">
                      {(e.id.charCodeAt(0) + 2 * 7) % 50}
                    </div>
                    <div className="text-xs text-slate-500">สำเร็จ</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-slate-500">
          {startDisplay}-{endDisplay} จาก {filtered.length}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* confirm delete dialog */}
      <Dialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[470px] sm:max-h-[200px] rounded-lg border-0">
          <DialogTitle>ลบพนักงาน</DialogTitle>
          <DialogDescription>
            ยืนยันการลบ {deleteTarget?.name ?? "ผู้ใช้งาน"}?
            การกระทำนี้ไม่สามารถย้อนกลับได้
          </DialogDescription>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteTarget(null)}
            >
              ยกเลิก
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" /> ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
