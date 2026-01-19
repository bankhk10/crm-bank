import type { SaleFormData, SaleItemFormData } from "@/types/sales";
import {
  RANDOM_OTHER_COSTS_DESCRIPTION,
  RANDOM_NOTE,
} from "@/lib/random-fill/constants";

function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randNumber(min = 1, max = 10) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRandomSaleClient(
  customers: Array<any>,
  employees: Array<any>,
  products: Array<any>,
): SaleFormData {
  const customer = rand(customers);
  const employee = rand(employees);

  const itemCount = Math.floor(Math.random() * 3) + 1;
  const items: SaleItemFormData[] = [];
  for (let i = 0; i < itemCount; i++) {
    const p = rand(products);
    const qty = Math.floor(Math.random() * 5) + 1;
    const price =
      (p as any).price ?? Number((Math.random() * 1000 + 50).toFixed(2));
    items.push({
      productId: (p as any).id,
      quantity: qty,
      unitPrice: price,
      originalPrice: price,
      priceModified: false,
    });
  }

  const paymentTerms = ["CREDIT_90", "CASH_7", "PREPAID"];
  const paymentTerm = rand(paymentTerms);
  const saleDate = new Date().toISOString().split("T")[0];

  let creditDays: number | undefined = undefined;
  let creditDueDate: string | undefined = undefined;

  if (paymentTerm === "CREDIT_90") {
    creditDays = 90;
  } else if (paymentTerm === "CASH_7") {
    creditDays = 7;
  } else if (paymentTerm === "PREPAID") {
    creditDays = 0;
  }

  if (creditDays !== undefined && creditDays > 0) {
    const due = new Date(saleDate);
    due.setDate(due.getDate() + creditDays);
    creditDueDate = due.toISOString().split("T")[0];
  }

  // Create requested delivery date (random 1-7 days from sale date)
  const reqDate = new Date(saleDate);
  reqDate.setDate(reqDate.getDate() + Math.floor(Math.random() * 7) + 1);
  const requestedDeliveryDate = reqDate.toISOString().split("T")[0];

  const payload: SaleFormData = {
    customerId: customer.id,
    employeeId: employee.id,
    paymentTerm: paymentTerm as any,
    creditDays,
    creditDueDate,
    usePromotionalCredit: false,
    promotionalCreditUsed: 0,
    saleDate,
    requestedDeliveryDate,
    deliveryDate: "",
    deliveryMethod: "SALES_DELIVERY",
    pickupCompanyId: "",
    billingAddress: customer.billingAddress ?? "",
    shippingAddress: customer.shippingAddress ?? "",
    items,
    shippingCost: 0,
    otherCosts: 0,
    otherCostsDescription: "",
    notes: "",
  };

  return payload;
}

export default generateRandomSaleClient;
