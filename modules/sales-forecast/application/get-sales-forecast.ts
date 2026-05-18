import { SalesForecastResponse } from "../types";
import {
  findSalesTargetsWithDetails,
  findActualSalesWithShipments,
  findTradeNameGroups,
  findProductABCTypes,
} from "../infrastructure/sales-forecast.repository";

const buildEmployeeName = (employee: {
  name: string;
  firstName: string | null;
  lastName: string | null;
  prefix: string | null;
}) => {
  const nameParts = [employee.prefix, employee.firstName, employee.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return nameParts || employee.name;
};

export async function getSalesForecastUseCase(
  year: number,
  month: number | null = null,
): Promise<SalesForecastResponse> {
  const targetsPromise = findSalesTargetsWithDetails(year, month);

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  const salesPromise = findActualSalesWithShipments(startDate, endDate);

  const groupsPromise = findTradeNameGroups();

  const [targets, salesData, groups, abcTypes] = (await Promise.all([
    targetsPromise,
    salesPromise,
    groupsPromise,
    findProductABCTypes(),
  ])) as [any[], any, any[], any[]];

  // Process sales summary
  // สำหรับ Split Shipment: นับแต่ละ Shipment ตาม scheduledDate (วันที่จัดส่งของ)
  // สำหรับ Legacy (ไม่มี Shipment): นับตาม deliveryDate → requestedDeliveryDate → saleDate
  const monthlyData: Record<number, number> = {};
  for (let i = 1; i <= 12; i++) {
    monthlyData[i] = 0;
  }

  // 1. Shipment-based: ใช้ scheduledDate เป็นหลัก
  salesData.shipments.forEach((shipment: any) => {
    const dateToUse = shipment.scheduledDate || shipment.actualDate || shipment.sale?.requestedDeliveryDate;
    if (dateToUse) {
      const saleMonth = new Date(dateToUse).getMonth() + 1;
      monthlyData[saleMonth] += Number(shipment.totalAmount) || 0;
    }
  });

  // 2. Legacy: Sale ที่ไม่มี Shipment
  salesData.legacySales.forEach((sale: any) => {
    const dateToUse = sale.deliveryDate || sale.requestedDeliveryDate || sale.saleDate;
    if (dateToUse) {
      const saleMonth = new Date(dateToUse).getMonth() + 1;
      monthlyData[saleMonth] += Number(sale.totalAmount) || 0;
    }
  });

  const actualSales = Object.entries(monthlyData).map(([m, totalAmount]) => ({
    month: parseInt(m),
    totalAmount,
  }));

  // Process forecast data
  const personalMap = new Map<string, any>();
  const tradeNameGroupMap = new Map<string, any>();
  const productMap = new Map<string, any>();
  const abcMap = new Map<string, any>();

  targets.forEach((target) => {
    const employeeName = buildEmployeeName(target.employee);
    const personalKey = `${target.employeeId}-${target.month}`;

    if (!personalMap.has(personalKey)) {
      personalMap.set(personalKey, {
        employeeId: target.employeeId,
        employeeName,
        region: target.employee.responsibilityArea,
        month: target.month,
        totalAmount: 0,
        totalQuantity: 0,
        details: [],
      });
    }

    target.stores.forEach((store: any) => {
      store.items.forEach((item: any) => {
        const amount = Number(item.targetAmount || 0);
        const quantity = item.qtyPerBox || 0;

        const personalEntry = personalMap.get(personalKey);
        if (personalEntry) {
          personalEntry.totalAmount += amount;
          personalEntry.totalQuantity += quantity;
          personalEntry.details.push({
            productId: item.productId,
            productName: item.product.name,
            month: target.month,
            shopId: store.customer.id,
            shopName: store.customer.name,
            amount,
            quantity,
          });
        }

        const tradeNameGroupCode = (item.product as any).tradeNameGroup?.code || "unassigned";
        const groupKey = `${tradeNameGroupCode}-${target.month}`;
        if (!tradeNameGroupMap.has(groupKey)) {
          tradeNameGroupMap.set(groupKey, {
            tradeNameGroup: tradeNameGroupCode,
            month: target.month,
            totalAmount: 0,
            totalQuantity: 0,
          });
        }

        const groupEntry = tradeNameGroupMap.get(groupKey);
        if (groupEntry) {
          groupEntry.totalAmount += amount;
          groupEntry.totalQuantity += quantity;
        }

        // ABC Type grouping
        const abcCode = (item.product as any).productABCType?.code || "unassigned";
        const abcName = (item.product as any).productABCType?.name || "ไม่ระบุประเภท";
        const abcKey = `${abcCode}-${target.month}`;
        if (!abcMap.has(abcKey)) {
          abcMap.set(abcKey, {
            abcCode,
            abcName,
            month: target.month,
            totalAmount: 0,
            totalQuantity: 0,
          });
        }
        const abcEntry = abcMap.get(abcKey);
        if (abcEntry) {
          abcEntry.totalAmount += amount;
          abcEntry.totalQuantity += quantity;
        }

        const productKey = `${item.productId}-${target.month}`;
        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            productId: item.productId,
            productCode: item.product.productCode,
            productName: item.product.name,
            tradeNameGroup: (item.product as any).tradeNameGroup?.code || "unassigned",
            month: target.month,
            totalAmount: 0,
            totalQuantity: 0,
          });
        }

        const productEntry = productMap.get(productKey);
        if (productEntry) {
          productEntry.totalAmount += amount;
          productEntry.totalQuantity += quantity;
        }
      });
    });
  });

  const personal = Array.from(personalMap.values()).sort((a, b) =>
    a.employeeName.localeCompare(b.employeeName),
  );
  const tradeNameGroup = Array.from(tradeNameGroupMap.values()).sort((a, b) =>
    a.tradeNameGroup.localeCompare(b.tradeNameGroup),
  );
  const product = Array.from(productMap.values()).sort((a, b) =>
    a.productName.localeCompare(b.productName),
  );
  const abc = Array.from(abcMap.values()).sort((a, b) =>
    a.abcCode.localeCompare(b.abcCode),
  );

  // Create group labels map
  const tradeNameGroupLabels = groups.reduce<Record<string, string>>((acc, g) => {
    acc[g.code] = g.description;
    return acc;
  }, {});

  // Create ABC labels map
  const abcLabels = abcTypes.reduce<Record<string, string>>((acc, t) => {
    acc[t.code] = t.name;
    return acc;
  }, {});

  return {
    personal,
    tradeNameGroup,
    product,
    abc,
    actualSales,
    tradeNameGroupLabels,
    abcLabels,
  };
}
