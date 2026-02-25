import { startOfDay, endOfDay } from "date-fns";
import { Prisma } from "@/lib/db";
import { db } from "@/lib/db";

export type GetCompaniesParams = {
  page?: number;
  perPage?: number;
  q?: string;
  from?: Date;
  to?: Date;
};

export async function findCompanies(params: GetCompaniesParams) {
  const { page = 1, perPage = 12, q, from, to } = params;

  const where: Prisma.CompanyWhereInput = { deletedAt: null };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { shortName: { contains: q, mode: "insensitive" } },
    ];
  }

  if (from || to) {
    where.createdAt = {
      ...(from ? { gte: startOfDay(from) } : {}),
      ...(to ? { lte: endOfDay(to) } : {}),
    };
  }

  const [total, companies] = await Promise.all([
    db.company.count({ where }),
    db.company.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  return { total, companies };
}

export async function findCompanyById(id: string) {
  return db.company.findFirst({
    where: { id, deletedAt: null },
  });
}

export async function findAllActiveCompanies() {
  return db.company.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
    },
  });
}

export async function createCompany(data: Prisma.CompanyCreateInput) {
  return db.company.create({
    data,
  });
}

export async function updateCompany(
  id: string,
  data: Prisma.CompanyUpdateInput,
) {
  return db.company.update({
    where: { id },
    data,
  });
}

export async function softDeleteCompany(id: string) {
  return db.company.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}
