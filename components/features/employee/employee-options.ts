// Employee form options constants
export const prefixOptions = [
  { value: "นาย", label: "นาย" },
  { value: "นาง", label: "นาง" },
  { value: "นางสาว", label: "นางสาว" },
];

export const statusOptions = [
  { value: "ACTIVE", label: "ปฏิบัติงาน" },
  { value: "ON_LEAVE", label: "ลาพัก" },
  { value: "INACTIVE", label: "ออกจากงาน" },
];

export const departmentOptions = [
  "การตลาด",
  "ขาย",
  "บัญชี",
  "บุคคล",
  "IT",
  "ฝ่ายผลิต",
  "จัดส่ง",
  "บริการลูกค้า",
  "บริหาร",
  "อื่นๆ",
].map((d) => ({ value: d, label: d }));

export const positionOptions = [
  { value: "ผู้บริหารระดับสูง", label: "ผู้บริหารระดับสูง" },
  { value: "ผู้จัดการ", label: "ผู้จัดการ" },
  { value: "หัวหน้างาน", label: "หัวหน้างาน" },
  { value: "พนักงานปฏิบัติการ", label: "พนักงานปฏิบัติการ" },
];

export const companyOptions = [
  {
    value: "บริษัท อินเตอร์ คร็อพ จำกัด",
    label: "บริษัท อินเตอร์ คร็อพ จำกัด",
  },
  {
    value: "บริษัท แอ็กโฟรีแพ็กซ์ อินดัสตรีส์ จำกัด",
    label: "บริษัท แอ็กโฟรีแพ็กซ์ อินดัสตรีส์ จำกัด",
  },
  { value: "บริษัท ยูนิพรีมา จำกัด", label: "บริษัท ยูนิพรีมา จำกัด" },
  {
    value: "บริษัท เอแม็กซ์ อินเตอร์ จำกัด",
    label: "บริษัท เอแม็กซ์ อินเตอร์ จำกัด",
  },
  {
    value: "บริษัท บีแฟค อินเตอร์ จำกัด",
    label: "บริษัท บีแฟค อินเตอร์ จำกัด",
  },
  {
    value: "บริษัท ซีเพซ อินเตอร์ จำกัด",
    label: "บริษัท ซีเพซ อินเตอร์ จำกัด",
  },
  { value: "บริษัท คร็อพ ซายน์ จำกัด", label: "บริษัท คร็อพ ซายน์ จำกัด" },
];

export const responsibilityAreaOptions = [
  { value: "ภาคเหนือ", label: "ภาคเหนือ" },
  { value: "ภาคตะวันออกเฉียงเหนือ", label: "ภาคตะวันออกเฉียงเหนือ" },
  { value: "ภาคตะวันตก", label: "ภาคตะวันตก" },
  { value: "ภาคกลาง", label: "ภาคกลาง" },
  { value: "ภาคใต้", label: "ภาคใต้" },
];