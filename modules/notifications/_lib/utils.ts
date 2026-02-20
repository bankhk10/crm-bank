import type { Notification } from "../_types/types";

export function getNotificationLink(
  n: Notification,
  canApproveSale: boolean
): string | null {
  // If manager with approve permission and notification is about sale pending approval
  // Navigate to approval page instead of detail page
  if (canApproveSale && n.link) {
    // Check if this is a sale-related notification that needs approval
    const saleMatch = n.link.match(/\/sales\/([^/]+)$/);

    if (saleMatch) {
      const saleId = saleMatch[1];
      // Check if notification indicates pending status (waiting for approval)
      const isPendingApproval =
        n.title.toLowerCase().includes("PENDING_APPROVAL") ||
        n.title.includes("รออนุมัติ") ||
        n.message.toLowerCase().includes("PENDING_APPROVAL") ||
        n.message.includes("รออนุมัติ") ||
        n.type === "WARNING";
      if (isPendingApproval) {
        return `/sales/${saleId}/approve`;
      }
    }
  }
  return n.link || null;
}
