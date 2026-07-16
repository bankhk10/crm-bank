import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserRound, Eye, Search } from "lucide-react";
import CustomTable from "@/components/custom/custom-table";
import { TruncatedCell } from "@/components/custom/truncated-cell";
import { ActionButton } from "@/components/custom/action-button";

interface PersonalForecastRow {
  employeeId: string;
  employeeName: string;
  totalAmount: number;
  totalQuantity: number;
  details: any[];
}

interface MonthOption {
  value: string;
  label: string;
}

interface PersonalForecastSectionProps {
  data: PersonalForecastRow[];
  monthOptions: MonthOption[];
  selectedMonth: string;
  onMonthChange: (value: string) => void;
  formatCurrency: (value: number) => string;
  loading: boolean;
  error: string | null;
  year: number;
}

export const PersonalForecastSection = ({
  data,
  monthOptions,
  selectedMonth,
  onMonthChange,
  formatCurrency,
  loading,
  error,
  year,
}: PersonalForecastSectionProps) => {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    return data.filter((row) =>
      row.employeeName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

  const paginatedData = useMemo(() => {
    const start = (page - 1) * perPage;
    return filteredData.slice(start, start + perPage);
  }, [filteredData, page, perPage]);

  const totalItems = filteredData.length;

  const [prevMonth, setPrevMonth] = useState(selectedMonth);

  if (selectedMonth !== prevMonth) {
    setPrevMonth(selectedMonth);
    setPage(1);
    setSearchTerm("");
  }

  const paginationInfo = {
    page,
    perPage,
    total: totalItems,
    onPageChange: setPage,
    onPerPageChange: (n: number) => {
      setPerPage(n);
      setPage(1);
    },
    perPageOptions: [5, 10, 20, 50],
  };

  const columns = useMemo<ColumnDef<PersonalForecastRow>[]>(
    () => [
      {
        accessorKey: "employeeName",
        header: "พนักงาน",
        meta: {
          headerAlign: "left",
          align: "left",
          minWidth: 200,
          width: 300,
        },
        cell: ({ row }) => (
          <TruncatedCell
            value={row.original.employeeName}
            className="font-medium text-slate-900"
          />
        ),
      },
      {
        accessorKey: "totalAmount",
        header: "ยอดคาดการณ์",
        meta: {
          headerAlign: "right",
          align: "right",
          minWidth: 150,
          width: 200,
        },
        cell: ({ row }) => (
          <span className="font-semibold text-blue-700">
            {formatCurrency(row.original.totalAmount)}
          </span>
        ),
      },
      {
        accessorKey: "totalQuantity",
        header: "จำนวนสินค้า",
        meta: {
          headerAlign: "right",
          align: "right",
          minWidth: 120,
          width: 150,
        },
        cell: ({ row }) => (
          <span className="text-slate-600">
            {row.original.totalQuantity.toLocaleString()} รายการ
          </span>
        ),
      },
      {
        id: "actions",
        header: "จัดการ",
        meta: {
          headerAlign: "center",
          align: "center",
          minWidth: 100,
          width: 120,
        },
        cell: ({ row }) => (
          <div className="flex items-center justify-center">
            <ActionButton
              href={`/sales-forecast/${row.original.employeeId}?year=${year}`}
              icon={Eye}
              label="ดูหน้ารายละเอียด"
              colorClass="text-blue-600 border-blue-100 hover:bg-blue-50 rounded-md"
            />
          </div>
        ),
      },
    ],
    [formatCurrency, year],
  );

  return (
    <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
      <CardHeader className="border-b border-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
              <UserRound className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>ยอดคาดการณ์รายบุคคล</CardTitle>
              <p className="text-sm text-slate-500">
                สรุปยอดคาดการณ์รายบุคคลจากเป้าหมายที่บันทึกไว้
              </p>
            </div>
          </div>
          <div className="w-full sm:w-[260px] relative mt-2 sm:mt-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="ค้นหารายชื่อพนักงาน..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              className="pl-9 h-10 rounded-xl bg-white border-slate-200"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-600">
            {error}
          </div>
        ) : (
          <div className="w-full">
            <CustomTable
              columns={columns}
              data={paginatedData}
              loading={loading}
              pagination={paginationInfo}
              toolbar={<></>}
              emptyState={{
                title: "ไม่พบข้อมูลคาดการณ์รายบุคคล",
                description: "ลองปรับคำค้นหาใหม่",
              }}
              className="w-full"
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};
