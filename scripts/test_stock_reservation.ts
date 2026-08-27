import "dotenv/config";
import { db } from "@/lib/db";
import {
  approveSaleUseCase,
} from "@/modules/sales/application/approve-sale";
import {
  updateFulfillmentUseCase,
} from "@/modules/fulfillment/application/update-fulfillment";
import {
  createShipmentUseCase,
} from "@/modules/fulfillment/application/create-shipment";
import {
  updateShipmentUseCase,
} from "@/modules/fulfillment/application/update-shipment";
import {
  releaseStockUseCase,
  confirmStockDeductionUseCase,
  deductStockForShipmentUseCase,
} from "@/modules/products/application/stock-management";
import {
  upsertProductStock,
  InsufficientReservedStockError,
} from "@/modules/products/infrastructure/stock.repository";

interface TestContext {
  userId: string;
  customerId: string;
  employeeId: string;
  productId: string;
  createdSaleIds: string[];
  createdProductIds: string[];
}

async function setupTestContext(): Promise<TestContext> {
  const user = await db.user.findFirst({ where: { isActive: true } });
  if (!user) throw new Error("No active user found for test");

  const customer = await db.customer.findFirst({ where: { deletedAt: null } });
  if (!customer) throw new Error("No customer found for test");

  const employee = await db.employee.findFirst({ where: { deletedAt: null } });
  if (!employee) throw new Error("No employee found for test");

  return {
    userId: user.id,
    customerId: customer.id,
    employeeId: employee.id,
    productId: "",
    createdSaleIds: [],
    createdProductIds: [],
  };
}

async function createTestProduct(ctx: TestContext, initialPhysical = 200, initialReserved = 0) {
  const code = `TEST-PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const product = await db.product.create({
    data: {
      productCode: code,
      name: `Test Product ${code}`,
      unit: "กล่อง",
      status: "ACTIVE",
    },
  });
  ctx.createdProductIds.push(product.id);

  // Setup initial product stock
  await upsertProductStock(product.id, {
    physicalBalance: initialPhysical,
    reservedQuantity: initialReserved,
    availableQuantity: initialPhysical - initialReserved,
  });

  return product;
}

async function createTestSale(ctx: TestContext, productId: string, quantity = 100) {
  const saleNum = `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const sale = await db.sale.create({
    data: {
      saleNumber: saleNum,
      saleDate: new Date(),
      status: "PENDING_APPROVAL",
      paymentTerm: "PREPAID",
      subtotalAmount: quantity * 100,
      totalAmount: quantity * 100,
      customerId: ctx.customerId,
      employeeId: ctx.employeeId,
      createdById: ctx.userId,
      items: {
        create: {
          productId,
          quantity,
          unitPrice: 100,
          originalPrice: 100,
          totalPrice: quantity * 100,
          unit: "กล่อง",
        },
      },
    },
    include: { items: true },
  });
  ctx.createdSaleIds.push(sale.id);
  return sale;
}

async function runTests() {
  console.log("================================================================");
  console.log("🧪 RUNNING 10 COMPREHENSIVE STOCK RESERVATION AUTOMATED TESTS");
  console.log("================================================================\n");

  const ctx = await setupTestContext();
  let passed = 0;
  let failed = 0;

  async function test(name: string, fn: () => Promise<void>) {
    process.stdout.write(`⏳ ${name} ... `);
    try {
      await fn();
      console.log("✅ PASS");
      passed++;
    } catch (err: any) {
      console.log(`❌ FAIL: ${err.message}`);
      console.error(err);
      failed++;
    }
  }

  try {
    // TEST 1: Approve Sale 100 -> Reserved 100
    await test("TEST 1: Approve Sale 100 -> Reserved 100", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);

      await approveSaleUseCase(sale.id, ctx.userId);

      const stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 100) {
        throw new Error(`Expected reserved 100, got ${stock?.reservedQuantity}`);
      }
      if (stock?.availableQuantity !== 100) {
        throw new Error(`Expected available 100, got ${stock?.availableQuantity}`);
      }
    });

    // TEST 2: Single Delivery -> Reserved 0
    await test("TEST 2: Single Delivery (Set Delivery Date) -> Reserved 0", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);
      await approveSaleUseCase(sale.id, ctx.userId);

      await updateFulfillmentUseCase(sale.id, ctx.userId, {
        status: "AWAITING_DELIVERY",
        deliveryDate: new Date().toISOString(),
      });

      const stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`Expected reserved 0, got ${stock?.reservedQuantity}`);
      }
      if (stock?.availableQuantity !== 200) {
        throw new Error(`Expected available 200, got ${stock?.availableQuantity}`);
      }
    });

    // TEST 3: Split Shipment 93 + 7 -> Deliver 93 (Reserved 7) -> Deliver 7 (Reserved 0)
    await test("TEST 3: Split Shipment 93 + 7 -> Deliver 93 -> Reserved 7 -> Deliver 7 -> Reserved 0", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);
      await approveSaleUseCase(sale.id, ctx.userId);

      const saleItem = sale.items[0];

      // Create Shipment #1 (93)
      const sh1 = await createShipmentUseCase(sale.id, ctx.userId, {
        items: [{ saleItemId: saleItem.id, quantity: 93 }],
      });

      // Create Shipment #2 (7)
      const sh2 = await createShipmentUseCase(sale.id, ctx.userId, {
        items: [{ saleItemId: saleItem.id, quantity: 7 }],
      });

      // Deliver Shipment #1
      await updateShipmentUseCase(sh1.id, ctx.userId, { status: "IN_TRANSIT" });

      let stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 7) {
        throw new Error(`After Sh#1: Expected reserved 7, got ${stock?.reservedQuantity}`);
      }

      // Deliver Shipment #2
      await updateShipmentUseCase(sh2.id, ctx.userId, { status: "DELIVERED" });

      stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`After Sh#2: Expected reserved 0, got ${stock?.reservedQuantity}`);
      }
    });

    // TEST 4: Set Delivery Date before creating Split Shipment -> No Double Deduction
    await test("TEST 4: Set Delivery Date before Split Shipment -> No Double Deduction", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);
      await approveSaleUseCase(sale.id, ctx.userId);

      // User sets single delivery date first
      await updateFulfillmentUseCase(sale.id, ctx.userId, {
        status: "AWAITING_DELIVERY",
        deliveryDate: new Date().toISOString(),
      });

      let stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`After single delivery: Expected reserved 0, got ${stock?.reservedQuantity}`);
      }

      // User now decides to split shipment: 93 + 7
      const saleItem = sale.items[0];
      const sh1 = await createShipmentUseCase(sale.id, ctx.userId, {
        items: [{ saleItemId: saleItem.id, quantity: 93 }],
      });
      const sh2 = await createShipmentUseCase(sale.id, ctx.userId, {
        items: [{ saleItemId: saleItem.id, quantity: 7 }],
      });

      // Creating split shipment should restore reservation to 100
      stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 100) {
        throw new Error(`After creating split shipments: Expected reserved 100, got ${stock?.reservedQuantity}`);
      }

      // Deliver Shipment #1 (93)
      await updateShipmentUseCase(sh1.id, ctx.userId, { status: "DELIVERED" });
      stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 7) {
        throw new Error(`After delivering Sh#1: Expected reserved 7, got ${stock?.reservedQuantity}`);
      }

      // Deliver Shipment #2 (7)
      await updateShipmentUseCase(sh2.id, ctx.userId, { status: "DELIVERED" });
      stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`After delivering Sh#2: Expected reserved 0, got ${stock?.reservedQuantity}`);
      }
    });

    // TEST 5: Deliver Shipment Repeatedly -> Idempotent, no double reduction
    await test("TEST 5: Deliver Shipment Repeatedly -> Idempotent, no double reduction", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);
      await approveSaleUseCase(sale.id, ctx.userId);

      const saleItem = sale.items[0];
      const sh1 = await createShipmentUseCase(sale.id, ctx.userId, {
        items: [{ saleItemId: saleItem.id, quantity: 100 }],
      });

      // Update to IN_TRANSIT
      await updateShipmentUseCase(sh1.id, ctx.userId, { status: "IN_TRANSIT" });
      let stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`After IN_TRANSIT: Expected reserved 0, got ${stock?.reservedQuantity}`);
      }

      // Update again to DELIVERED
      await updateShipmentUseCase(sh1.id, ctx.userId, { status: "DELIVERED" });
      stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`After DELIVERED: Expected reserved 0, got ${stock?.reservedQuantity}`);
      }
    });

    // TEST 6: Cancel Shipment -> Stock Restored and Not Released Twice
    await test("TEST 6: Cancel Shipment -> Stock Restored and Not Released Twice", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);
      await approveSaleUseCase(sale.id, ctx.userId);

      const saleItem = sale.items[0];
      const sh1 = await createShipmentUseCase(sale.id, ctx.userId, {
        items: [{ saleItemId: saleItem.id, quantity: 50 }],
      });

      await updateShipmentUseCase(sh1.id, ctx.userId, { status: "IN_TRANSIT" });
      let stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 50) {
        throw new Error(`After IN_TRANSIT: Expected reserved 50, got ${stock?.reservedQuantity}`);
      }

      // Cancel shipment
      await updateShipmentUseCase(sh1.id, ctx.userId, { status: "CANCELLED" });
      stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 100) {
        throw new Error(`After CANCELLED: Expected reserved 100, got ${stock?.reservedQuantity}`);
      }
    });

    // TEST 7: Cancel Sale after Partial Delivery -> Release only remaining pending quantity
    await test("TEST 7: Cancel Sale after Partial Delivery -> Release only remaining pending quantity", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);
      await approveSaleUseCase(sale.id, ctx.userId);

      const saleItem = sale.items[0];
      // Deliver 60
      const sh1 = await createShipmentUseCase(sale.id, ctx.userId, {
        items: [{ saleItemId: saleItem.id, quantity: 60 }],
      });
      await updateShipmentUseCase(sh1.id, ctx.userId, { status: "DELIVERED" });

      let stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 40) {
        throw new Error(`After 60 delivered: Expected reserved 40, got ${stock?.reservedQuantity}`);
      }

      // Cancel entire sale
      await releaseStockUseCase(sale.id);
      stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`After cancelling sale: Expected reserved 0, got ${stock?.reservedQuantity}`);
      }
    });

    // TEST 8: Edit Quantity (100 -> 70) via releaseStock & re-approve -> Reserved adjusted correctly
    await test("TEST 8: Edit Quantity (100 -> 70) -> Reserved reduced by 30", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);
      await approveSaleUseCase(sale.id, ctx.userId);

      let stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 100) {
        throw new Error(`Initial reserved: Expected 100, got ${stock?.reservedQuantity}`);
      }

      // Simulate edit: release old 100, re-reserve 70
      await releaseStockUseCase(sale.id);
      await upsertProductStock(prod.id, {
        reservedQuantityIncrement: 70,
        availableQuantityIncrement: -70,
      });

      stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 70) {
        throw new Error(`After edit: Expected reserved 70, got ${stock?.reservedQuantity}`);
      }
      if (stock?.availableQuantity !== 130) {
        throw new Error(`After edit: Expected available 130, got ${stock?.availableQuantity}`);
      }
    });

    // TEST 9: Concurrent Delivery on Same Shipment -> Deduct only once
    await test("TEST 9: Concurrent Delivery on Same Shipment -> Deduct only once", async () => {
      const prod = await createTestProduct(ctx, 200, 0);
      const sale = await createTestSale(ctx, prod.id, 100);
      await approveSaleUseCase(sale.id, ctx.userId);

      const saleItem = sale.items[0];
      const sh1 = await createShipmentUseCase(sale.id, ctx.userId, {
        items: [{ saleItemId: saleItem.id, quantity: 100 }],
      });

      // Fire 2 concurrent updates
      const p1 = updateShipmentUseCase(sh1.id, ctx.userId, { status: "DELIVERED" }).catch((e) => e);
      const p2 = updateShipmentUseCase(sh1.id, ctx.userId, { status: "DELIVERED" }).catch((e) => e);

      await Promise.all([p1, p2]);

      const stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`Concurrent delivery: Expected reserved 0, got ${stock?.reservedQuantity}`);
      }
    });

    // TEST 10: Invariant Guard: Reserved Cannot Go Negative
    await test("TEST 10: Invariant Guard: Reserved Cannot Go Negative (Throws InsufficientReservedStockError)", async () => {
      const prod = await createTestProduct(ctx, 200, 0);

      let threw = false;
      try {
        await upsertProductStock(prod.id, {
          reservedQuantityIncrement: -7,
        });
      } catch (err: any) {
        threw = true;
        if (!(err instanceof InsufficientReservedStockError) && !err.message.includes("Insufficient reserved stock")) {
          throw new Error(`Expected InsufficientReservedStockError, got ${err.message}`);
        }
      }

      if (!threw) {
        throw new Error("Expected upsertProductStock to throw an error when reserved goes negative!");
      }

      const stock = await db.productStock.findUnique({ where: { productId: prod.id } });
      if (stock?.reservedQuantity !== 0) {
        throw new Error(`Reserved should remain 0, got ${stock?.reservedQuantity}`);
      }
    });

  } finally {
    // Cleanup test data
    console.log("\n🧹 Cleaning up test fixtures...");
    for (const saleId of ctx.createdSaleIds) {
      await db.saleItemLot.deleteMany({ where: { saleItem: { saleId } } }).catch(() => {});
      await db.shipmentItem.deleteMany({ where: { shipment: { saleId } } }).catch(() => {});
      await db.shipment.deleteMany({ where: { saleId } }).catch(() => {});
      await db.saleStatusHistory.deleteMany({ where: { saleId } }).catch(() => {});
      await db.saleItem.deleteMany({ where: { saleId } }).catch(() => {});
      await db.sale.deleteMany({ where: { id: saleId } }).catch(() => {});
    }
    for (const prodId of ctx.createdProductIds) {
      await db.productStock.deleteMany({ where: { productId: prodId } }).catch(() => {});
      await db.productStockLot.deleteMany({ where: { productId: prodId } }).catch(() => {});
      await db.product.deleteMany({ where: { id: prodId } }).catch(() => {});
    }
    console.log("🧹 Cleanup complete.");
  }

  console.log("\n================================================================");
  console.log(`📊 TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log("================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error).finally(() => db.$disconnect());
