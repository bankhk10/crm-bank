/**
 * Login Announcement Module
 * Post-login popup announcements managed by Admin.
 */

// Server Actions
export {
  listAnnouncementsAction,
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
  toggleAnnouncementActiveAction,
  reorderAnnouncementAction,
  getMyAnnouncementsAction,
} from "./server/actions";

// Types
export type { LoginAnnouncementItem } from "./infrastructure/login-announcement.repository";
export type {
  CreateAnnouncementInput,
  UpdateAnnouncementInput,
} from "./application";
