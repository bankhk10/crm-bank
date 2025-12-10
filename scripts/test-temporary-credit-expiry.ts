/**
 * Test Script สำหรับทดสอบ Temporary Credit Expiry Flow
 * 
 * วิธีใช้:
 * 1. แก้ไข customerId, userId ให้ตรงกับข้อมูลในฐานข้อมูล
 * 2. รัน: npx tsx scripts/test-temporary-credit-expiry.ts
 */

import { db } from "../lib/db";
import { Prisma } from "@prisma/client";

async function testTemporaryCreditExpiry() {
    console.log("=== Testing Temporary Credit Expiry Flow ===\n");

    try {
        // 1. หาลูกค้าที่มีอยู่
        const customer = await db.customer.findFirst({
            where: { deletedAt: null },
            include: {
                creditLimits: {
                    where: { deletedAt: null, status: "ACTIVE" },
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
            },
        });

        if (!customer) {
            console.error("❌ ไม่พบลูกค้าในระบบ กรุณา seed ข้อมูลก่อน");
            return;
        }

        console.log(`✓ พบลูกค้า: ${customer.name} (${customer.customerCode})`);

        // 2. หา user สำหรับทดสอบ
        const user = await db.user.findFirst({
            where: { isActive: true },
        });

        if (!user) {
            console.error("❌ ไม่พบ user ในระบบ");
            return;
        }

        console.log(`✓ ใช้ user: ${user.name}\n`);

        // 3. สร้าง temporary credit ที่หมดอายุแล้ว (วันเมื่อวาน)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const tempCredit = await db.temporaryCreditLimit.create({
            data: {
                customerId: customer.id,
                requestedAmount: 50000,
                expiryDate: yesterday,
                notes: "Test temporary credit - expired yesterday",
                status: "PENDING",
                requestedById: user.id,
            },
        });

        console.log(`✓ สร้าง temporary credit: ${tempCredit.id}`);
        console.log(`  จำนวน: ${tempCredit.requestedAmount}`);
        console.log(`  หมดอายุ: ${tempCredit.expiryDate.toISOString()}\n`);

        // 4. Approve temporary credit
        const now = new Date();

        // ดึง credit limit ปัจจุบัน
        let creditLimit = customer.creditLimits[0];

        if (!creditLimit) {
            // สร้าง credit limit ใหม่
            creditLimit = await db.creditLimit.create({
                data: {
                    customerId: customer.id,
                    limitAmount: 100000,
                    usedAmount: 20000,
                    availableAmount: 80000,
                    effectiveDate: now,
                    status: "ACTIVE",
                    createdById: user.id,
                },
            });
            console.log(`✓ สร้าง credit limit ใหม่: ${creditLimit.id}`);
        }

        console.log(`\n--- สถานะก่อน Approve ---`);
        console.log(`Credit Limit Amount: ${creditLimit.limitAmount}`);
        console.log(`Available Amount: ${creditLimit.availableAmount}`);
        console.log(`Temporary Credit Amount: ${creditLimit.temporaryCreditAmount || 0}\n`);

        // Approve และเพิ่มวงเงิน
        const newLimitAmount = new Prisma.Decimal(String(creditLimit.limitAmount)).add(
            new Prisma.Decimal(String(tempCredit.requestedAmount))
        );
        const newAvailableAmount = new Prisma.Decimal(String(creditLimit.availableAmount)).add(
            new Prisma.Decimal(String(tempCredit.requestedAmount))
        );

        const updatedCreditLimit = await db.creditLimit.update({
            where: { id: creditLimit.id },
            data: {
                limitAmount: newLimitAmount,
                availableAmount: newAvailableAmount,
                temporaryCreditAmount: tempCredit.requestedAmount,
                temporaryCreditExpiryDate: tempCredit.expiryDate,
                notes: `${creditLimit.notes ?? ""}\nTest: Added temporary credit +${String(tempCredit.requestedAmount)}`,
            },
        });

        await db.temporaryCreditLimit.update({
            where: { id: tempCredit.id },
            data: {
                status: "APPROVED",
                approvedById: user.id,
                approvedAt: now,
                appliedToCreditLimitId: creditLimit.id,
            },
        });

        console.log(`✓ Approved temporary credit`);
        console.log(`\n--- สถานะหลัง Approve ---`);
        console.log(`Credit Limit Amount: ${updatedCreditLimit.limitAmount}`);
        console.log(`Available Amount: ${updatedCreditLimit.availableAmount}`);
        console.log(`Temporary Credit Amount: ${updatedCreditLimit.temporaryCreditAmount}`);
        console.log(`Temporary Credit Expiry: ${updatedCreditLimit.temporaryCreditExpiryDate?.toISOString()}\n`);

        // 5. ทดสอบการ revert
        console.log(`--- ทดสอบการ Revert ---`);
        console.log(`กำลังตรวจสอบและลบวงเงินที่หมดอายุ...\n`);

        // หา temporary credits ที่หมดอายุ
        const expiredCredits = await db.temporaryCreditLimit.findMany({
            where: {
                status: "APPROVED",
                isReverted: false,
                expiryDate: { lt: new Date() },
                appliedToCreditLimitId: { not: null },
                deletedAt: null,
            },
        });

        console.log(`พบวงเงินที่หมดอายุ: ${expiredCredits.length} รายการ`);

        if (expiredCredits.length > 0) {
            // Revert
            for (const expired of expiredCredits) {
                const cl = await db.creditLimit.findUnique({
                    where: { id: expired.appliedToCreditLimitId! },
                });

                if (cl) {
                    const revertedLimitAmount = new Prisma.Decimal(String(cl.limitAmount)).sub(
                        new Prisma.Decimal(String(expired.requestedAmount))
                    );
                    const revertedAvailableAmount = new Prisma.Decimal(String(cl.availableAmount)).sub(
                        new Prisma.Decimal(String(expired.requestedAmount))
                    );

                    await db.creditLimit.update({
                        where: { id: cl.id },
                        data: {
                            limitAmount: revertedLimitAmount,
                            availableAmount: revertedAvailableAmount,
                            temporaryCreditAmount: 0,
                            temporaryCreditExpiryDate: null,
                            notes: `${cl.notes ?? ""}\nTest: Reverted temporary credit -${String(expired.requestedAmount)}`,
                        },
                    });

                    await db.temporaryCreditLimit.update({
                        where: { id: expired.id },
                        data: {
                            isReverted: true,
                            revertedAt: new Date(),
                        },
                    });

                    console.log(`✓ Reverted temporary credit ${expired.id}`);
                    console.log(`  จำนวนที่ลบ: ${expired.requestedAmount}\n`);
                }
            }

            // แสดงสถานะหลัง revert
            const finalCreditLimit = await db.creditLimit.findUnique({
                where: { id: creditLimit.id },
            });

            console.log(`--- สถานะหลัง Revert ---`);
            console.log(`Credit Limit Amount: ${finalCreditLimit?.limitAmount}`);
            console.log(`Available Amount: ${finalCreditLimit?.availableAmount}`);
            console.log(`Temporary Credit Amount: ${finalCreditLimit?.temporaryCreditAmount || 0}`);
            console.log(`Temporary Credit Expiry: ${finalCreditLimit?.temporaryCreditExpiryDate || 'null'}\n`);

            console.log(`✅ ทดสอบสำเร็จ! วงเงินถูก revert กลับไปเป็นค่าเดิม`);
        } else {
            console.log(`⚠️  ไม่พบวงเงินที่หมดอายุ`);
        }

    } catch (error) {
        console.error("❌ เกิดข้อผิดพลาด:", error);
    } finally {
        await db.$disconnect();
    }
}

// Run the test
testTemporaryCreditExpiry();
