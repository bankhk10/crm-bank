"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Info, MapPin, Save, X } from "lucide-react";
import { Label } from "@/components/ui/label";
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
import RandomFillButton from "@/components/custom/random-fill-button";
import generateRandomSaleClient from "@/lib/random-fill/sale-client";
import { useCurrentUser } from "@/hooks/use-current-user";

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

interface Company {
  id: string;
  name: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
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
  const [companies, setCompanies] = useState<Company[]>([]);

  // Form state
  const [customerId, setCustomerId] = useState(initialData?.customerId || "");
  const [employeeId, setEmployeeId] = useState(initialData?.employeeId || "");
  const [pickupCompanyId, setPickupCompanyId] = useState(
    (initialData as any)?.pickupCompanyId || ""
  );
  const [paymentTerm, setPaymentTerm] = useState<
    "CREDIT_90" | "CASH_7" | "PREPAID" | "CREDIT_OVER_90"
  >(initialData?.paymentTerm || "CREDIT_90");
  const [creditDays, setCreditDays] = useState(initialData?.creditDays || 90);
  const [creditDueDate, setCreditDueDate] = useState(
    initialData?.creditDueDate || ""
  );

  const [saleDate, setSaleDate] = useState(
    initialData?.saleDate || new Date().toISOString().split("T")[0]
  );

  // Automatically calculate creditDueDate when saleDate or creditDays changes
  useEffect(() => {
    if (saleDate && creditDays > 0) {
      const date = new Date(saleDate);
      date.setDate(date.getDate() + creditDays);
      setCreditDueDate(date.toISOString().split("T")[0]);
    } else {
      setCreditDueDate("");
    }
  }, [saleDate, creditDays]);

  const [usePromotionalCredit, setUsePromotionalCredit] = useState(
    initialData?.usePromotionalCredit || false
  );
  const [promotionalCreditUsed, setPromotionalCreditUsed] = useState(
    initialData?.promotionalCreditUsed || 0
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
  const [customShippingAddress, setCustomShippingAddress] = useState(
    (initialData as any)?.deliveryMethod === "COURIER"
      ? initialData?.shippingAddress || ""
      : ""
  );
  const [deliveryMethod, setDeliveryMethod] = useState(
    (initialData as any)?.deliveryMethod || "SALES_DELIVERY"
  );
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

  // Get current user for admin check
  const currentUser = useCurrentUser();
  const isAdmin =
    currentUser?.roles?.includes("admin") ||
    currentUser?.roles?.includes("administrator") ||
    false;
  const isManager = currentUser?.roles?.includes("sales_manager") || false;
  const canSelectOtherEmployees = isAdmin || isManager;

  // Product detail modal
  const [selectedProductDetail, setSelectedProductDetail] =
    useState<Product | null>(null);

  // Load customers, employees, products, companies
  useEffect(() => {
    Promise.all([
      fetch("/api/customers?type=DEALER").then((r) => r.json()),
      fetch("/api/employee").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
      fetch("/api/companies?perPage=100&status=ACTIVE").then((r) => r.json()),
    ])
      .then(([customersData, employeesData, productsData, companiesData]) => {
        setCustomers(customersData.customers || []);
        setEmployees(employeesData.employees || []);
        setProducts(productsData.products || []);
        setCompanies(companiesData.companies || []);
      })
      .catch((err) => console.error("Error loading data:", err));
  }, []);

  // Auto-fill employeeId for sales_employee users
  useEffect(() => {
    if (
      !isEdit &&
      !employeeId &&
      currentUser?.roles?.includes("sales_employee") &&
      currentUser?.employeeId
    ) {
      setEmployeeId(currentUser.employeeId);
    }
  }, [currentUser, isEdit, employeeId]);

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

  // Handle Pickup Company Selection -> Update Shipping Address
  useEffect(() => {
    if (deliveryMethod === "CUSTOMER_PICKUP") {
      if (pickupCompanyId) {
        const company = companies.find((c) => c.id === pickupCompanyId);
        if (company) {
          const parts = [
            company.addressLine,
            company.subdistrict ? `ตำบล${company.subdistrict}` : "",
            company.district ? `อำเภอ${company.district}` : "",
            company.province ? `จังหวัด${company.province}` : "",
            company.postalCode,
          ].filter(Boolean);
          const fullAddress = parts.join(" ");
          setShippingAddress(fullAddress);
          setCustomShippingAddress(fullAddress); // Also set custom so it sticks if we use that logic
          setUseCustomShippingAddress(true); // Force custom usage for pickup
        }
      } else {
        // Clear address if no company selected yet
        setShippingAddress("");
        setCustomShippingAddress("");
        setUseCustomShippingAddress(true);
      }
    } else if (deliveryMethod === "COURIER") {
      // Allow manual input for courier
      setUseCustomShippingAddress(true);
      // Clear address if switching from Pickup (indicated by pickupCompanyId)
      if (pickupCompanyId) {
        setCustomShippingAddress("");
        setShippingAddress("");
        setPickupCompanyId("");
      }
    } else if (deliveryMethod === "SALES_DELIVERY" && selectedCustomer) {
      // Revert to customer logic if switching back
      setUseCustomShippingAddress(false);
      const shippingParts = [
        selectedCustomer.shippingAddressLine,
        selectedCustomer.shippingSubdistrict
          ? `ตำบล${selectedCustomer.shippingSubdistrict}`
          : "",
        selectedCustomer.shippingDistrict
          ? `อำเภอ${selectedCustomer.shippingDistrict}`
          : "",
        selectedCustomer.shippingProvince
          ? `จังหวัด${selectedCustomer.shippingProvince}`
          : "",
        selectedCustomer.shippingPostalCode || "",
      ].filter(Boolean);
      setShippingAddress(shippingParts.join(" "));

      // Clear pickup company if switching away from pickup
      setPickupCompanyId("");
    }
  }, [
    pickupCompanyId,
    deliveryMethod,
    companies,
    selectedCustomer,
    // customShippingAddress, // We shouldn't depend on this to avoid loops, only init logic relies on it check?
    // Actually we only check !customShippingAddress inside, so it's safer to exclude or handle carefully.
    // Excluding it is safe because we only want to run this when deliveryMethod changes.
  ]);

  // Calculate totals
  const subtotal = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );
  const total = subtotal - shippingCost - otherCosts;

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
    if (deliveryMethod === "CUSTOMER_PICKUP" && !pickupCompanyId) {
      newErrors.push("กรุณาเลือกสถานที่รับสินค้า");
    }
    if (deliveryMethod === "COURIER" && !customShippingAddress) {
      newErrors.push("กรุณาระบุที่อยู่สำหรับส่งให้บริษัทขนส่ง");
    }

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

    // Check credit limit for credit-based payment terms
    const isCreditPayment =
      paymentTerm === "CREDIT_90" ||
      paymentTerm === "CASH_7" ||
      paymentTerm === "CREDIT_OVER_90";
    if (isCreditPayment && selectedCustomer) {
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
    if (isCreditPayment) {
      if (!creditDays || creditDays <= 0) {
        newErrors.push("กรุณาระบุจำนวนวันเครดิต");
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
        creditDays: isCreditPayment ? creditDays : undefined,
        creditDueDate: isCreditPayment ? creditDueDate : undefined,
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
        deliveryMethod,
        pickupCompanyId:
          deliveryMethod === "CUSTOMER_PICKUP" ? pickupCompanyId : undefined,
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

  const handleRandomFill = () => {
    if (!customers.length || !employees.length || !products.length) return;
    const randomData = generateRandomSaleClient(customers, employees, products);

    setCustomerId(randomData.customerId);
    setEmployeeId(randomData.employeeId);
    setPaymentTerm(randomData.paymentTerm as any);
    if (randomData.creditDays) setCreditDays(randomData.creditDays);
    if (randomData.creditDueDate) setCreditDueDate(randomData.creditDueDate);

    setUsePromotionalCredit(randomData.usePromotionalCredit || false);
    setPromotionalCreditUsed(randomData.promotionalCreditUsed || 0);

    setSaleDate(randomData.saleDate);
    if (randomData.deliveryDate) setDeliveryDate(randomData.deliveryDate);
    if (randomData.requestedDeliveryDate)
      setRequestedDeliveryDate(randomData.requestedDeliveryDate);

    setItems(randomData.items);
    setShippingCost(randomData.shippingCost || 0);
    setOtherCosts(randomData.otherCosts || 0);
    setOtherCostsDescription(randomData.otherCostsDescription || "");
    setNotes(randomData.notes || "");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-[2000px] mx-auto space-y-4 sm:space-y-6 lg:space-y-8"
    >
      {errors.length > 0 && (
        <Alert variant="destructive" className="border-2">
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {errors.map((error, i) => (
                <li key={i} className="text-sm sm:text-base">
                  {error}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert className="border-2 border-yellow-400 bg-yellow-50">
          <AlertDescription>
            <ul className="list-disc pl-4 space-y-1">
              {warnings.map((warning, i) => (
                <li key={i} className="text-sm sm:text-base text-yellow-800">
                  {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white bg-gradient-to-r from-blue-600 to-blue-500 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-md mb-4 sm:mb-6">
        ข้อมูลลูกค้าและพนักงาน
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
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
          disabled={!canSelectOtherEmployees}
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
              <div className="grid gap-x-4 gap-y-3 md:grid-cols-1">
                <FormInput
                  label="วงเงินเครดิตคงเหลือ"
                  type="number"
                  value={String(availableAmount)}
                  onChange={() => {}}
                  disabled
                  readOnly
                />
              </div>
            </>
          );
        })()}

      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white bg-gradient-to-r from-purple-600 to-purple-500 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-md mb-4 sm:mb-6">
        เงื่อนไขการชำระเงิน
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        <FormSelect
          label="เงื่อนไขการชำระเงิน *"
          value={paymentTerm}
          onChange={(val: any) => {
            setPaymentTerm(val);
            // Auto-set credit days based on payment term
            if (val === "CREDIT_90") {
              setCreditDays(90);
            } else if (val === "CASH_7") {
              setCreditDays(7);
            } else if (val === "PREPAID") {
              setCreditDays(0);
            } else if (val === "CREDIT_OVER_90") {
              setCreditDays(91);
            }
          }}
          options={[
            { value: "CREDIT_90", label: "ส่งสินค้าก่อน (เครดิต 90 วัน)" },
            { value: "CASH_7", label: "ชำระเงินสด (เครดิต 7 วัน)" },
            {
              value: "PREPAID",
              label: "ชำระเงินก่อนส่งสินค้า (โอนเงินก่อนส่งสินค้า)",
            },
            ...(isAdmin
              ? [
                  {
                    value: "CREDIT_OVER_90",
                    label: "ส่งสินค้าก่อน (เครดิตมากกว่า 90 วัน)",
                  },
                ]
              : []),
          ]}
          placeholder="เลือกเงื่อนไข"
          groupLabel="เงื่อนไข"
        />
        {deliveryMethod !== "CUSTOMER_PICKUP" &&
          deliveryMethod !== "COURIER" && (
            <div>
              <DatePicker
                label="วันที่ต้องการของ"
                value={requestedDeliveryDate}
                onChange={(val) => setRequestedDeliveryDate(val || "")}
                placeholder=""
              />
            </div>
          )}
        <div>
          <DatePicker
            label="วันที่ขาย *"
            value={saleDate}
            onChange={(val) => setSaleDate(val || "")}
            placeholder=""
            disabled={!isAdmin}
          />
        </div>
      </div>

      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white bg-gradient-to-r from-green-600 to-green-500 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-md mb-4 sm:mb-6">
        การจัดส่งและที่อยู่
      </h3>

      {/* Delivery Method Selection */}
      <div className="mt-6">
        <Label className="text-base font-semibold mx-2 mb-4 block">
          วิธีการจัดส่ง *
        </Label>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* พนักงานขายจัดส่ง */}
          <div
            onClick={() => setDeliveryMethod("SALES_DELIVERY")}
            className={`group relative cursor-pointer rounded-2xl border-2 p-5 transition-all
        ${
          deliveryMethod === "SALES_DELIVERY"
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
        }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="radio"
                name="deliveryMethod"
                value="SALES_DELIVERY"
                checked={deliveryMethod === "SALES_DELIVERY"}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="h-4 w-4 text-blue-600"
              />

              <div className="flex items-center gap-3">
                <span className="text-2xl">🚚</span>
                <span className="text-base font-medium text-gray-900">
                  พนักงานขายจัดส่งสินค้า
                </span>
              </div>
            </div>
          </div>

          {/* ลูกค้ามารับเอง */}
          <div
            onClick={() => setDeliveryMethod("CUSTOMER_PICKUP")}
            className={`group relative cursor-pointer rounded-2xl border-2 p-5 transition-all
        ${
          deliveryMethod === "CUSTOMER_PICKUP"
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
        }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="radio"
                name="deliveryMethod"
                value="CUSTOMER_PICKUP"
                checked={deliveryMethod === "CUSTOMER_PICKUP"}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="h-4 w-4 text-blue-600"
              />

              <div className="flex items-center gap-3">
                <span className="text-2xl">🏬</span>
                <span className="text-base font-medium text-gray-900">
                  ลูกค้ามารับสินค้าเอง
                </span>
              </div>
            </div>
          </div>

          {/* บริษัทขนส่ง */}
          <div
            onClick={() => setDeliveryMethod("COURIER")}
            className={`group relative cursor-pointer rounded-2xl border-2 p-5 transition-all
        ${
          deliveryMethod === "COURIER"
            ? "border-blue-500 bg-blue-50 shadow-md"
            : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
        }`}
          >
            <div className="flex items-center gap-4">
              <input
                type="radio"
                name="deliveryMethod"
                value="COURIER"
                checked={deliveryMethod === "COURIER"}
                onChange={(e) => setDeliveryMethod(e.target.value)}
                className="h-4 w-4 text-blue-600"
              />

              <div className="flex items-center gap-3">
                <span className="text-2xl">📦</span>
                <span className="text-base font-medium text-gray-900">
                  ส่งผ่านบริษัทขนส่ง
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Shipping Address Display */}
      <div className="mt-6">
        {deliveryMethod === "CUSTOMER_PICKUP" ? (
          <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900">
              รายละเอียดการรับสินค้า
            </h4>
            <div className="grid gap-x-4 gap-y-3 md:grid-cols-2">
              <DatePicker
                label="วันที่มารับสินค้า *"
                value={requestedDeliveryDate}
                onChange={(val) => setRequestedDeliveryDate(val || "")}
                placeholder="เลือกวันที่มารับสินค้า"
              />

              <FormCombobox
                label="สถานที่รับสินค้า (บริษัท/สาขา) *"
                value={pickupCompanyId}
                onChange={(val) => setPickupCompanyId(val)}
                options={companies.map((c) => ({
                  value: c.id,
                  label: c.name,
                }))}
                placeholder="เลือกสถานที่รับสินค้า"
                searchPlaceholder="ค้นหาสถานที่..."
                emptyText="ไม่พบสถานที่"
              />

              <div className="md:col-span-2">
                <Label className="text-base font-medium mx-2 mb-2 block">
                  ที่อยู่สถานที่รับสินค้า
                </Label>
                <div className="p-3 bg-white border rounded-md min-h-[60px] text-gray-700">
                  {shippingAddress || "-"}
                </div>
              </div>
            </div>
          </div>
        ) : deliveryMethod === "COURIER" ? (
          <div className="space-y-4 border rounded-xl p-4 bg-gray-50">
            <h4 className="font-medium text-gray-900">
              รายละเอียดการจัดส่งผ่านบริษัทขนส่ง
            </h4>

            <div className="grid gap-x-4 gap-y-3 md:grid-cols-1">
              <div className="space-y-1">
                <DatePicker
                  label="วันที่ต้องการให้ส่งของ"
                  value={requestedDeliveryDate}
                  onChange={(val) => setRequestedDeliveryDate(val || "")}
                  placeholder="เลือกวันที่ต้องการส่งของ"
                />

                {/* หมายเหตุ */}
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-2 py-1">
                  ⏰ หมายเหตุ สร้างรายการหลัง 12:00 น. → จัดส่งวันถัดไป
                </p>
              </div>

              <FormTextarea
                label="ที่อยู่สำหรับส่งให้บริษัทขนส่ง *"
                value={customShippingAddress}
                onChange={(e) => {
                  setCustomShippingAddress(e.target.value);
                  setShippingAddress(e.target.value);
                }}
                placeholder="ระบุรายละเอียดที่อยู่..."
                rows={4}
              />
            </div>
          </div>
        ) : selectedCustomer ? (
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
        {selectedCustomer &&
          deliveryMethod !== "CUSTOMER_PICKUP" &&
          deliveryMethod !== "COURIER" && (
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 bg-gradient-to-r from-orange-600 to-orange-500 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-md">
        <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
          รายการสินค้า
        </h3>
        <Button
          type="button"
          onClick={handleAddItem}
          className="bg-white hover:bg-gray-100 text-orange-600 font-semibold rounded-xl sm:rounded-lg px-4 sm:px-6 py-2 sm:py-2.5 h-auto text-base sm:text-sm shadow-md hover:shadow-lg transition-all duration-200 w-full sm:w-auto"
        >
          <Plus className="h-5 w-5 sm:h-4 sm:w-4 mr-2" />
          เพิ่มรายการ
        </Button>
      </div>

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
                <div className="md:col-span-2 min-w-0">
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

      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white bg-gradient-to-r from-pink-600 to-pink-500 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-md mb-4 sm:mb-6">
        ส่วนลดและหมายเหตุ
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 lg:gap-6">
        <FormInput
          label="ส่วนลดค่าขนส่ง"
          type="number"
          value={String(shippingCost)}
          onChange={(e) => setShippingCost(Number(e.target.value))}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
        <FormInput
          label="ส่วนลดหน้าบิล"
          type="number"
          value={String(otherCosts)}
          onChange={(e) => setOtherCosts(Number(e.target.value))}
          onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        />
      </div>

      {otherCosts > 0 && (
        <FormInput
          label="รายละเอียดส่วนลดหน้าบิล"
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

      <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl shadow-md mb-4 sm:mb-6">
        สรุปยอดรวม
      </h3>

      <div className="space-y-2 mt-6">
        <div className="flex justify-between">
          <span>รวมเป็นเงิน:</span>
          <span className="font-medium">
            ฿{subtotal.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        </div>
        {shippingCost > 0 && (
          <div className="flex justify-between text-red-600">
            <span>ส่วนลดค่าขนส่ง:</span>
            <span>
              -฿
              {shippingCost.toLocaleString("th-TH", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        )}
        {otherCosts > 0 && (
          <div className="flex justify-between text-red-600">
            <span>ส่วนลดหน้าบิล:</span>
            <span>
              -฿
              {otherCosts.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="border-t pt-2 flex justify-between text-xl font-bold">
          <span>ยอดเงินสุทธิ:</span>
          <span className="text-blue-600">
            ฿{total.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="pt-6 sm:pt-8 border-t mt-6 sm:mt-8 flex justify-center">
        <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-row gap-3 w-full sm:w-auto">
            <Button
              size="lg"
              className="flex-1 sm:flex-none sm:w-32 bg-gray-500 hover:bg-gray-600 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
              type="button"
              onClick={onCancel ?? (() => router.back())}
              disabled={loading}
            >
              <X className="h-4 w-4" />
              ยกเลิก
            </Button>
            <Button
              size="lg"
              className="flex-1 sm:flex-none sm:w-32 bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md hover:shadow-lg transition-all rounded-xl"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                "กำลังบันทึก..."
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  บันทึก
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-full sm:w-auto">
        <RandomFillButton
          size="lg"
          className="w-full sm:w-auto bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 border-0 transition-colors"
          onClick={handleRandomFill}
          disabled={loading}
          variant="secondary"
        >
          <span className="mr-2">🎲</span> กรอกข้อมูลแบบสุ่ม
        </RandomFillButton>
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
