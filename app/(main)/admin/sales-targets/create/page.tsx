"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Loader2,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  ChevronLeft,
  Target,
  ShoppingCart,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

interface ProductItem {
  productId: string;
  name: string;
  quantity: number;
  amount: number;
}

const MONTHS = [
  { value: 1, label: "มกราคม" },
  { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" },
  { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" },
  { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" },
  { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" },
  { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" },
  { value: 12, label: "ธันวาคม" },
];

export default function CreateSalesTargetPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  // Form State
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [employeeId, setEmployeeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [items, setItems] = useState<ProductItem[]>([]);

  // Selection Data
  const [employees, setEmployees] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customersOpen, setCustomersOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  // Search State
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch Employees
      const empRes = await fetch("/api/employee");
      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(data.employees || data);
      }

      // Fetch Customers (Initial list)
      const custRes = await fetch("/api/customers?perPage=10");
      if (custRes.ok) {
        const data = await custRes.json();
        setCustomers(data.customers || data);
      }

      // Fetch Products (Initial list)
      const prodRes = await fetch("/api/products?perPage=10&status=ACTIVE");
      if (prodRes.ok) {
        const data = await prodRes.json();
        setProducts(data.products || data);
      }
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  const handleSearchCustomers = async (query: string) => {
    setCustomerSearch(query);
    if (query.length < 2) return;
    try {
      const res = await fetch(`/api/customers?q=${query}&perPage=10`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchProducts = async (query: string) => {
    setProductSearch(query);
    if (query.length < 2) return;
    try {
      const res = await fetch(
        `/api/products?q=${query}&perPage=10&status=ACTIVE`,
      );
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddItem = (product: any) => {
    if (items.some((i) => i.productId === product.id)) {
      toast.info("สินค้านี้ถูกเพิ่มแล้ว");
      return;
    }
    setItems([
      ...items,
      {
        productId: product.id,
        name: product.name,
        quantity: 1,
        amount: Number(product.price || 0),
      },
    ]);
    setProductsOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (
    index: number,
    field: keyof ProductItem,
    value: number,
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const handleSave = async () => {
    if (!employeeId || !customerId || items.length === 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        type: "detailed",
        targets: [
          {
            year,
            month,
            employeeId,
            customerId,
            items: items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              amount: i.amount,
            })),
          },
        ],
      };

      const res = await fetch("/api/sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed");

      toast.success("บันทึกสำเร็จ");
      router.push("/admin/sales-targets");
    } catch {
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Modern Header with Glassmorphism */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-violet-600/10 blur-3xl" />
          <div className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl shadow-blue-500/10 p-6 sm:p-8">
            <div className="flex items-center gap-4">
              <Link
                href="/admin/sales-targets"
                className="group flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-50 border border-slate-200/60 hover:border-blue-300/60 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105 active:scale-95"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
              </Link>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    เพิ่มเป้าหมายการขาย
                  </h1>
                </div>
                <p className="text-slate-600 text-sm sm:text-base ml-13">
                  สร้างเป้าหมายยอดขายใหม่สำหรับพนักงาน
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="border-0 bg-white/80 backdrop-blur-xl shadow-2xl shadow-slate-900/5 rounded-3xl overflow-hidden">
          <CardContent className="p-6 sm:p-8 lg:p-10">
            <div className="grid gap-10">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left Column: General Info */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100">
                      <ShoppingCart className="w-4 h-4 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">
                      ข้อมูลทั่วไป
                    </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold text-slate-700">
                        เดือน
                      </Label>
                      <Select
                        value={month.toString()}
                        onValueChange={(v) => setMonth(Number(v))}
                      >
                        <SelectTrigger className="h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-50/50 border-slate-200/80 hover:border-blue-300/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {MONTHS.map((m) => (
                            <SelectItem 
                              key={m.value} 
                              value={m.value.toString()}
                              className="rounded-lg"
                            >
                              {m.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2.5">
                      <Label className="text-sm font-semibold text-slate-700">
                        ปี
                      </Label>
                      <Input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(Number(e.target.value))}
                        className="h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-50/50 border-slate-200/80 hover:border-blue-300/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-slate-700">
                      พนักงานขาย
                    </Label>
                    <Select value={employeeId} onValueChange={setEmployeeId}>
                      <SelectTrigger className="h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-50/50 border-slate-200/80 hover:border-blue-300/60 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 font-medium">
                        <SelectValue placeholder="เลือกพนักงาน" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {employees.map((emp) => (
                          <SelectItem 
                            key={emp.id} 
                            value={emp.id}
                            className="rounded-lg"
                          >
                            {emp.name} ({emp.employeeCode || "-"})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2.5">
                    <Label className="text-sm font-semibold text-slate-700">
                      ลูกค้า/ร้านค้า
                    </Label>
                    <Popover open={customersOpen} onOpenChange={setCustomersOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between h-12 rounded-xl bg-gradient-to-br from-slate-50 to-slate-50/50 border-slate-200/80 hover:border-blue-300/60 hover:bg-slate-100/50 transition-all duration-200 text-left font-medium",
                            !customerId && "text-slate-500",
                          )}
                        >
                          {customerId
                            ? customers.find((c) => c.id === customerId)?.name ||
                              customers.find((c) => c.id === customerId)
                                ?.customerCode ||
                              "เลือกลูกค้า"
                            : "ค้นหาลูกค้า..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0 rounded-2xl shadow-2xl border-slate-200/60">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="พิมพ์ชื่อร้านค้า..."
                            value={customerSearch}
                            onValueChange={handleSearchCustomers}
                            className="h-12 border-b"
                          />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                              ไม่พบข้อมูล
                            </CommandEmpty>
                            <CommandGroup>
                              {customers.map((customer) => (
                                <CommandItem
                                  value={customer.name}
                                  key={customer.id}
                                  onSelect={() => {
                                    setCustomerId(customer.id);
                                    setCustomersOpen(false);
                                  }}
                                  className="cursor-pointer py-3 px-4 rounded-lg mx-2 my-1"
                                >
                                  <Check
                                    className={cn(
                                      "mr-3 h-4 w-4 text-emerald-500",
                                      customer.id === customerId
                                        ? "opacity-100"
                                        : "opacity-0",
                                    )}
                                  />
                                  <div>
                                    <div className="font-medium text-slate-800">
                                      {customer.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {customer.customerCode}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Right Column: Product Items */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100">
                        <Package className="w-4 h-4 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">
                        รายการสินค้า
                      </h3>
                    </div>
                    <Popover open={productsOpen} onOpenChange={setProductsOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          size="sm"
                          className="h-10 gap-2 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 font-medium"
                        >
                          <Plus className="w-4 h-4" />
                          เพิ่มสินค้า
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent
                        className="w-[340px] p-0 rounded-2xl shadow-2xl border-slate-200/60"
                        align="end"
                      >
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="ค้นหาสินค้า..."
                            value={productSearch}
                            onValueChange={handleSearchProducts}
                            className="h-12 border-b"
                          />
                          <CommandList>
                            <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                              ไม่พบสินค้า
                            </CommandEmpty>
                            <CommandGroup>
                              {products.map((p) => (
                                <CommandItem
                                  key={p.id}
                                  value={p.name}
                                  onSelect={() => handleAddItem(p)}
                                  className="cursor-pointer py-3 px-4 rounded-lg mx-2 my-1"
                                >
                                  <div>
                                    <div className="font-medium text-slate-800">
                                      {p.name}
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      {p.productCode}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-3 min-h-[350px] bg-gradient-to-br from-slate-50/80 to-blue-50/30 rounded-2xl p-5 border-2 border-dashed border-slate-200/80">
                    {items.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-center py-16 animate-in fade-in duration-500">
                        <div className="relative mb-6">
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 blur-2xl rounded-full" />
                          <div className="relative w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-50 rounded-2xl flex items-center justify-center shadow-lg border border-slate-200/60">
                            <Package className="w-9 h-9 text-slate-400" />
                          </div>
                        </div>
                        <p className="font-semibold text-slate-700 text-lg mb-2">
                          ยังไม่มีรายการสินค้า
                        </p>
                        <p className="text-sm text-slate-500 max-w-xs">
                          กดปุ่ม "เพิ่มสินค้า" เพื่อเริ่มเพิ่มรายการเป้าหมายการขาย
                        </p>
                      </div>
                    )}
                    {items.map((item, index) => (
                      <div
                        key={item.productId}
                        className="group relative bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 hover:border-blue-300/60 hover:-translate-y-1"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative space-y-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 pr-4">
                              <div className="text-sm font-bold text-slate-800 mb-1">
                                {item.name}
                              </div>
                              <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-xs text-slate-600 font-medium">
                                {item.productId.substring(0, 12)}...
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                              onClick={() => handleRemoveItem(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                จำนวน
                              </Label>
                              <Input
                                type="number"
                                className="h-11 bg-slate-50/80 border-slate-200/80 hover:border-blue-300/60 focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20 rounded-xl text-right font-semibold text-slate-800 transition-all"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    index,
                                    "quantity",
                                    Number(e.target.value),
                                  )
                                }
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                เป้าหมาย (บาท)
                              </Label>
                              <Input
                                type="number"
                                className="h-11 bg-emerald-50/80 border-emerald-200/80 hover:border-emerald-300/60 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20 rounded-xl text-right font-bold text-emerald-700 transition-all"
                                value={item.amount}
                                onChange={(e) =>
                                  handleUpdateItem(
                                    index,
                                    "amount",
                                    Number(e.target.value),
                                  )
                                }
                                onWheel={(e) => e.currentTarget.blur()}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {items.length > 0 && (
                    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 shadow-2xl border border-slate-700/50">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
                      <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
                      
                      <div className="relative space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <span className="text-slate-400 text-sm font-medium">
                            จำนวนรายการ
                          </span>
                          <span className="text-white font-bold text-lg">
                            {items.length} รายการ
                          </span>
                        </div>
                        
                        <div className="flex items-end justify-between pt-2">
                          <div>
                            <span className="text-slate-400 text-xs uppercase tracking-wider block mb-1">
                              รวมยอดเงินเป้าหมาย
                            </span>
                            <span className="text-xs text-slate-500">
                              โดยประมาณ
                            </span>
                          </div>
                          <div className="text-right">
                            <div className="flex items-baseline gap-1">
                              <span className="text-emerald-400 text-sm font-medium">
                                ฿
                              </span>
                              <span className="text-4xl font-black text-white tracking-tight">
                                {items
                                  .reduce((s, i) => s + i.amount, 0)
                                  .toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-100">
                <Link href="/admin/sales-targets">
                  <Button
                    variant="outline"
                    className="h-12 px-8 rounded-xl border-2 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    ยกเลิก
                  </Button>
                </Link>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="h-12 px-10 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:via-indigo-700 hover:to-violet-700 text-white shadow-xl shadow-blue-500/30 font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {saving ? "กำลังบันทึก..." : "บันทึกเป้าหมาย"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}