export const MONTHS = [
  { value: 1, label: "มกราคม" },
  { value: 2, label: "กุมภาพันธ์" },
  { value: 3, label: "มีนาคม" },
  { value: 4, label: "เมษายน" },
  { value: 5, label: "พฤษภาคม" },
  { value: 6, label: "มิถุนายน" },
  { value: 7, label: "กรกฎาคม" },
  { value: 8, label: "สิงหาคม" },
  { value: 9, label: "กันยายน" },
  { value: 10, label: "ตุลาคม" },
  { value: 11, label: "พฤศจิกายน" },
  { value: 12, label: "ธันวาคม" },
];

export const REGIONS = [
  "ภาคเหนือ",
  "ภาคอีสาน",
  "ภาคตะวันออก",
  "ภาคตะวันตก",
  "ภาคกลาง",
  "ภาคใต้",
];

export const CURRENT_YEAR = new Date().getFullYear();
export const YEARS = Array.from({ length: 4 }, (_, i) => CURRENT_YEAR + i);
