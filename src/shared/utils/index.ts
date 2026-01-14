/**
 * Shared Utilities
 * Re-exports all utility functions for convenient importing
 */

// Date utilities
export {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatTime,
  addDays,
  isPast,
  isToday,
  startOfDay,
  endOfDay,
  diffInDays,
} from "./date.utils";

// Currency utilities
export {
  formatCurrency,
  formatNumber,
  formatPercent,
  parseCurrency,
  roundTo,
  calculatePercent,
} from "./currency.utils";

// String utilities
export {
  getInitials,
  getSlug,
  truncate,
  capitalize,
  titleCase,
  cleanWhitespace,
  isEmpty,
  uid,
  mask,
} from "./string.utils";

// URL utilities
export {
  absoluteUrl,
  toAbsoluteUrl,
  buildQueryString,
  parseQueryString,
  joinPath,
} from "./url.utils";
