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
  products: Array<any>
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

  const paymentTerm = Math.random() > 0.5 ? "PREPAID" : "CREDIT_90";
  const saleDate = new Date().toISOString().split("T")[0];

  let creditDays: number | undefined = undefined;
  let creditDueDate: string | undefined = undefined;
  if (paymentTerm !== "PREPAID") {
    const days = [7, 15, 30, 45][Math.floor(Math.random() * 4)];
    creditDays = days;
    const due = new Date();
    due.setDate(due.getDate() + days);
    creditDueDate = due.toISOString().split("T")[0];
  }

  const payload: SaleFormData = {
    customerId: customer.id,
    employeeId: employee.id,
    paymentTerm: paymentTerm,
    creditDays,
    creditDueDate,
    usePromotionalCredit: false,
    saleDate,
    deliveryDate: saleDate,
    billingAddress: customer.billingAddress ?? "",
    shippingAddress: customer.shippingAddress ?? "",
    items,
    shippingCost: Number((Math.random() * 200).toFixed(2)),
    otherCosts: Number((Math.random() * 100).toFixed(2)),
    otherCostsDescription: RANDOM_OTHER_COSTS_DESCRIPTION,
    notes: RANDOM_NOTE,
  };

  return payload;
}

export default generateRandomSaleClient;
