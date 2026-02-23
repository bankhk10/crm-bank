import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/src/infrastructure/database";
import { db } from "@/src/infrastructure/database";
import { getRegionByProvince } from "@/lib/province-region-mapping";

export type ListCustomersParams = {
  page?: number;
  perPage?: number;
  q?: string;
  typeFilter?: string | null;
  statusFilter?: string | null;
  from?: Date | null;
  to?: Date | null;
  parentDealerId?: string | null;
  scopedWhere?: Prisma.CustomerWhereInput; // from applyDataScope
};

export async function findCustomers(params: ListCustomersParams) {
  const {
    page = 1,
    perPage = 12,
    q,
    typeFilter,
    statusFilter,
    from,
    to,
    parentDealerId,
    scopedWhere,
  } = params;

  const where: Prisma.CustomerWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { customerCode: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { phone: { contains: q, mode: "insensitive" } },
    ];
  }

  if (typeFilter) {
    where.customerType = typeFilter as any;
  }

  if (statusFilter) {
    where.status = statusFilter as any;
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: startOfDay(from) } : {}),
      ...(to ? { lte: endOfDay(to) } : {}),
    };
  }

  if (parentDealerId) {
    where.parentDealerId = parentDealerId;
  }

  // merge with scopedWhere
  const finalWhere = scopedWhere ? { ...scopedWhere, ...where } : where;

  const [total, customers] = await Promise.all([
    db.customer.count({
      where: finalWhere,
    }),
    db.customer.findMany({
      where: finalWhere,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      include: {
        creditLimits: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        temporaryCreditLimits: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        shippingCompanies: {
          include: {
            shippingCompany: true,
          },
        },
        parentDealer: {
          select: {
            id: true,
            customerCode: true,
            name: true,
          },
        },
        subDealers: {
          where: { deletedAt: null },
          select: {
            id: true,
            customerCode: true,
            name: true,
            customerType: true,
            status: true,
            phone: true,
            email: true,
          },
          orderBy: { createdAt: "desc" },
        },
        addresses: {
          orderBy: { createdAt: "desc" },
        },
      },
    }),
  ]);

  return { total, customers, page, perPage };
}

export async function findCustomerById(id: string) {
  return db.customer.findFirst({
    where: { id, deletedAt: null },
    include: {
      creditLimits: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
      },
      images: {
        orderBy: { order: "asc" },
      },
      responsibleEmployee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
      parentDealer: {
        select: {
          id: true,
          name: true,
        },
      },
      addresses: true,
      contacts: true,
    },
  });
}

export async function createCustomer(data: any) {
  return db.customer.create({
    data,
  });
}

export async function updateCustomer(id: string, data: any) {
  return db.customer.update({
    where: { id },
    data,
  });
}

export async function softDeleteCustomer(id: string) {
  return db.customer.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

export async function getHighestCustomerCode(pattern: string) {
  return db.customer.findMany({
    where: {
      customerCode: {
        startsWith: pattern,
      },
      deletedAt: null,
    },
    select: {
      customerCode: true,
    },
    orderBy: {
      customerCode: "desc",
    },
    take: 1,
  });
}

export async function findCustomerByCode(code: string) {
  return db.customer.findFirst({
    where: { customerCode: code, deletedAt: null },
  });
}
