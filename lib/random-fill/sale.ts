import { db } from "@/src/infrastructure/database";
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

export async function generateRandomSaleFromDb(): Promise<SaleFormData> {
  // Try to pick some existing records from the database to create realistic payload
  const customers = await db.customer.findMany({
    take: 30,
    select: { id: true, billingAddressLine: true, shippingAddressLine: true },
  });
  const employees = await db.employee.findMany({
    take: 30,
    select: { id: true },
  });
  const products = await db.product.findMany({
    where: { status: "ACTIVE" },
    take: 100,
    select: { id: true, price: true },
  });

  if (!customers.length || !employees.length || !products.length) {
    throw new Error("Not enough data in database to generate sale");
  }

  const customer = rand(customers);
  const employee = rand(employees);

  const itemCount = randNumber(1, 3);
  const items: SaleItemFormData[] = [];
  for (let i = 0; i < itemCount; i++) {
    const p = rand(products);
    const qty = randNumber(1, 5);
    const price = (p.price ?? Math.floor(Math.random() * 1000) + 50) as number;
    items.push({
      productId: p.id,
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
    creditDays = randNumber(7, 30);
    const d = new Date();
    d.setDate(d.getDate() + creditDays);
    creditDueDate = d.toISOString().split("T")[0];
  }

  const shippingCost = Number((Math.random() * 200).toFixed(2));
  const otherCosts = Number((Math.random() * 100).toFixed(2));

  const payload: SaleFormData = {
    customerId: customer.id,
    employeeId: employee.id,
    paymentTerm: paymentTerm,
    creditDays: creditDays,
    creditDueDate: creditDueDate,
    usePromotionalCredit: false,
    saleDate,
    deliveryDate: saleDate,
    billingAddress: customer.billingAddressLine ?? "",
    shippingAddress: customer.shippingAddressLine ?? "",
    items,
    shippingCost,
    otherCosts,
    otherCostsDescription: RANDOM_OTHER_COSTS_DESCRIPTION,
    notes: RANDOM_NOTE,
  };

  return payload;
}

export default generateRandomSaleFromDb;
