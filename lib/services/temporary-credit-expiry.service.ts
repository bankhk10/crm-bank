/**
 * Background Service สำหรับตรวจสอบและลบวงเงินชั่วคราวที่หมดอายุ
 * 
 * Service นี้จะทำงานทุก ๆ 5 นาที เพื่อตรวจสอบและลบวงเงินชั่วคราวที่หมดอายุ
 * โดยอัตโนมัติ
 */

import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";

export class TemporaryCreditExpiryService {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning = false;

    // ตั้งค่าให้รันทุก 5 นาที (300000 ms)
    // private readonly INTERVAL_MS = 5 * 60 * 1000;
    private readonly INTERVAL_MS = 50 * 1000;

    /**
     * เริ่มต้น background service
     */
    start() {
        if (this.isRunning) {
            console.log("TemporaryCreditExpiryService is already running");
            return;
        }

        console.log("Starting TemporaryCreditExpiryService...");
        this.isRunning = true;

        // รันทันทีครั้งแรก
        this.processExpiredCredits();

        // ตั้งเวลาให้รันทุก ๆ interval
        this.intervalId = setInterval(() => {
            this.processExpiredCredits();
        }, this.INTERVAL_MS);

        console.log(`TemporaryCreditExpiryService started (interval: ${this.INTERVAL_MS / 1000}s)`);
    }

    /**
     * หยุด background service
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log("TemporaryCreditExpiryService stopped");
    }

    /**
     * ประมวลผลวงเงินชั่วคราวที่หมดอายุ
     */
    private async processExpiredCredits() {
        const startTime = Date.now();
        console.log(`[${new Date().toISOString()}] Processing expired temporary credits...`);

        try {
            const now = new Date();

            // หา temporary credit limits ที่หมดอายุแล้ว
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
                },
            });

            if (expiredTemporaryCredits.length === 0) {
                console.log("No expired temporary credits found");
                return;
            }

            console.log(`Found ${expiredTemporaryCredits.length} expired temporary credits to process`);

            // Process each expired temporary credit
            let successCount = 0;
            let failureCount = 0;

            for (const tempCredit of expiredTemporaryCredits) {
                try {
                    await db.$transaction(async (tx) => {
                        // ดึงข้อมูล CreditLimit ที่เกี่ยวข้อง
                        const creditLimit = await tx.creditLimit.findUnique({
                            where: { id: tempCredit.appliedToCreditLimitId! },
                        });

                        if (!creditLimit) {
                            console.error(`Credit limit not found for temporary credit ${tempCredit.id}`);
                            failureCount++;
                            return;
                        }

                        // คำนวณวงเงินใหม่ (ลบวงเงินชั่วคราวออก)
                        const newLimitAmount = (creditLimit.limitAmount as any).sub
                            ? (creditLimit.limitAmount as any).sub(tempCredit.requestedAmount as any)
                            : new Prisma.Decimal(String(creditLimit.limitAmount)).sub(
                                new Prisma.Decimal(String(tempCredit.requestedAmount))
                            );

                        const newAvailableAmount = (creditLimit.availableAmount as any).sub
                            ? (creditLimit.availableAmount as any).sub(tempCredit.requestedAmount as any)
                            : new Prisma.Decimal(String(creditLimit.availableAmount)).sub(
                                new Prisma.Decimal(String(tempCredit.requestedAmount))
                            );

                        // ตรวจสอบว่า availableAmount ไม่ติดลบ
                        if (newAvailableAmount.lessThan(0)) {
                            console.warn(
                                `Cannot revert temporary credit ${tempCredit.id}: would result in negative available amount`
                            );
                            failureCount++;
                            return;
                        }

                        // อัพเดท CreditLimit
                        await tx.creditLimit.update({
                            where: { id: creditLimit.id },
                            data: {
                                limitAmount: newLimitAmount,
                                availableAmount: newAvailableAmount,
                                temporaryCreditAmount: 0,
                                temporaryCreditExpiryDate: null,
                                notes: `${creditLimit.notes ?? ""}\nReverted temporary credit: -${String(tempCredit.requestedAmount)} (expired on ${tempCredit.expiryDate.toISOString()})`,
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

                        console.log(
                            `✓ Reverted temporary credit ${tempCredit.id} for customer ${tempCredit.customer.customerCode} (${tempCredit.customer.name}): -${String(tempCredit.requestedAmount)}`
                        );
                        successCount++;
                    });
                } catch (error) {
                    console.error(`Error processing temporary credit ${tempCredit.id}:`, error);
                    failureCount++;
                }
            }

            const duration = Date.now() - startTime;
            console.log(
                `[${new Date().toISOString()}] Completed processing expired temporary credits in ${duration}ms`
            );
            console.log(`  Success: ${successCount}, Failed: ${failureCount}`);
        } catch (error) {
            console.error("Error in processExpiredCredits:", error);
        }
    }

    /**
     * รันการประมวลผลทันที (สำหรับ manual trigger)
     */
    async runNow() {
        console.log("Manual trigger: processing expired credits now...");
        await this.processExpiredCredits();
    }
}

// Export singleton instance
export const temporaryCreditExpiryService = new TemporaryCreditExpiryService();
