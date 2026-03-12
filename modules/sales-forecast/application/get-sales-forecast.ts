import { SalesForecastResponse } from "../types";
import {
  findSalesTargetsWithDetails,
  findCompletedSalesSummary,
  findTradeNameGroups,
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
  const salesPromise = findCompletedSalesSummary(startDate, endDate);

  const groupsPromise = findTradeNameGroups();

  const [targets, sales, groups] = await Promise.all([
    targetsPromise,
    salesPromise,
    groupsPromise,
  ]);

  // Process sales summary
  const monthlyData: Record<number, number> = {};
  for (let i = 1; i <= 12; i++) {
    monthlyData[i] = 0;
  }
  sales.forEach((sale) => {
    const saleMonth = new Date(sale.saleDate).getMonth() + 1;
    monthlyData[saleMonth] += Number(sale.totalAmount) || 0;
  });
  const actualSales = Object.entries(monthlyData).map(([m, totalAmount]) => ({
    month: parseInt(m),
    totalAmount,
  }));

  // Process forecast data
  const personalMap = new Map<string, any>();
  const groupMap = new Map<string, any>();
  const productMap = new Map<string, any>();

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

    target.stores.forEach((store) => {
      store.items.forEach((item) => {
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

        const groupKey = `${item.product.productGroup || "unassigned"}-${
          target.month
        }`;
        if (!groupMap.has(groupKey)) {
          groupMap.set(groupKey, {
            productGroup: item.product.productGroup || "unassigned",
            month: target.month,
            totalAmount: 0,
            totalQuantity: 0,
          });
        }

        const groupEntry = groupMap.get(groupKey);
        if (groupEntry) {
          groupEntry.totalAmount += amount;
          groupEntry.totalQuantity += quantity;
        }

        const productKey = `${item.productId}-${target.month}`;
        if (!productMap.has(productKey)) {
          productMap.set(productKey, {
            productId: item.productId,
            productCode: item.product.productCode,
            productName: item.product.name,
            productGroup: item.product.productGroup,
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
  const group = Array.from(groupMap.values()).sort((a, b) =>
    a.productGroup.localeCompare(b.productGroup),
  );
  const product = Array.from(productMap.values()).sort((a, b) =>
    a.productName.localeCompare(b.productName),
  );

  // Create group labels map
  const groupLabels = groups.reduce<Record<string, string>>((acc, g) => {
    acc[g.code] = g.description;
    return acc;
  }, {});

  return {
    personal,
    group,
    product,
    actualSales,
    groupLabels,
  };
}
