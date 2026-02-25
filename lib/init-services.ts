/**
 * Server initialization script
 * เริ่มต้น background services เมื่อ server start
 */

import { temporaryCreditExpiryService } from "./services/temporary-credit-expiry.service";
import { invalidateAllSessions } from "@/modules/auth/application/force-logout.service";

let isInitialized = false;

export function initializeServices() {
  if (isInitialized) {
    console.log("Services already initialized");
    return;
  }

  console.log("Initializing background services...");

  // Force logout all users on application startup
  invalidateAllSessions().catch((error) => {
    console.error("Failed to invalidate sessions on startup:", error);
  });

  // เริ่มต้น temporary credit expiry service
  temporaryCreditExpiryService.start();

  isInitialized = true;
  console.log("Background services initialized successfully");
}

// Auto-initialize when this module is imported
if (typeof window === "undefined") {
  // Only run on server-side
  initializeServices();
}
