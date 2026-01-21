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
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/admin/sales-targets"
              className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm border border-slate-200/60 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                เพิ่มเป้าหมายการขาย1
              </h1>
              <p className="text-slate-500 text-sm">
                สร้างเป้าหมายยอดขายใหม่สำหรับพนักงาน
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-0 bg-white/70 backdrop-blur-sm shadow-lg">
        <CardContent className="p-6">
          <div className="grid gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>เดือน</Label>
                    <Select
                      value={month.toString()}
                      onValueChange={(v) => setMonth(Number(v))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MONTHS.map((m) => (
                          <SelectItem key={m.value} value={m.value.toString()}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>ปี</Label>
                    <Input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>พนักงานขาย</Label>
                  <Select value={employeeId} onValueChange={setEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกพนักงาน" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} ({emp.employeeCode || "-"})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ลูกค้า/ร้านค้า</Label>
                  <Popover open={customersOpen} onOpenChange={setCustomersOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !customerId && "text-muted-foreground",
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
                    <PopoverContent className="w-[400px] p-0">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="พิมพ์ชื่อร้านค้า..."
                          value={customerSearch}
                          onValueChange={handleSearchCustomers}
                        />
                        <CommandList>
                          <CommandEmpty>ไม่พบข้อมูล</CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                value={customer.name}
                                key={customer.id}
                                onSelect={() => {
                                  setCustomerId(customer.id);
                                  setCustomersOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    customer.id === customerId
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {customer.name} ({customer.customerCode})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Product Items Section */}
              <div className="space-y-4 border rounded-xl p-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">รายการสินค้า</h3>
                  <Popover open={productsOpen} onOpenChange={setProductsOpen}>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline" className="h-8 gap-1">
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มสินค้า
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="end">
                      <Command shouldFilter={false}>
                        <CommandInput
                          placeholder="ค้นหาสินค้า..."
                          value={productSearch}
                          onValueChange={handleSearchProducts}
                        />
                        <CommandList>
                          <CommandEmpty>ไม่พบสินค้า</CommandEmpty>
                          <CommandGroup>
                            {products.map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.name}
                                onSelect={() => handleAddItem(p)}
                              >
                                {p.name} ({p.productCode})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2 min-h-[200px]">
                  {items.length === 0 && (
                    <div className="text-center py-8 text-slate-400 text-sm flex flex-col items-center justify-center h-full">
                      <Plus className="w-8 h-8 opacity-20 mb-2" />
                      ยังไม่มีรายการสินค้า
                    </div>
                  )}
                  {items.map((item, index) => (
                    <div
                      key={item.productId}
                      className="flex items-start gap-3 bg-white p-3 rounded-lg border shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.name}</div>
                      </div>
                      <div className="w-24">
                        <Label className="text-xs mb-1 block">จำนวน</Label>
                        <Input
                          type="number"
                          className="h-8"
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
                      <div className="w-32">
                        <Label className="text-xs mb-1 block">
                          เป้าหมาย (บาท)
                        </Label>
                        <Input
                          type="number"
                          className="h-8"
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 mt-5"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {items.length > 0 && (
                  <div className="flex justify-end gap-4 text-sm font-medium pt-2 border-t mt-4">
                    <div>
                      รวมจำนวน: {items.reduce((s, i) => s + i.quantity, 0)}
                    </div>
                    <div>
                      รวมยอดเงิน: ฿
                      {items.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Link href="/admin/sales-targets">
                <Button variant="outline">ยกเลิก</Button>
              </Link>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                บันทึกเป้าหมาย
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
