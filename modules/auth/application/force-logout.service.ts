/**
 * Force Logout Service
 * บริการสำหรับบังคับให้ผู้ใช้ทั้งหมด logout เมื่อเริ่มต้น application
 */

import { db } from "@/lib/db";

// Session version ใช้สำหรับบังคับ logout ทุกครั้งที่มีการเปลี่ยนแปลง
let currentSessionVersion: string | null = null;

/**
 * ดึง session version ปัจจุบันจาก database
 */
async function getCurrentSessionVersion(): Promise<string> {
  if (currentSessionVersion) {
    return currentSessionVersion;
  }

  try {
    // ใช้ User table เพื่อเก็บ session version ใน field ที่มีอยู่แล้ว
    // หรือสร้าง system config ถ้าจำเป็น
    const systemConfig = await db.user.findFirst({
      where: { email: "system@session.version" },
      select: { updatedAt: true },
    });

    if (systemConfig) {
      currentSessionVersion = systemConfig.updatedAt.getTime().toString();
    } else {
      // สร้าง system config record ถ้ายังไม่มี
      const now = new Date();
      await db.user.create({
        data: {
          email: "system@session.version",
          name: "System Session Version",
          password: "system", // ไม่ต้องการความปลอดภัยจริง
          isActive: false,
        },
      });
      currentSessionVersion = now.getTime().toString();
    }
  } catch (error) {
    console.error("Error getting session version:", error);
    // Fallback: ใช้ timestamp ปัจจุบัน
    currentSessionVersion = Date.now().toString();
  }

  return currentSessionVersion!;
}

/**
 * บังคับให้ session ทั้งหมดหมดอายุโดยการอัปเดต session version
 */
export async function invalidateAllSessions(): Promise<void> {
  try {
    console.log("Invalidating all user sessions...");

    // อัปเดต session version โดยการอัปเดต updatedAt ของ system config
    await db.user.updateMany({
      where: { email: "system@session.version" },
      data: { updatedAt: new Date() },
    });

    // Reset cache
    currentSessionVersion = null;

    console.log("All sessions invalidated successfully");
  } catch (error) {
    console.error("Error invalidating sessions:", error);
    throw error;
  }
}

/**
 * ตรวจสอบว่า session ยังถูกต้องหรือไม่
 */
export async function isSessionValid(
  sessionVersion?: string,
): Promise<boolean> {
  if (!sessionVersion) {
    return false;
  }

  const currentVersion = await getCurrentSessionVersion();
  return sessionVersion === currentVersion;
}

/**
 * ดึง session version ปัจจุบันสำหรับเก็บใน JWT token
 */
export async function getSessionVersion(): Promise<string> {
  return await getCurrentSessionVersion();
}
