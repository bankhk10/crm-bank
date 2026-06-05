import { db, Prisma } from "@/lib/db";

export const FulfillmentRepository = {
  async getSaleById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.sale.findUnique({
      where: { id },
    });
  },

  async updateSale(
    id: string,
    data: Prisma.SaleUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || db;
    return client.sale.update({
      where: { id },
      data,
    });
  },

  async getSaleWithItemsAndLots(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || db;
    return client.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                productCode: true,
                name: true,
              },
            },
            lotAllocations: {
              include: {
                lot: true,
              },
            },
          },
        },
      },
    });
  },
};
