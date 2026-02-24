import { startOfDay, endOfDay } from "date-fns";
import {
  Prisma,
  type ShippingCompanyStatus,
} from "@/src/infrastructure/database";
import { db } from "@/src/infrastructure/database";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type ListShippingCompaniesParams = {
  page?: number;
  perPage?: number;
  q?: string;
  from?: Date;
  to?: Date;
};

// ─────────────────────────────────────────────
// Repository Functions (Data Access Layer)
// ─────────────────────────────────────────────

/**
 * Retrieve a paginated list of shipping companies with optional search & date filtering.
 */
export async function findShippingCompanies(
  params: ListShippingCompaniesParams,
) {
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

/**
 * Retrieve a single shipping company by ID with customer details.
 */
export async function findShippingCompanyById(id: string) {
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

/**
 * Create a shipping company with optional customer relationships.
 */
export async function createShippingCompany(data: {
  name: string;
  phone?: string;
  address?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  notes?: string;
  status?: string;
  customerIds?: string[];
}) {
  const { customerIds, ...shippingCompanyData } = data;

  const shippingCompany = await db.shippingCompany.create({
    data: {
      name: shippingCompanyData.name,
      phone: shippingCompanyData.phone,
      address: shippingCompanyData.address,
      addressLine: shippingCompanyData.addressLine,
      province: shippingCompanyData.province,
      district: shippingCompanyData.district,
      subdistrict: shippingCompanyData.subdistrict,
      postalCode: shippingCompanyData.postalCode,
      notes: shippingCompanyData.notes,
      status: (shippingCompanyData.status ?? "ACTIVE") as ShippingCompanyStatus,
      customers: customerIds?.length
        ? {
            create: customerIds.map((customerId) => ({
              customerId: customerId,
            })),
          }
        : undefined,
    },
    include: {
      customers: true,
    },
  });

  // Fetch customer details
  const customerDetails = customerIds?.length
    ? await db.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, customerCode: true },
      })
    : [];

  return {
    ...shippingCompany,
    customerList: customerDetails,
    customers: undefined,
  };
}

/**
 * Update a shipping company with optional customer relationships.
 */
export async function updateShippingCompany(
  id: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    addressLine?: string;
    province?: string;
    district?: string;
    subdistrict?: string;
    postalCode?: string;
    notes?: string;
    status?: string;
    customerIds?: string[];
  },
) {
  const { customerIds, status, ...updateData } = data;

  const shippingCompany = await db.shippingCompany.update({
    where: { id },
    data: {
      ...updateData,
      ...(status !== undefined
        ? { status: status as ShippingCompanyStatus }
        : {}),

      ...(customerIds !== undefined
        ? {
            customers: {
              deleteMany: {}, // Remove existing relationships
              create: customerIds.map((customerId) => ({
                customerId: customerId,
              })),
            },
          }
        : {}),
    },
    include: {
      customers: true,
    },
  });

  // Fetch customer details
  const updatedCustomerIds =
    customerIds ??
    (shippingCompany as any).customers.map((c: any) => c.customerId);
  const customers = updatedCustomerIds.length
    ? await db.customer.findMany({
        where: { id: { in: updatedCustomerIds } },
        select: { id: true, name: true, customerCode: true },
      })
    : [];

  return {
    ...shippingCompany,
    customerList: customers,
    customers: undefined,
  };
}

/**
 * Soft-delete a shipping company by setting the `deletedAt` timestamp.
 */
export async function softDeleteShippingCompany(id: string) {
  return db.shippingCompany.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
