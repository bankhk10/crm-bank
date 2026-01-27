/**
 * Next.js Instrumentation
 * ไฟล์นี้จะถูกเรียกเมื่อ server เริ่มต้น
 * ใช้สำหรับเริ่มต้น background services
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Suppress DEP0169 (url.parse deprecation) warnings from legacy dependencies
    const originalEmitWarning = process.emitWarning;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    process.emitWarning = (warning: string | Error, ...args: any[]) => {
      if (
        typeof warning === "object" &&
        warning &&
        "code" in warning &&
        warning.code === "DEP0169"
      ) {
        return;
      }
      if (typeof warning === "string" && warning.includes("url.parse")) {
        return;
      }
      return originalEmitWarning.call(process, warning, ...args);
    };

    // Import และเริ่มต้น services
    const { initializeServices } = await import("./lib/init-services");
    initializeServices();
  }
}
