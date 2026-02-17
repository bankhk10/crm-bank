import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/src/infrastructure/database";
import { db } from "@/src/infrastructure/database";

export type GetShippingCompaniesParams = {
  page?: number;
  perPage?: number;
  q?: string;
  from?: Date;
  to?: Date;
};

export async function getShippingCompanies(params: GetShippingCompaniesParams) {
  const { page = 1, perPage = 12, q, from, to } = params;

  const where: Prisma.ShippingCompanyWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
      { address: { contains: q, mode: "insensitive" } },
    ];
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: startOfDay(from) } : {}),
      ...(to ? { lte: endOfDay(to) } : {}),
    };
  }

  const [total, shippingCompanies] = await Promise.all([
    db.shippingCompany.count({ where }),
    db.shippingCompany.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        customers: true,
      },
    }),
  ]);

  // Fetch customer details for all shipping companies
  const customerIds = shippingCompanies
    .flatMap((sc) => sc.customers.map((c) => c.customerId))
    .filter((id, index, self) => self.indexOf(id) === index); // unique

  const customers = await db.customer.findMany({
    where: { id: { in: customerIds } },
    select: { id: true, name: true, customerCode: true },
  });

  const customerMap = new Map(customers.map((c) => [c.id, c]));

  // Transform data to include customer list
  const transformedData = shippingCompanies.map((sc) => ({
    ...sc,
    customerList: sc.customers
      .map((c) => customerMap.get(c.customerId))
      .filter((c): c is typeof c & {} => c !== undefined),
    customers: undefined, // Remove the junction table data
  }));

  return { total, shippingCompanies: transformedData };
}

export async function getShippingCompany(id: string) {
  const shippingCompany = await db.shippingCompany.findFirst({
    where: { id, deletedAt: null },
    include: {
      customers: true,
    },
  });

  if (!shippingCompany) return null;

  // Fetch customer details
  const customerIds = shippingCompany.customers.map((c) => c.customerId);
  const customers = customerIds.length
    ? await db.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, customerCode: true },
      })
    : [];

  return {
    ...shippingCompany,
    customerList: customers,
    customers: undefined,
  };
}
