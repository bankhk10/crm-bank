"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Copy, Info, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DatePicker from "@/components/custom/DatePicker";
import {
  FormInput,
  FormSelect,
  FormCombobox,
  FormTextarea,
} from "@/components/custom/form-components";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import type { SaleFormData, SaleItemFormData } from "@/types/sales";

interface Customer {
  id: string;
  name: string;
  customerCode: string;
  customerType: string;
  billingAddress?: string;
  shippingAddress?: string;
  shippingAddressLine?: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingSubdistrict?: string;
  shippingPostalCode?: string;
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

// Helper to parse Thai address from string
function parseAddress(address: string) {
  if (!address) return { street: "", thaiAddress: {} };

  let street = address;
  const thaiAddress: {
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
  } = {};

  // 1. Extract Postal Code (5 digits at end or alone)
  const postalMatch =
    street.match(/\s+(\d{5})\s*$/) || street.match(/(\d{5})\s*$/);
  if (postalMatch) {
    thaiAddress.postalCode = postalMatch[1];
    street = street.replace(postalMatch[0], "");
  }

  // 2. Province (Changwat)
  let provinceFound = false;
  const provinceMatch = street.match(/(?:จังหวัด|จ\.)\s*([^\s]+)/);
  if (provinceMatch) {
    thaiAddress.province = provinceMatch[1];
    street = street.replace(provinceMatch[0], "");
    provinceFound = true;
  }

  if (!provinceFound) {
    // Special case for Bangkok without prefix
    const bkkMatch = street.match(/\s+(กรุงเทพมหานคร|กรุงเทพฯ|กทม\.)/);
    if (bkkMatch) {
      thaiAddress.province = bkkMatch[1];
      street = street.replace(bkkMatch[0], "");
    }
  }

  // 3. District (Amphoe/Khet)
  const districtMatch = street.match(/(?:อำเภอ|อ\.|เขต)\s*([^\s]+)/);
  if (districtMatch) {
    thaiAddress.district = districtMatch[1];
    street = street.replace(districtMatch[0], "");
  }

  // 4. Subdistrict (Tambon/Khwaeng)
  const subdistrictMatch = street.match(/(?:ตำบล|ต\.|แขวง)\s*([^\s]+)/);
  if (subdistrictMatch) {
    thaiAddress.subdistrict = subdistrictMatch[1];
    street = street.replace(subdistrictMatch[0], "");
  }

  return { street: street.trim().replace(/,\s*$/, ""), thaiAddress };
}

export function SaleForm({
  initialData,
  onSubmit,
  isEdit = false,
  onCancel,
}: SaleFormProps) {
  const labelTextClass = "text-base font-medium mx-2";
  const inputTextClass = "mt-1 h-11 text-base placeholder:text-gray-500";

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
  const [requestedDeliveryDate, setRequestedDeliveryDate] = useState(
    (initialData as any)?.requestedDeliveryDate || ""
  );
  const [deliveryDate, setDeliveryDate] = useState(
    initialData?.deliveryDate || ""
  );
  // Initialize state with parsed address
  const [parsedBilling] = useState(() =>
    parseAddress(initialData?.billingAddress || "")
  );

  const [billingAddress, setBillingAddress] = useState(
    initialData?.billingAddress || ""
  );
  const [billingStreet, setBillingStreet] = useState(parsedBilling.street);
  const [billingThaiAddress, setBillingThaiAddress] = useState(
    parsedBilling.thaiAddress
  );
  const [shippingAddress, setShippingAddress] = useState(
    initialData?.shippingAddress || ""
  );
  const [useCustomShippingAddress, setUseCustomShippingAddress] =
    useState(false);
  const [customShippingAddress, setCustomShippingAddress] = useState("");
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
      fetch("/api/customers?type=DEALER").then((r) => r.json()),
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

      // Determine if we should update address from customer default
      // We update if NOT in edit mode, OR if user changed the customer from the initial one
      const isInitialCustomer = initialData?.customerId === customerId;
      const shouldUpdateAddress = customer && (!isEdit || !isInitialCustomer);

      if (shouldUpdateAddress) {
        setBillingAddress(customer.billingAddress || "");

        const parsedBill = parseAddress(customer.billingAddress || "");
        setBillingStreet(parsedBill.street);
        setBillingThaiAddress(parsedBill.thaiAddress);

        // Build shipping address from structured fields
        const shippingParts = [
          customer.shippingAddressLine,
          customer.shippingSubdistrict
            ? `ตำบล${customer.shippingSubdistrict}`
            : "",
          customer.shippingDistrict ? `อำเภอ${customer.shippingDistrict}` : "",
          customer.shippingProvince
            ? `จังหวัด${customer.shippingProvince}`
            : "",
          customer.shippingPostalCode || "",
        ].filter(Boolean);
        setShippingAddress(shippingParts.join(" "));
      }
    }
  }, [customerId, customers, isEdit, initialData?.customerId]);

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
      if (item.quantity < 0) {
        newErrors.push(`รายการที่ ${index + 1}: จำนวนต้องไม่ติดลบ`);
      }
      if (item.unitPrice < 0) {
        newErrors.push(`รายการที่ ${index + 1}: ราคาต้องไม่ติดลบ`);
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
        requestedDeliveryDate: requestedDeliveryDate || undefined,
        deliveryDate: deliveryDate || undefined,
        billingAddress,
        shippingAddress: useCustomShippingAddress
          ? customShippingAddress
          : shippingAddress,
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
    <form onSubmit={handleSubmit} className="space-y-6">
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

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ข้อมูลลูกค้าและพนักงาน
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
        <FormCombobox
          label="ลูกค้า *"
          value={customerId}
          onChange={(val) => setCustomerId(val)}
          options={customers.map((customer) => ({
            value: customer.id,
            label: `${customer.name} (${customer.customerCode})`,
          }))}
          placeholder="เลือกลูกค้า"
          searchPlaceholder="ค้นหาลูกค้า..."
          emptyText="ไม่พบลูกค้า"
        />

        <FormCombobox
          label="พนักงานขาย *"
          value={employeeId}
          onChange={(val) => setEmployeeId(val)}
          options={employees.map((employee) => ({
            value: employee.id,
            label: employee.name,
          }))}
          placeholder="เลือกพนักงานขาย"
          searchPlaceholder="ค้นหาพนักงานขาย..."
          emptyText="ไม่พบพนักงานขาย"
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
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
                <FormInput
                  label="วงเงินเครดิตคงเหลือ"
                  type="number"
                  value={String(availableAmount)}
                  onChange={() => {}}
                  disabled
                  readOnly
                />

                <FormInput
                  label="วงเงินส่งเสริมการขายคงเหลือ"
                  type="number"
                  value={String(promoAmount)}
                  onChange={() => {}}
                  disabled
                  readOnly
                />
              </div>
            </>
          );
        })()}

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        เงื่อนไขการชำระเงินและวันที่
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-3 mt-6">
        <FormSelect
          label="เงื่อนไขการชำระเงิน *"
          value={paymentTerm}
          onChange={(val: any) => setPaymentTerm(val)}
          options={[
            { value: "PREPAID", label: "โอนเงินก่อน" },
            { value: "CREDIT", label: "ส่งของก่อน" },
          ]}
          placeholder="เลือกเงื่อนไข"
          groupLabel="เงื่อนไข"
        />
        <div>
          <DatePicker
            label="วันที่ต้องการของ"
            value={requestedDeliveryDate}
            onChange={(val) => setRequestedDeliveryDate(val || "")}
            placeholder=""
          />
        </div>
        <div>
          <DatePicker
            label="วันที่ขาย *"
            value={saleDate}
            onChange={(val) => setSaleDate(val || "")}
            placeholder=""
          />
        </div>
      </div>

      {paymentTerm === "CREDIT" && (
        <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
          <FormInput
            label="เครดิต (วัน)"
            type="number"
            value={String(creditDays)}
            onChange={(e) => setCreditDays(Number(e.target.value))}
            onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
          />
          <div>
            <DatePicker
              label="ครบกำหนดชำระ"
              value={creditDueDate}
              onChange={(val) => setCreditDueDate(val || "")}
              placeholder=""
            />
          </div>
        </div>
      )}

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ที่อยู่จัดส่ง
      </h3>

      {/* Shipping Address Display */}
      <div className="mt-6">
        {selectedCustomer ? (
          <>
            {!useCustomShippingAddress && (
              <>
                {selectedCustomer.shippingAddressLine ||
                selectedCustomer.shippingProvince ||
                selectedCustomer.shippingDistrict ||
                selectedCustomer.shippingSubdistrict ||
                selectedCustomer.shippingPostalCode ? (
                  <>
                    {/* Address Components Grid */}
                    <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <FormInput
                          label="ที่อยู่จัดส่ง (บ้านเลขที่ หมู่ ซอย ถนน)"
                          value={selectedCustomer.shippingAddressLine || ""}
                          onChange={() => {}}
                          disabled
                          readOnly
                        />
                      </div>

                      <FormInput
                        label={
                          selectedCustomer.shippingProvince === "กรุงเทพมหานคร"
                            ? "แขวง"
                            : "ตำบล"
                        }
                        value={
                          selectedCustomer.shippingSubdistrict
                            ?.replace(/^แขวง/, "")
                            ?.replace(/^ตำบล/, "")
                            ?.trim() || ""
                        }
                        onChange={() => {}}
                        disabled
                        readOnly
                      />

                      <FormInput
                        label={
                          selectedCustomer.shippingProvince === "กรุงเทพมหานคร"
                            ? "เขต"
                            : "อำเภอ"
                        }
                        value={
                          selectedCustomer.shippingDistrict
                            ?.replace(/^เขต/, "")
                            ?.replace(/^อำเภอ/, "")
                            ?.trim() || ""
                        }
                        onChange={() => {}}
                        disabled
                        readOnly
                      />

                      <FormInput
                        label="จังหวัด"
                        value={
                          selectedCustomer.shippingProvince
                            ?.replace(/^จังหวัด/, "")
                            ?.trim() || ""
                        }
                        onChange={() => {}}
                        disabled
                        readOnly
                      />

                      <FormInput
                        label="รหัสไปรษณีย์"
                        value={selectedCustomer.shippingPostalCode || ""}
                        onChange={() => {}}
                        disabled
                        readOnly
                      />
                    </div>
                  </>
                ) : (
                  <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
                      <MapPin className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-base font-medium text-gray-600">
                      ไม่พบข้อมูลที่อยู่จัดส่ง
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                      ลูกค้ารายนี้ยังไม่มีข้อมูลที่อยู่จัดส่งในระบบ
                    </p>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-200">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-base font-medium text-gray-600">
              กรุณาเลือกลูกค้า
            </p>
            <p className="mt-2 text-sm text-gray-500">
              เลือกลูกค้าเพื่อแสดงข้อมูลที่อยู่จัดส่ง
            </p>
          </div>
        )}

        {/* Custom Shipping Address Option */}
        {selectedCustomer && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="customShippingAddress"
                checked={useCustomShippingAddress}
                onCheckedChange={(checked) =>
                  setUseCustomShippingAddress(checked as boolean)
                }
              />
              <label
                htmlFor="customShippingAddress"
                className="text-base font-medium cursor-pointer"
              >
                ระบุที่อยู่จัดส่งสำหรับรายการขายนี้เท่านั้น
              </label>
            </div>

            {useCustomShippingAddress && (
              <FormTextarea
                label="ที่อยู่จัดส่งสำหรับรายการนี้"
                value={customShippingAddress}
                onChange={(e) => setCustomShippingAddress(e.target.value)}
                rows={4}
                placeholder="กรอกที่อยู่จัดส่งสำหรับรายการขายนี้..."
              />
            )}
          </div>
        )}
      </div>

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6 flex items-center justify-between">
        <span>รายการสินค้า</span>
        <Button
          type="button"
          onClick={handleAddItem}
          className="bg-green-700 hover:bg-green-800 text-white rounded-xl"
        >
          <Plus className="h-4 w-4" />
          เพิ่มรายการ
        </Button>
      </h3>

      <div className="space-y-4 mt-6">
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

              <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
                {/* Product Select */}
                <div className="md:col-span-2">
                  <FormCombobox
                    label="สินค้า"
                    value={item.productId}
                    onChange={(val) =>
                      handleUpdateItem(index, "productId", val)
                    }
                    options={products.map((product) => ({
                      value: product.id,
                      label: `${product.name} - ${product.productCode}`,
                    }))}
                    placeholder="เลือกสินค้า"
                    searchPlaceholder="ค้นหาสินค้า..."
                    emptyText="ไม่พบสินค้า"
                  />
                </div>

                {/* Stock Quantity */}
                {product && (
                  <div className="flex items-end justify-between mb-2">
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
                )}
              </div>

              <div className="grid gap-x-4 gap-y-3 md:grid-cols-4">
                <FormInput
                  label="จำนวน"
                  type="number"
                  value={String(item.quantity)}
                  onChange={(e) =>
                    handleUpdateItem(index, "quantity", Number(e.target.value))
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <FormInput
                  label="ราคาต่อหน่วย"
                  type="number"
                  value={String(item.unitPrice)}
                  onChange={(e) =>
                    handleUpdateItem(index, "unitPrice", Number(e.target.value))
                  }
                  onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
                />
                <FormInput
                  label="รวม"
                  type="number"
                  value={String(item.quantity * item.unitPrice)}
                  onChange={() => {}}
                  disabled
                  readOnly
                />

                {product && (
                  <div className="mx-4 mt-4">
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
                <Alert className="bg-yellow-100 border-yellow-300">
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

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        ค่าใช้จ่ายและหมายเหตุ
      </h3>

      <div className="grid gap-x-4 gap-y-3 md:grid-cols-2 mt-6">
        <FormInput
          label="ค่าขนส่ง"
          type="number"
          value={String(shippingCost)}
          onChange={(e) => setShippingCost(Number(e.target.value))}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
        <FormInput
          label="ค่าใช้จ่ายอื่นๆ"
          type="number"
          value={String(otherCosts)}
          onChange={(e) => setOtherCosts(Number(e.target.value))}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
      </div>

      {otherCosts > 0 && (
        <FormInput
          label="รายละเอียดค่าใช้จ่ายอื่นๆ"
          value={otherCostsDescription}
          onChange={(e) => setOtherCostsDescription(e.target.value)}
        />
      )}

      <FormTextarea
        label="หมายเหตุ"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
      />

      <h3 className="text-xl font-semibold text-gray-800 bg-gray-300 my-2 p-4 rounded-3xl mt-6">
        สรุปยอดรวม
      </h3>

      <div className="space-y-2 mt-6">
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
            ฿{otherCosts.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="border-t pt-2 flex justify-between text-xl font-bold">
          <span>ยอดเงินสุทธิ:</span>
          <span className="text-blue-600">
            ฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="md:col-span-2 pt-6 border-t my-2">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
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
      </div>

      {/* Product Detail Modal */}
      <Dialog
        open={!!selectedProductDetail}
        onOpenChange={() => setSelectedProductDetail(null)}
      >
        <DialogContent className="flex max-h-[min(600px,80vh)] flex-col gap-0 p-0 sm:max-w-2xl">
          <DialogHeader className="contents space-y-0 text-left">
            <ScrollArea className="flex max-h-full flex-col overflow-hidden">
              <DialogTitle className="px-6 pt-6 text-xl font-semibold">
                รายละเอียดสินค้า
              </DialogTitle>
              <DialogDescription asChild>
                <div className="p-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    {selectedProductDetail?.name} (
                    {selectedProductDetail?.productCode})
                  </p>
                  <div className="space-y-6">
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
                                      (ราคาสุทธิ: ฿
                                      {Number(item.netPrice).toLocaleString()})
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
                          {selectedProductDetail.promotionItems.map(
                            (item, i) => (
                              <div
                                key={item.id}
                                className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-medium">
                                      {item.name}
                                    </span>
                                    <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                      - คงเหลือ {item.quantity} ชิ้น
                                    </span>
                                    {item.price && (
                                      <span className="text-sm text-gray-600 dark:text-gray-400 ml-2">
                                        (ราคา: ฿
                                        {Number(item.price).toLocaleString()})
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
                            )
                          )}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm bg-gray-50 dark:bg-gray-900/20 p-3 rounded-lg">
                          ไม่มีรายการส่งเสริมการขาย
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </DialogDescription>
            </ScrollArea>
          </DialogHeader>
          <DialogFooter
            sticky
            className="flex-row items-center justify-end px-6 py-4"
          >
            <DialogClose asChild>
              <Button variant="outline">ปิด</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
