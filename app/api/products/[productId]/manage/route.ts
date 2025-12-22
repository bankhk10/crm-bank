import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/lib/rbac";

const resourcePath = "/api/products";

const managementSchema = z.object({
  price: z.number().optional(),
  promotionBudget: z.number().optional(),
  freeItems: z
    .array(
      z.object({
        id: z.string().optional(),
        purchaseQty: z.number().min(1),
        freeQty: z.number().min(0),
        netPrice: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  promotionItems: z
    .array(
      z.object({
        id: z.string().optional(),
        name: z.string().min(1),
        quantity: z.number().min(0),
        price: z.number().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
  stockLots: z
    .array(
      z.object({
        id: z.string().optional(),
        quantity: z.number().min(1),
        importDate: z.string().or(z.date()),
        expiryDate: z.string().or(z.date()).optional(),
        storageLocation: z.string().optional(),
        notes: z.string().optional(),
      })
    )
    .optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissions)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!session.user.permissions?.["product.manage"]?.allow) {
    return NextResponse.json(
      { error: "Forbidden - missing product.manage" },
      { status: 403 }
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = managementSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  try {
    // Start a transaction for all management updates
    const result = await db.$transaction(async (tx) => {
      // Update price and promotion budget
      const product = await tx.product.update({
        where: { id: productId, deletedAt: null },
        data: {
          price: parsed.data.price,
          promotionBudget: parsed.data.promotionBudget,
        },
      });

      // Handle free items
      if (parsed.data.freeItems) {
        const existingFreeItems = await tx.productFreeItem.findMany({
          where: { productId },
        });

        const freeItemsToKeep = parsed.data.freeItems
          .filter((item) => item.id)
          .map((item) => item.id!);

        // Delete removed items
        await tx.productFreeItem.deleteMany({
          where: {
            productId,
            id: {
              notIn: freeItemsToKeep.length > 0 ? freeItemsToKeep : undefined,
            },
          },
        });

        // Update or create free items
        for (const item of parsed.data.freeItems) {
          if (item.id) {
            await tx.productFreeItem.update({
              where: { id: item.id },
              data: {
                purchaseQty: item.purchaseQty,
                freeQty: item.freeQty,
                netPrice: item.netPrice,
                notes: item.notes,
              },
            });
          } else {
            await tx.productFreeItem.create({
              data: {
                productId,
                purchaseQty: item.purchaseQty,
                freeQty: item.freeQty,
                netPrice: item.netPrice,
                notes: item.notes,
              },
            });
          }
        }
      }

      // Handle promotion items
      if (parsed.data.promotionItems) {
        const promotionItemsToKeep = parsed.data.promotionItems
          .filter((item) => item.id)
          .map((item) => item.id!);

        await tx.productPromotionItem.deleteMany({
          where: {
            productId,
            id: {
              notIn:
                promotionItemsToKeep.length > 0
                  ? promotionItemsToKeep
                  : undefined,
            },
          },
        });

        for (const item of parsed.data.promotionItems) {
          if (item.id) {
            await tx.productPromotionItem.update({
              where: { id: item.id },
              data: {
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes,
              },
            });
          } else {
            await tx.productPromotionItem.create({
              data: {
                productId,
                name: item.name,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes,
              },
            });
          }
        }
      }

      // Handle stock lots
      if (parsed.data.stockLots) {
        // Get all existing stock lots
        const existingLots = await tx.productStockLot.findMany({
          where: { productId },
        });

        const stockLotsToKeep = parsed.data.stockLots
          .filter((item) => item.id)
          .map((item) => item.id!);

        // Delete removed stock lots (only if not used)
        const lotsToDelete = existingLots.filter(
          (lot) => !stockLotsToKeep.includes(lot.id) && !lot.isUsed
        );

        if (lotsToDelete.length > 0) {
          await tx.productStockLot.deleteMany({
            where: {
              id: { in: lotsToDelete.map((lot) => lot.id) },
            },
          });
        }

        // Generate next lot number for new lots
        const lotCount = existingLots.length;
        let newLotIndex = 0;

        for (const item of parsed.data.stockLots) {
          if (item.id) {
            // Update existing lot (only if not used)
            const existingLot = existingLots.find((lot) => lot.id === item.id);
            if (existingLot && !existingLot.isUsed) {
              await tx.productStockLot.update({
                where: { id: item.id },
                data: {
                  quantity: item.quantity,
                  importDate: new Date(item.importDate),
                  expiryDate: item.expiryDate
                    ? new Date(item.expiryDate)
                    : null,
                  storageLocation: item.storageLocation,
                  notes: item.notes,
                },
              });
            }
          } else {
            // Create new lot with auto-generated lot number
            const newLotNumber = `LOT-${String(lotCount + newLotIndex + 1)}`;
            newLotIndex++;
            await tx.productStockLot.create({
              data: {
                productId,
                lotNumber: newLotNumber,
                quantity: item.quantity,
                importDate: new Date(item.importDate),
                expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
                storageLocation: item.storageLocation,
                notes: item.notes,
                isUsed: false,
              },
            });
          }
        }
      }

      // Fetch updated product with all relations
      return tx.product.findUnique({
        where: { id: productId },
        include: {
          images: true,
          freeItems: true,
          promotionItems: true,
          stockLots: true,
        },
      });
    });

    return NextResponse.json({ product: result });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2025"
    ) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    throw err;
  }
}
