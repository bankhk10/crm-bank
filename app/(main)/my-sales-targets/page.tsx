"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import {
  Target,
  Save,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  Trash2,
  Package,
  Store,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { PRODUCT_GROUP_OPTIONS } from "@/types/product";

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

interface CustomerInfo {
  id: string;
  customerCode: string;
  name: string;
  province: string | null;
  region: string | null;
}

interface ProductInfo {
  id: string;
  productCode: string;
  name: string;
  productGroup: string | null;
  price: number | null;
}

interface TargetItem {
  id?: string;
  tempId?: string;
  customerId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  notes?: string;
  customer?: CustomerInfo;
  product?: ProductInfo;
}

export default function MySalesTargetsPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);

  // Employee info
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employeeChecked, setEmployeeChecked] = useState(false);

  // Current month targets
  const [targetItems, setTargetItems] = useState<TargetItem[]>([]);

  // Search states
  const [customers, setCustomers] = useState<CustomerInfo[]>([]);
  const [products, setProducts] = useState<ProductInfo[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [searchedCustomers, setSearchedCustomers] = useState<CustomerInfo[]>(
    [],
  );
  const [searchedProducts, setSearchedProducts] = useState<ProductInfo[]>([]);

  // Fetch employee ID
  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.employeeId) {
            setEmployeeId(data.employeeId);
          }
        }
      } catch (error) {
        console.error("Error fetching employee:", error);
      } finally {
        setEmployeeChecked(true);
        setLoading(false);
      }
    };
    fetchEmployee();
  }, []);

  // Fetch targets for selected month
  const fetchTargets = useCallback(async () => {
    if (!employeeId) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/employee-sales-targets?year=${year}&month=${selectedMonth}&employeeId=${employeeId}`,
      );
      if (!res.ok) throw new Error("Failed to fetch targets");

      const data = await res.json();

      // Map targets to items
      const items: TargetItem[] = (data.targets || []).map(
        (t: {
          id: string;
          customerId: string;
          productId: string;
          quantity: number;
          unitPrice: string | number;
          totalAmount: string | number;
          notes?: string;
          customer?: CustomerInfo;
          product?: ProductInfo;
        }) => ({
          id: t.id,
          customerId: t.customerId,
          productId: t.productId,
          quantity: t.quantity,
          unitPrice: Number(t.unitPrice),
          totalAmount: Number(t.totalAmount),
          notes: t.notes,
          customer: t.customer,
          product: t.product,
        }),
      );

      setTargetItems(items);

      // Add customers and products to the lists
      const newCustomers: CustomerInfo[] = [];
      const newProducts: ProductInfo[] = [];

      items.forEach((item: TargetItem) => {
        if (
          item.customer &&
          !customers.find((c) => c.id === item.customer?.id)
        ) {
          newCustomers.push(item.customer);
        }
        if (item.product && !products.find((p) => p.id === item.product?.id)) {
          newProducts.push(item.product);
        }
      });

      if (newCustomers.length > 0) {
        setCustomers((prev) => [...prev, ...newCustomers]);
      }
      if (newProducts.length > 0) {
        setProducts((prev) => [...prev, ...newProducts]);
      }
    } catch (error) {
      console.error("Error fetching targets:", error);
      toast.error("ไม่สามารถโหลดข้อมูลเป้าหมายได้");
    } finally {
      setLoading(false);
    }
  }, [year, selectedMonth, employeeId, customers, products]);

  useEffect(() => {
    if (employeeId) {
      fetchTargets();
    }
  }, [employeeId, year, selectedMonth, fetchTargets]);

  // Search customers
  const searchCustomers = async (search: string) => {
    if (!search.trim()) {
      setSearchedCustomers([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/customers?search=${encodeURIComponent(search)}&limit=10`,
      );
      if (res.ok) {
        const data = await res.json();
        setSearchedCustomers(data.customers || []);
      }
    } catch (error) {
      console.error("Error searching customers:", error);
    }
  };

  // Search products
  const searchProducts = async (search: string) => {
    if (!search.trim()) {
      setSearchedProducts([]);
      return;
    }

    try {
      const res = await fetch(
        `/api/products?search=${encodeURIComponent(search)}&limit=10&status=ACTIVE`,
      );
      if (res.ok) {
        const data = await res.json();
        setSearchedProducts(data.products || []);
      }
    } catch (error) {
      console.error("Error searching products:", error);
    }
  };

  // Add new target item
  const addTargetItem = (customer: CustomerInfo, product: ProductInfo) => {
    // Check if already exists
    const exists = targetItems.find(
      (item) =>
        item.customerId === customer.id && item.productId === product.id,
    );

    if (exists) {
      toast.info("รายการนี้มีอยู่แล้ว กรุณาแก้ไขจำนวนแทน");
      return;
    }

    const unitPrice = product.price || 0;
    const newItem: TargetItem = {
      tempId: `temp-${Date.now()}`,
      customerId: customer.id,
      productId: product.id,
      quantity: 1,
      unitPrice,
      totalAmount: unitPrice,
      customer,
      product,
    };

    setTargetItems((prev) => [...prev, newItem]);

    // Add to lists if not exists
    if (!customers.find((c) => c.id === customer.id)) {
      setCustomers((prev) => [...prev, customer]);
    }
    if (!products.find((p) => p.id === product.id)) {
      setProducts((prev) => [...prev, product]);
    }

    // Clear search
    setCustomerSearch("");
    setProductSearch("");
    setSearchedCustomers([]);
    setSearchedProducts([]);

    toast.success("เพิ่มรายการสำเร็จ");
  };

  // Update quantity
  const updateQuantity = (index: number, quantity: number) => {
    setTargetItems((prev) =>
      prev.map((item, i) => {
        if (i === index) {
          const newQuantity = Math.max(0, quantity);
          return {
            ...item,
            quantity: newQuantity,
            totalAmount: newQuantity * item.unitPrice,
          };
        }
        return item;
      }),
    );
  };

  // Remove target item
  const removeTargetItem = async (index: number) => {
    const item = targetItems[index];

    if (item.id) {
      // Delete from server
      try {
        const res = await fetch(`/api/employee-sales-targets?id=${item.id}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("Failed to delete");
        toast.success("ลบรายการสำเร็จ");
      } catch (error) {
        toast.error("ไม่สามารถลบรายการได้");
        return;
      }
    }

    setTargetItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Save targets
  const saveTargets = async () => {
    if (!employeeId) {
      toast.error("ไม่พบข้อมูลพนักงาน");
      return;
    }

    setSaving(true);
    try {
      const items = targetItems
        .filter((item) => item.quantity > 0)
        .map((item) => ({
          customerId: item.customerId,
          productId: item.productId,
          quantity: item.quantity,
          notes: item.notes,
        }));

      const res = await fetch("/api/employee-sales-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId,
          year,
          month: selectedMonth,
          items,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setSuccessDialogOpen(true);
      fetchTargets(); // Refresh data
    } catch (error) {
      console.error("Error saving targets:", error);
      toast.error("ไม่สามารถบันทึกเป้าหมายได้");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("th-TH").format(value);
  };

  const calculateMonthTotal = () => {
    return targetItems.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  const getProductGroupLabel = (value: string | null | undefined) => {
    if (!value) return "-";
    const group = PRODUCT_GROUP_OPTIONS.find((g) => g.value === value);
    return group?.label || value;
  };

  // Show loading while checking employee
  if (!employeeChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Show message if user is not an employee
  if (employeeChecked && !employeeId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4">
        <Card className="max-w-md w-full overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 w-fit mx-auto mb-4">
              <Target className="w-8 h-8 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">
              ไม่สามารถเข้าถึงหน้านี้ได้
            </h2>
            <p className="text-slate-600 mb-6">
              หน้านี้สำหรับพนักงานตั้งเป้าหมายยอดขายส่วนตัว
              <br />
              บัญชีของคุณยังไม่ได้เชื่อมโยงกับข้อมูลพนักงาน
            </p>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white">
                <ChevronLeft className="w-4 h-4 mr-2" />
                กลับหน้าหลัก
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
      {/* Success Dialog */}
      <AlertDialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-gradient-to-br from-emerald-100 to-green-100">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">
              บันทึกสำเร็จ
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              บันทึกเป้าหมายยอดขายเดือน {MONTHS[selectedMonth - 1]?.label}{" "}
              {year} เรียบร้อยแล้ว
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
              ตกลง
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard"
              className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm border border-slate-200/60 transition-all"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
                ตั้งเป้าหมายยอดขายของฉัน
              </h1>
              <p className="text-slate-500 text-sm">
                กำหนดเป้าหมายยอดขายรายเดือน ตามร้านค้าและสินค้า
              </p>
            </div>
          </div>
        </div>

        {/* Year Selector */}
        <div className="flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm border border-slate-200/60">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex items-center gap-2 px-3">
            <Calendar className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-lg">{year}</span>
          </div>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Month Selector */}
      <div className="flex flex-wrap gap-2">
        {MONTHS.map((month) => (
          <button
            key={month.value}
            onClick={() => setSelectedMonth(month.value)}
            className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
              selectedMonth === month.value
                ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
                : "bg-white/80 text-slate-600 hover:bg-white border border-slate-200/60"
            }`}
          >
            {month.label}
          </button>
        ))}
      </div>

      {/* Summary Card */}
      <Card className="relative overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-indigo-500/10 pointer-events-none" />
        <CardContent className="relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400 mb-1">
                เป้าหมายเดือน {MONTHS[selectedMonth - 1]?.label}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-blue-400 tracking-tight">
                  ฿{formatCurrency(calculateMonthTotal())}
                </span>
                <span className="text-xs text-slate-500">THB</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-slate-300">
                {targetItems.length} รายการ
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Target */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-100 to-green-100">
              <Plus className="w-5 h-5 text-emerald-600" />
            </div>
            <CardTitle>เพิ่มเป้าหมายใหม่</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Store className="w-4 h-4 text-slate-500" />
                ค้นหาร้านค้า
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => {
                    setCustomerSearch(e.target.value);
                    searchCustomers(e.target.value);
                  }}
                  placeholder="พิมพ์รหัสหรือชื่อร้านค้า..."
                  className="bg-white border-slate-200"
                />
                {searchedCustomers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-auto">
                    {searchedCustomers.map((customer) => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setCustomers((prev) => {
                            if (prev.find((c) => c.id === customer.id))
                              return prev;
                            return [...prev, customer];
                          });
                          setCustomerSearch(customer.name);
                          setSearchedCustomers([]);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                      >
                        <span className="text-sm font-medium text-slate-600">
                          {customer.customerCode}
                        </span>
                        <span className="text-sm text-slate-800">
                          {customer.name}
                        </span>
                        {customer.region && (
                          <span className="text-xs text-slate-400">
                            ({customer.region})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {customers.length > 0 && (
                <Select
                  value=""
                  onValueChange={(value) => {
                    const customer = customers.find((c) => c.id === value);
                    if (customer) {
                      setCustomerSearch(customer.name);
                    }
                  }}
                >
                  <SelectTrigger className="bg-white border-slate-200">
                    <SelectValue placeholder="หรือเลือกจากรายการที่เคยใช้" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.customerCode} - {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Product Search */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                ค้นหาสินค้า
              </Label>
              <div className="relative">
                <Input
                  type="text"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    searchProducts(e.target.value);
                  }}
                  placeholder="พิมพ์รหัสหรือชื่อสินค้า..."
                  className="bg-white border-slate-200"
                />
                {searchedProducts.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-lg border border-slate-200 max-h-60 overflow-auto">
                    {searchedProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => {
                          // If we have a customer selected, add the item directly
                          const selectedCustomer = customers.find(
                            (c) => c.name === customerSearch,
                          );
                          if (selectedCustomer) {
                            addTargetItem(selectedCustomer, product);
                          } else {
                            setProducts((prev) => {
                              if (prev.find((p) => p.id === product.id))
                                return prev;
                              return [...prev, product];
                            });
                            setProductSearch(product.name);
                            setSearchedProducts([]);
                            toast.info("กรุณาเลือกร้านค้าก่อน");
                          }
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-slate-50"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium text-slate-600">
                              {product.productCode}
                            </span>
                            <span className="text-sm text-slate-800 ml-2">
                              {product.name}
                            </span>
                          </div>
                          <span className="text-sm text-emerald-600 font-medium">
                            ฿{formatCurrency(product.price || 0)}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          กลุ่ม: {getProductGroupLabel(product.productGroup)}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Target Items Table */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-white/70 backdrop-blur-sm shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100">
                <Target className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle>
                รายการเป้าหมาย - {MONTHS[selectedMonth - 1]?.label}
              </CardTitle>
            </div>
            <Button
              onClick={saveTargets}
              disabled={saving || targetItems.length === 0}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              บันทึก
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : targetItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Target className="w-12 h-12 mb-4 opacity-50" />
              <p>ยังไม่มีรายการเป้าหมายสำหรับเดือนนี้</p>
              <p className="text-sm">
                ค้นหาร้านค้าและสินค้าด้านบนเพื่อเพิ่มเป้าหมาย
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ร้านค้า
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ภาค
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      สินค้า
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      กลุ่ม
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      จำนวน (ลัง)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ราคา/ลัง
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      รวม
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                      ลบ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {targetItems.map((item, index) => (
                    <tr
                      key={item.id || item.tempId}
                      className="hover:bg-slate-50/50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">
                            {item.customer?.name || "-"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.customer?.customerCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-600">
                          {item.customer?.region || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-slate-800">
                            {item.product?.name || "-"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {item.product?.productCode}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
                          {getProductGroupLabel(item.product?.productGroup)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Input
                            type="number"
                            min={0}
                            onWheel={(e) => e.currentTarget.blur()}
                            value={item.quantity}
                            onChange={(e) =>
                              updateQuantity(
                                index,
                                parseInt(e.target.value) || 0,
                              )
                            }
                            className="w-24 text-center bg-white border-slate-200"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        ฿{formatCurrency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                        ฿{formatCurrency(item.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTargetItem(index)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gradient-to-r from-slate-50 to-slate-100">
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-4 text-right font-semibold text-slate-700"
                    >
                      รวมทั้งหมด:
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-xl font-bold text-emerald-600">
                        ฿{formatCurrency(calculateMonthTotal())}
                      </span>
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
