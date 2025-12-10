/**
 * Server initialization script
 * เริ่มต้น background services เมื่อ server start
 */

import { temporaryCreditExpiryService } from "./services/temporary-credit-expiry.service";

let isInitialized = false;

export function initializeServices() {
    if (isInitialized) {
        console.log("Services already initialized");
        return;
    }

    console.log("Initializing background services...");

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
