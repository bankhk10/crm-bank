"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { getSalesForecastColumns } from "@/components/features/sales-forecasts/columns";
import { SalesForecast, SalesForecastStatus } from "@/types/sales-forecast";

export default function SalesForecastsPage() {
  const router = useRouter();
  const [forecasts, setForecasts] = useState<SalesForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
      });

      if (year && year !== "all") {
        params.append("year", year);
      }

      if (status && status !== "all") {
        params.append("status", status);
      }

      const response = await fetch(`/api/sales-forecasts?${params}`);
      if (!response.ok) throw new Error("Failed to fetch sales forecasts");

      const data = await response.json();
      setForecasts(data.data);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching sales forecasts:", error);
      alert("ไม่สามารถโหลดข้อมูลการพยากรณ์การขายได้");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForecasts();
  }, [page, year, status]);

  const handleDelete = async (id: string) => {
    if (!confirm("คุณต้องการลบการพยากรณ์การขายนี้หรือไม่?")) return;

    try {
      const response = await fetch(`/api/sales-forecasts/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete");

      alert("ลบการพยากรณ์การขายสำเร็จ");
      fetchForecasts();
    } catch (error) {
      console.error("Error deleting forecast:", error);
      alert("ไม่สามารถลบการพยากรณ์การขายได้");
    }
  };

  const columns = getSalesForecastColumns({ onDelete: handleDelete });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>การพยากรณ์การขาย (Sales Forecast)</CardTitle>
            <Button asChild>
              <Link href="/sales-forecasts/new">
                <Plus className="mr-2 h-4 w-4" />
                สร้างการพยากรณ์ใหม่
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ปี</label>
                <Select value={year} onValueChange={setYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกปี" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกปี</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">สถานะ</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกสถานะ</SelectItem>
                    <SelectItem value="DRAFT">ร่าง</SelectItem>
                    <SelectItem value="SUBMITTED">ส่งแล้ว</SelectItem>
                    <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                    <SelectItem value="REJECTED">ปฏิเสธ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data Table */}
            <DataTable columns={columns} data={forecasts} loading={loading} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  ก่อนหน้า
                </Button>
                <span className="text-sm">
                  หน้า {page} จาก {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
