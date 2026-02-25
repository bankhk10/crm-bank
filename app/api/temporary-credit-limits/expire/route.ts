import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAuthorized } from "@/modules/rbac";
import { Prisma } from "@/lib/db";

const resourcePath = "/api/temporary-credit-limits";

/**
 * POST /api/temporary-credit-limits/expire
 * ตรวจสอบและลบวงเงินชั่วคราวที่หมดอายุออกจาก CreditLimit
 *
 * Flow:
 * 1. หา TemporaryCreditLimit ที่ APPROVED และยังไม่ได้ revert และหมดอายุแล้ว
 * 2. ลดวงเงินใน CreditLimit ตามจำนวนที่เพิ่มไป
 * 3. อัพเดทสถานะ isReverted = true
 */
export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  try {
    // หา temporary credit limits ที่หมดอายุแล้ว
    const expiredTemporaryCredits = await db.temporaryCreditLimit.findMany({
      where: {
        status: "APPROVED",
        isReverted: false,
        expiryDate: {
          lt: now, // หมดอายุแล้ว
        },
        appliedToCreditLimitId: {
          not: null,
        },
        deletedAt: null,
      },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            customerCode: true,
          },
        },
      },
    });

    if (expiredTemporaryCredits.length === 0) {
      return NextResponse.json({
        message: "No expired temporary credits found",
        processed: 0,
        results: [],
      });
    }

    // Process each expired temporary credit
    const results = await Promise.all(
      expiredTemporaryCredits.map(async (tempCredit) => {
        try {
          const result = await db.$transaction(async (tx) => {
            // ดึงข้อมูล CreditLimit ที่เกี่ยวข้อง
            const creditLimit = await tx.creditLimit.findUnique({
              where: { id: tempCredit.appliedToCreditLimitId! },
            });

            if (!creditLimit) {
              return {
                success: false,
                temporaryCreditId: tempCredit.id,
                customerId: tempCredit.customerId,
                customerName: tempCredit.customer.name,
                error: "Credit limit not found",
              };
            }

            // คำนวณวงเงินใหม่ (ลบวงเงินชั่วคราวออก)
            const newLimitAmount = (creditLimit.limitAmount as any).sub
              ? (creditLimit.limitAmount as any).sub(
                  tempCredit.requestedAmount as any
                )
              : new Prisma.Decimal(String(creditLimit.limitAmount)).sub(
                  new Prisma.Decimal(String(tempCredit.requestedAmount))
                );

            const newAvailableAmount = (creditLimit.availableAmount as any).sub
              ? (creditLimit.availableAmount as any).sub(
                  tempCredit.requestedAmount as any
                )
              : new Prisma.Decimal(String(creditLimit.availableAmount)).sub(
                  new Prisma.Decimal(String(tempCredit.requestedAmount))
                );

            // ตรวจสอบว่า availableAmount ไม่ติดลบ
            if (newAvailableAmount.lessThan(0)) {
              return {
                success: false,
                temporaryCreditId: tempCredit.id,
                customerId: tempCredit.customerId,
                customerName: tempCredit.customer.name,
                error:
                  "Cannot revert: would result in negative available amount",
                currentAvailable: String(creditLimit.availableAmount),
                requestedAmount: String(tempCredit.requestedAmount),
              };
            }

            // อัพเดท CreditLimit
            await tx.creditLimit.update({
              where: { id: creditLimit.id },
              data: {
                limitAmount: newLimitAmount,
                availableAmount: newAvailableAmount,
                temporaryCreditAmount: 0,
                temporaryCreditExpiryDate: null,
              },
            });

            // อัพเดท TemporaryCreditLimit - เปลี่ยนสถานะเป็น EXPIRED
            await tx.temporaryCreditLimit.update({
              where: { id: tempCredit.id },
              data: {
                status: "EXPIRED",
                isReverted: true,
                revertedAt: now,
              },
            });

            return {
              success: true,
              temporaryCreditId: tempCredit.id,
              customerId: tempCredit.customerId,
              customerName: tempCredit.customer.name,
              customerCode: tempCredit.customer.customerCode,
              revertedAmount: String(tempCredit.requestedAmount),
              expiryDate: tempCredit.expiryDate,
              creditLimitId: creditLimit.id,
              newLimitAmount: String(newLimitAmount),
              newAvailableAmount: String(newAvailableAmount),
            };
          });

          return result;
        } catch (error) {
          console.error(
            `Error processing temporary credit ${tempCredit.id}:`,
            error
          );
          return {
            success: false,
            temporaryCreditId: tempCredit.id,
            customerId: tempCredit.customerId,
            customerName: tempCredit.customer.name,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    const failureCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      message: `Processed ${expiredTemporaryCredits.length} expired temporary credits`,
      processed: expiredTemporaryCredits.length,
      success: successCount,
      failed: failureCount,
      results,
    });
  } catch (error) {
    console.error("Error in expire endpoint:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/temporary-credit-limits/expire
 * ดูรายการ temporary credit ที่หมดอายุแล้วแต่ยังไม่ได้ revert
 */
export async function GET(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isAuthorized(resourcePath, session.user.permissionKeys ?? [])) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();

  const expiredTemporaryCredits = await db.temporaryCreditLimit.findMany({
    where: {
      status: "APPROVED",
      isReverted: false,
      expiryDate: {
        lt: now,
      },
      appliedToCreditLimitId: {
        not: null,
      },
      deletedAt: null,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          customerCode: true,
        },
      },
      approvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      expiryDate: "asc",
    },
  });

  return NextResponse.json({
    count: expiredTemporaryCredits.length,
    expiredCredits: expiredTemporaryCredits,
  });
}
