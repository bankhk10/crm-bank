/**
 * Next.js Instrumentation
 * ไฟล์นี้จะถูกเรียกเมื่อ server เริ่มต้น
 * ใช้สำหรับเริ่มต้น background services
 */

export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        // Import และเริ่มต้น services
        const { initializeServices } = await import("./lib/init-services");
        initializeServices();
    }
}
