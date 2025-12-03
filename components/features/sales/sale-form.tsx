"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Copy, Info, Shuffle } from "lucide-react";
import FloatingLabelInput from "@/components/custom/FloatingLabelInputFixed";
import DatePicker from "@/components/custom/DatePicker";
import { Textarea } from "@/components/custom/Textarea";
import ThaiAddressPicker from "@/components/custom/ThaiAddressPicker";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { SaleFormData, SaleItemFormData } from "@/types/sales";

interface Customer {
  id: string;
  name: string;
  customerCode: string;
  billingAddress?: string;
  shippingAddress?: string;
  creditLimits?: Array<{
    id: string;
    limitAmount: number;
    promoAmount?: number;
    usedAmount: number;
    availableAmount: number;
    status: string;
  }>;
}

interface Employee {
  id: string;
  name: string;
  employeeCode?: string;
}

interface Product {
  id: string;
  name: string;
  productCode: string;
  price?: number;
  unit?: string;
  stockQuantity?: number;
  promotionItems?: Array<{ 
    id: string;
    name: string; 
    quantity: number;
    price?: number;
    notes?: string;
  }>;
  freeItems?: Array<{ 
    id: string;
    purchaseQty: number; 
    freeQty: number;
    netPrice?: number;
    notes?: string;
  }>;
}

interface SaleFormProps {
  initialData?: Partial<SaleFormData> & { id?: string };
  onSubmit: (data: SaleFormData) => Promise<void>;
  isEdit?: boolean;
  onCancel?: () => void;
}

export function SaleForm({
  initialData,
  onSubmit,
  isEdit = false,
  onCancel,
}: SaleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);

  // Customer & Employee data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState(initialData?.customerId || "");
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId || "");
  const [paymentTerm, setPaymentTerm] = useState<"PREPAID" | "CREDIT">(
    initialData?.paymentTerm || "PREPAID"
  );
  const [creditDays, setCreditDays] = useState(initialData?.creditDays || 0);
  const [creditDueDate, setCreditDueDate] = useState(
    initialData?.creditDueDate || ""
  );
  const [usePromotionalCredit, setUsePromotionalCredit] = useState(
    initialData?.usePromotionalCredit || false
  );
  const [promotionalCreditUsed, setPromotionalCreditUsed] = useState(
    initialData?.promotionalCreditUsed || 0
  );
  const [saleDate, setSaleDate] = useState(
    initialData?.saleDate || new Date().toISOString().split("T")[0]
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialData?.deliveryDate || ""
  );
  const [billingAddress, setBillingAddress] = useState(
    initialData?.billingAddress || ""
  );
  const [billingStreet, setBillingStreet] = useState("");
  const [billingThaiAddress, setBillingThaiAddress] = useState<{
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  }>({});
  const [shippingAddress, setShippingAddress] = useState(
    initialData?.shippingAddress || ""
  );
  const [shippingStreet, setShippingStreet] = useState("");
  const [shippingThaiAddress, setShippingThaiAddress] = useState<{
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  }>({});
  const [items, setItems] = useState<SaleItemFormData[]>(
    initialData?.items || []
  );
  const [shippingCost, setShippingCost] = useState(
    initialData?.shippingCost || 0
  );
  const [otherCosts, setOtherCosts] = useState(initialData?.otherCosts || 0);
  const [otherCostsDescription, setOtherCostsDescription] = useState(
    initialData?.otherCostsDescription || ""
  );
  const [notes, setNotes] = useState(initialData?.notes || "");

  // Selected customer info
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );

  // Product detail modal
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<Product | null>(null);

  // Load customers, employees, products
  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/employee").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([customersData, employeesData, productsData]) => {
        setCustomers(customersData.customers || []);
        setEmployees(employeesData.employees || []);
        setProducts(productsData.products || []);
      })
      .catch((err) => console.error("Error loading data:", err));
  }, []);

  // Update customer info when customer changes
  useEffect(() => {
    if (customerId) {
      const customer = customers.find((c) => c.id === customerId);
      setSelectedCustomer(customer || null);
      if (customer) {
        setBillingAddress(customer.billingAddress || "");
        setShippingAddress(customer.shippingAddress || "");
      }
    }
  }, [customerId, customers]);

  // Combine billing address parts into full address
  useEffect(() => {
    const parts = [
      billingStreet,
      billingThaiAddress.subdistrict
        ? `ตำบล${billingThaiAddress.subdistrict}`
        : "",
      billingThaiAddress.district ? `อำเภอ${billingThaiAddress.district}` : "",
      billingThaiAddress.province
        ? `จังหวัด${billingThaiAddress.province}`
        : "",
      billingThaiAddress.postalCode || "",
    ].filter(Boolean);
    if (parts.length > 0) {
      setBillingAddress(parts.join(" "));
    }
  }, [billingStreet, billingThaiAddress]);

  // Combine shipping address parts into full address
  useEffect(() => {
    const parts = [
      shippingStreet,
      shippingThaiAddress.subdistrict
        ? `ตำบล${shippingThaiAddress.subdistrict}`
        : "",
      shippingThaiAddress.district
        ? `อำเภอ${shippingThaiAddress.district}`
        : "",
      shippingThaiAddress.province
        ? `จังหวัด${shippingThaiAddress.province}`
        : "",
      shippingThaiAddress.postalCode || "",
    ].filter(Boolean);
    if (parts.length > 0) {
      setShippingAddress(parts.join(" "));
    }
  }, [shippingStreet, shippingThaiAddress]);

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const total = subtotal + shippingCost + otherCosts;

  // Add item
  const handleAddItem = () => {
    setItems([
      ...items,
      {
        productId: "",
        quantity: 1,
        unitPrice: 0,
        originalPrice: 0,
        priceModified: false,
      },
    ]);
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Update item
  const handleUpdateItem = (
    index: number,
    field: keyof SaleItemFormData,
    value: any
  ) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };

    // Auto-fill price when product is selected
    if (field === "productId") {
      const product = products.find((p) => p.id === value);
      if (product && product.price) {
        newItems[index].unitPrice = product.price;
        newItems[index].originalPrice = product.price;
        newItems[index].priceModified = false;
      }
    }

    // Check if price was modified
    if (field === "unitPrice") {
      newItems[index].priceModified = value !== newItems[index].originalPrice;
    }

    setItems(newItems);
  };

  // Copy billing address to shipping address
  const handleCopyAddress = () => {
    setShippingStreet(billingStreet);
    setShippingThaiAddress(billingThaiAddress);
  };

  // Random fill form for testing/demo — try server API first, fallback to client-side
  const handleRandomFill = async () => {
    try {
      const res = await fetch("/api/random-fill/sale");
      if (res.ok) {
        const data = await res.json();
        const s: any = data.sale;
        if (s) {
          setCustomerId(s.customerId || "");
          setEmployeeId(s.employeeId || "");
          setPaymentTerm(s.paymentTerm || "PREPAID");
          setCreditDays(s.creditDays || 0);
          setCreditDueDate(s.creditDueDate || "");
          setUsePromotionalCredit(!!s.usePromotionalCredit);
          setPromotionalCreditUsed(s.promotionalCreditUsed || 0);
          setSaleDate(s.saleDate || new Date().toISOString().split("T")[0]);
          setDeliveryDate(s.deliveryDate || "");
          setBillingAddress(s.billingAddress || "");
          setShippingAddress(s.shippingAddress || "");
          setItems(s.items || []);
          setShippingCost(s.shippingCost || 0);
          setOtherCosts(s.otherCosts || 0);
          setOtherCostsDescription(s.otherCostsDescription || "");
          setNotes(s.notes || "");
          setBillingStreet(s.billingAddress || "");
          setShippingStreet(s.shippingAddress || "");
          return;
        }
      }
    } catch (e) {
      // API not available or failed — fallback to local generator below
      console.warn("random-fill API failed, falling back to client generator", e);
    }

    // Client-side fallback (uses helper) — move demo data out of component
    if (customers.length === 0 || employees.length === 0 || products.length === 0) {
      alert("ไม่พบข้อมูลลูกค้า/พนักงาน/สินค้า เพียงพอสำหรับการสุ่ม");
      return;
    }

    try {
      const { generateRandomSaleClient } = await import("@/lib/random-fill/sale-client");
      const s = generateRandomSaleClient(customers, employees, products);

      setCustomerId(s.customerId || "");
      setEmployeeId(s.employeeId || "");
      setPaymentTerm(s.paymentTerm || "PREPAID");
      setCreditDays(s.creditDays || 0);
      setCreditDueDate(s.creditDueDate || "");
      setUsePromotionalCredit(!!s.usePromotionalCredit);
      setPromotionalCreditUsed(s.promotionalCreditUsed || 0);
      setSaleDate(s.saleDate || new Date().toISOString().split("T")[0]);
      setDeliveryDate(s.deliveryDate || "");
      setBillingAddress(s.billingAddress || "");
      setShippingAddress(s.shippingAddress || "");
      setItems(s.items || []);
      setShippingCost(s.shippingCost || 0);
      setOtherCosts(s.otherCosts || 0);
      setOtherCostsDescription(s.otherCostsDescription || "");
      setNotes(s.notes || "");
      setBillingStreet(s.billingAddress || "");
      setShippingStreet(s.shippingAddress || "");
    } catch (err) {
      console.warn("Failed to load client generator", err);
    }
  };

  // Validate and submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setWarnings([]);

    const newErrors: string[] = [];
    const newWarnings: string[] = [];

    // Validation
    if (!customerId) newErrors.push("กรุณาเลือกลูกค้า");
    if (!employeeId) newErrors.push("กรุณาเลือกพนักงานขาย");
    if (items.length === 0)
      newErrors.push("กรุณาเพิ่มรายการสินค้าอย่างน้อย 1 รายการ");
    if (!saleDate) newErrors.push("กรุณาระบุวันที่ขาย");

    // Validate items
    items.forEach((item, index) => {
      if (!item.productId) {
        newErrors.push(`รายการที่ ${index + 1}: กรุณาเลือกสินค้า`);
      }
      if (item.quantity <= 0) {
        newErrors.push(`รายการที่ ${index + 1}: กรุณาระบุจำนวนที่ถูกต้อง`);
      }
      if (item.unitPrice <= 0) {
        newErrors.push(`รายการที่ ${index + 1}: กรุณาระบุราคาที่ถูกต้อง`);
      }

      // Check stock
      const product = products.find((p) => p.id === item.productId);
      if (product && product.stockQuantity !== undefined) {
        if (product.stockQuantity < item.quantity) {
          newWarnings.push(
            `${product.name}: สต็อกไม่เพียงพอ (มี ${product.stockQuantity} ต้องการ ${item.quantity})`
          );
        }
      }

      // Check price modification
      if (item.priceModified) {
        newWarnings.push(
          `${product?.name || "สินค้า"}: ราคาถูกแก้ไขจาก ${
            item.originalPrice
          } เป็น ${item.unitPrice}`
        );
      }
    });

    // Check promotional credit validation
    if (usePromotionalCredit && selectedCustomer) {
      const creditLimit = selectedCustomer.creditLimits?.[0];
      const promoAmount = creditLimit?.promoAmount
        ? Number(creditLimit.promoAmount)
        : 0;

      if (promotionalCreditUsed > promoAmount) {
        newErrors.push(
          `วงเงินส่งเสริมการขายที่ใช้เกินวงเงินคงเหลือ (คงเหลือ: ฿${promoAmount.toLocaleString()})`
        );
      }

      if (promotionalCreditUsed < 0) {
        newErrors.push("วงเงินส่งเสริมการขายที่ใช้ต้องเป็นจำนวนบวก");
      }
    }

    // Check credit limit for CREDIT payment
    if (paymentTerm === "CREDIT" && selectedCustomer) {
      const creditLimit = selectedCustomer.creditLimits?.[0];
      const availableCredit = creditLimit?.availableAmount
        ? Number(creditLimit.availableAmount)
        : 0;
      const promoAmount = creditLimit?.promoAmount
        ? Number(creditLimit.promoAmount)
        : 0;
      const promotionalAvailable = usePromotionalCredit
        ? promoAmount - promotionalCreditUsed
        : 0;

      if (total > availableCredit + promotionalAvailable) {
        newErrors.push(
          `ยอดขายเกินวงเงินเครดิต (วงเงินคงเหลือ: ${availableCredit.toLocaleString()}, วงเงินส่งเสริมการขาย: ${promotionalAvailable.toLocaleString()})`
        );
      }
    }

    // Credit term validation
    if (paymentTerm === "CREDIT") {
      if (!creditDays || creditDays <= 0) {
        newErrors.push("กรุณาระบุจำนวนวันเครดิต");
      }
      if (!creditDueDate) {
        newErrors.push("กรุณาระบุวันครบกำหนดชำระ");
      }
    }

    setErrors(newErrors);
    setWarnings(newWarnings);

    if (newErrors.length > 0) {
      return;
    }

    // Submit
    setLoading(true);
    try {
      await onSubmit({
        customerId,
        employeeId,
        paymentTerm,
        creditDays: paymentTerm === "CREDIT" ? creditDays : undefined,
        creditDueDate: paymentTerm === "CREDIT" ? creditDueDate : undefined,
        usePromotionalCredit,
        promotionalCreditUsed: usePromotionalCredit
          ? promotionalCreditUsed
          : undefined,
        saleDate,
        deliveryDate: deliveryDate || undefined,
        billingAddress,
        shippingAddress,
        items,
        shippingCost,
        otherCosts,
        otherCostsDescription,
        notes,
      });
    } catch (error: any) {
      setErrors([error.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล"]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 mt-6">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertDescription>
            <ul className="list-disc pl-4">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert>
          <AlertDescription>
            <ul className="list-disc pl-4">
              {warnings.map((warning, i) => (
                <li key={i}>{warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>ข้อมูลลูกค้าและพนักงาน</span>
            <Button
              type="button"
              onClick={handleRandomFill}
              size="sm"
              className="ml-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-xl"
            >
              <Shuffle className="h-4 w-4 mr-2" />
              สุ่มข้อมูล
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingLabelInput
              label="ลูกค้า *"
              type="select"
              searchable
              value={customerId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setCustomerId(e.target.value)
              }
              options={customers.map((customer) => ({
                value: customer.id,
                label: `${customer.name} (${customer.customerCode})`,
              }))}
            />

            <FloatingLabelInput
              label="พนักงานขาย *"
              type="select"
              searchable
              value={employeeId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setEmployeeId(e.target.value)
              }
              options={employees.map((employee) => ({
                value: employee.id,
                label: employee.name,
              }))}
            />
          </div>

          {selectedCustomer &&
            (() => {
              const creditLimit = selectedCustomer.creditLimits?.[0];
              const availableAmount = creditLimit?.availableAmount
                ? Number(creditLimit.availableAmount)
                : 0;
              const promoAmount = creditLimit?.promoAmount
                ? Number(creditLimit.promoAmount)
                : 0;

              return (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FloatingLabelInput
                      label="วงเงินเครดิตคงเหลือ"
                      type="number"
                      value={availableAmount}
                      disabled={!usePromotionalCredit}
                      readOnly
                    />

                    <FloatingLabelInput
                      label="วงเงินส่งเสริมการขายคงเหลือ"
                      type="number"
                      value={promoAmount}
                      disabled
                      readOnly
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-3 p-4 dark:bg-blue-950 rounded-lg border">
                      <Checkbox
                        id="use-promo-credit"
                        checked={usePromotionalCredit}
                        onCheckedChange={(checked) => {
                          setUsePromotionalCredit(!!checked);
                          if (!checked) {
                            setPromotionalCreditUsed(0);
                          }
                        }}
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />

                      <label
                        htmlFor="use-promo-credit"
                        className="text-sm font-medium cursor-pointer select-none"
                      >
                        ใช้วงเงินส่งเสริมการขาย
                      </label>

                      {usePromotionalCredit && promoAmount > 0 && (
                        <div
                          className={`flex items-center px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 ${
                            promotionalCreditUsed > promoAmount
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                        >
                          <input
                            type="number"
                            value={promotionalCreditUsed || ""}
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              const value = e.target.value;

                              // ป้องกัน 0 นำหน้า
                              if (value === "" || value === "0") {
                                setPromotionalCreditUsed(0);
                              } else {
                                const numValue = Number(value);
                                setPromotionalCreditUsed(numValue);
                              }
                            }}
                            min={0}
                            max={promoAmount}
                            step="0.01"
                            className="w-36 bg-transparent outline-none text-right"
                          />

                          <span className="ml-2 text-gray-500 text-sm">฿</span>
                        </div>
                      )}

                      {usePromotionalCredit && (
                        <Badge
                          variant="secondary"
                          className="ml-auto bg-green-300/20 text-green-700 border-green-600"
                        >
                          เปิดใช้งาน
                        </Badge>
                      )}
                    </div>

                    {usePromotionalCredit &&
                      promoAmount > 0 &&
                      promotionalCreditUsed > promoAmount && (
                        <Alert variant="destructive" className="mt-1">
                          <AlertDescription className="text-sm">
                            ⚠️ จำนวนเงินที่ใช้เกินวงเงินส่งเสริมการขายคงเหลือ
                            (คงเหลือ: ฿{promoAmount.toLocaleString()})
                          </AlertDescription>
                        </Alert>
                      )}
                  </div>
                </>
              );
            })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>เงื่อนไขการชำระเงินและวันที่</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FloatingLabelInput
              label="เงื่อนไขการชำระเงิน *"
              type="select"
              value={paymentTerm}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setPaymentTerm(e.target.value as any)
              }
              options={[
                { value: "PREPAID", label: "โอนเงินก่อน" },
                { value: "CREDIT", label: "ส่งของก่อน" },
              ]}
            />

            <DatePicker
              label="วันที่ขาย *"
              value={saleDate}
              onChange={(val) => setSaleDate(val || "")}
            />

            <DatePicker
              label="วันที่จัดส่ง"
              value={deliveryDate}
              onChange={(val) => setDeliveryDate(val || "")}
            />
          </div>

          {paymentTerm === "CREDIT" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FloatingLabelInput
                label="เครดิต (วัน)"
                type="number"
                value={creditDays}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setCreditDays(Number(e.target.value))
                }
              />
              <DatePicker
                label="ครบกำหนดชำระ"
                value={creditDueDate}
                onChange={(val) => setCreditDueDate(val || "")}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ที่อยู่</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-medium mx-2">ที่อยู่วางบิล</h4>
            <div className="mt-4 flex flex-col gap-3">
              <FloatingLabelInput
                label="ที่อยู่ / เลขที่ / ถนน"
                type="text"
                value={billingStreet}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setBillingStreet(e.target.value)
                }
              />
              <ThaiAddressPicker
                value={billingThaiAddress}
                onChange={setBillingThaiAddress}
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium mx-2">ที่อยู่จัดส่ง</h4>
              <Button
                type="button"
                onClick={handleCopyAddress}
                size="sm"
                className="ml-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl"
              >
                <Copy className="h-4 w-4 mr-2" />
                คัดลอกที่อยู่วางบิล
              </Button>
            </div>
            <div className="mt-4 flex flex-col gap-3">
              <FloatingLabelInput
                label="ที่อยู่ / เลขที่ / ถนน"
                type="text"
                value={shippingStreet}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setShippingStreet(e.target.value)
                }
              />
              <ThaiAddressPicker
                value={shippingThaiAddress}
                onChange={setShippingThaiAddress}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>รายการสินค้า</span>
            <Button type="button" onClick={handleAddItem} size="sm" className="bg-green-700 hover:bg-green-800 text-white rounded-xl">
              <Plus className="h-4 w-2" />
              เพิ่มรายการ
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items.map((item, index) => {
              const product = products.find((p) => p.id === item.productId);
              return (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">รายการที่ {index + 1}</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Product Select */}
                    <div className="md:col-span-2">
                      <FloatingLabelInput
                        label="สินค้า"
                        type="select"
                        searchable
                        value={item.productId}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleUpdateItem(index, "productId", e.target.value)
                        }
                        options={products.map((product) => ({
                          value: product.id,
                          label: `${product.name} - ${product.productCode}`,
                        }))}
                      />
                    </div>

                    {/* Stock Quantity */}
                    {product && (
                      <div className="flex items-start justify-between">
                        <div className="mt-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedProductDetail(product)}
                          >
                            <Info className="h-4 w-4 mr-2" />
                            รายละเอียด
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <FloatingLabelInput
                      label="จำนวน"
                      type="number"
                      value={item.quantity}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleUpdateItem(
                          index,
                          "quantity",
                          Number(e.target.value)
                        )
                      }
                    />
                    <FloatingLabelInput
                      label="ราคาต่อหน่วย"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleUpdateItem(
                          index,
                          "unitPrice",
                          Number(e.target.value)
                        )
                      }
                    />
                    <FloatingLabelInput
                      label="รวม"
                      type="number"
                      value={item.quantity * item.unitPrice}
                      disabled
                      readOnly
                    />

                    {product && (
                      <div className="mx-4">
                        <label className="text-sm text-gray-500 block mb-1">
                          คงเหลือ
                        </label>
                        <Badge variant="outline">
                          {product.stockQuantity || 0} {product.unit || ""}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {item.priceModified && (
                    <Alert>
                      <AlertDescription className="text-sm">
                        ⚠️ ราคาถูกแก้ไขจากราคามาตรฐาน ฿
                        {item.originalPrice.toLocaleString()}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>ค่าใช้จ่ายและหมายเหตุ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FloatingLabelInput
              label="ค่าขนส่ง"
              type="number"
              value={shippingCost}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setShippingCost(Number(e.target.value))
              }
            />
            <FloatingLabelInput
              label="ค่าใช้จ่ายอื่นๆ"
              type="number"
              value={otherCosts}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setOtherCosts(Number(e.target.value))
              }
            />
          </div>

          <div className="mb-4">
            {otherCosts > 0 && (
              <FloatingLabelInput
                label="รายละเอียดค่าใช้จ่ายอื่นๆ"
                type="text"
                value={otherCostsDescription}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setOtherCostsDescription(e.target.value)
                }
              />
            )}
          </div>

          <Textarea
            label="หมายเหตุ"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>สรุปยอดรวม</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>รวมเป็นเงิน:</span>
            <span className="font-medium">
              ฿{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>ค่าขนส่ง:</span>
            <span>
              ฿
              {shippingCost.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span>ค่าใช้จ่ายอื่นๆ:</span>
            <span>
              ฿
              {otherCosts.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="border-t pt-2 flex justify-between text-xl font-bold">
            <span>ยอดเงินสุทธิ:</span>
            <span className="text-blue-600">
              ฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4 justify-center mt-8">
        <Button
          size="lg"
          className="w-36 bg-gray-500 hover:bg-gray-600 text-white rounded-3xl"
          type="button"
          onClick={onCancel ?? (() => router.back())}
          disabled={loading}
        >
          ยกเลิก
        </Button>

        <Button
          size="lg"
          className="w-36 bg-green-700 hover:bg-green-800 text-white rounded-3xl"
          type="submit"
          disabled={loading}
        >
          {loading ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>

      {/* Product Detail Modal */}
      <Dialog
        open={!!selectedProductDetail}
        onOpenChange={() => setSelectedProductDetail(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>รายละเอียดสินค้า</DialogTitle>
            <DialogDescription>
              {selectedProductDetail?.name} (
              {selectedProductDetail?.productCode})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Stock Quantity */}
            {/* <div className="border-b pb-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-lg">จำนวนคงเหลือ</h4>
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {selectedProductDetail?.stockQuantity || 0}{" "}
                  {selectedProductDetail?.unit || "หน่วย"}
                </Badge>
              </div>
            </div> */}

            {/* Free Items */}
            <div>
              <h4 className="font-medium text-lg mb-3">รายการของแถม</h4>
              {selectedProductDetail?.freeItems &&
              selectedProductDetail.freeItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedProductDetail.freeItems.map((item, i) => (
                    <div
                      key={item.id}
                      className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">
                            ซื้อ {item.purchaseQty} แถม {item.freeQty}
                          </span>
                          {item.netPrice && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              (ราคาสุทธิ: ฿{Number(item.netPrice).toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          หมายเหตุ: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                  ไม่มีรายการของแถม
                </p>
              )}
            </div>

            {/* Promotion Items */}
            <div>
              <h4 className="font-medium text-lg mb-3">
                รายการส่งเสริมการขาย
              </h4>
              {selectedProductDetail?.promotionItems &&
              selectedProductDetail.promotionItems.length > 0 ? (
                <div className="space-y-2">
                  {selectedProductDetail.promotionItems.map((item, i) => (
                    <div
                      key={item.id}
                      className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                            - คงเหลือ {item.quantity} ชิ้น
                          </span>
                          {item.price && (
                            <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                              (ราคา: ฿{Number(item.price).toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>
                      {item.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          หมายเหตุ: {item.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                  ไม่มีรายการส่งเสริมการขาย
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
