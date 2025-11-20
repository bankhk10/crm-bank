import provincesJson from "@/data/thai-province-data/province_with_district_and_sub_district.json";

type SubDistrict = { name_th: string; zip_code?: number };
type District = { name_th: string; sub_districts?: SubDistrict[] };
type ProvinceObj = { name_th: string; districts?: District[] };

const provincesData = provincesJson as ProvinceObj[];

function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randNumberString(length: number) {
  let s = "";
  for (let i = 0; i < length; i++) s += String(Math.floor(Math.random() * 10));
  return s;
}

const prefixes = ["นาย", "นางสาว", "นาง"];
const firstNames = [
  "สมชาย",
  "สมหญิง",
  "กิตติ",
  "อรทัย",
  "จิราภรณ์",
  "อนุชา",
  "วรพล",
  "ธนภัทร",
  "ณัฐพล",
  "สุดารัตน์",
];
const lastNames = [
  "ศรีสวัสดิ์",
  "ประเสริฐ",
  "จันทร์อ่อน",
  "กาญจนกิจ",
  "บุญมาก",
  "ชัยชนะ",
  "ทรัพย์สมบัติ",
  "รัตนสุข",
  "ประดิษฐ์",
  "วัฒนารักษ์",
];

export type EmployeeRandomPayload = {
  prefix?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  birthDate?: string; // YYYY-MM-DD
  employeeCode?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  password?: string;
};

export function generateRandomEmployee(overrides: Partial<EmployeeRandomPayload> = {}): EmployeeRandomPayload {
  const prefix = rand(prefixes);
  const firstName = rand(firstNames);
  const lastName = rand(lastNames);
  const short = `${firstName}${lastName}`.replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const email = `${short}${Math.floor(Math.random() * 900 + 100)}@example.com`;
  const phone = `0${Math.floor(Math.random() * 2) + 6}${randNumberString(8)}`; // 06/07/08/09-ish

  // birth date between 22 and 55 years old
  const now = new Date();
  const age = Math.floor(Math.random() * (55 - 22 + 1)) + 22;
  const year = now.getFullYear() - age;
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const birthDate = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const provObj = provincesData.length ? rand(provincesData) : undefined;
  const districtObj = provObj?.districts && provObj.districts.length ? rand(provObj.districts) : undefined;
  const subObj = districtObj?.sub_districts && districtObj.sub_districts.length ? rand(districtObj.sub_districts) : undefined;

  const province = provObj?.name_th ?? "กรุงเทพมหานคร";
  const district = districtObj?.name_th ?? `อำเภอ${Math.floor(Math.random() * 100)}`;
  const subdistrict = subObj?.name_th ?? `ตำบล${Math.floor(Math.random() * 100)}`;
  const postalCode = subObj?.zip_code ? String(subObj.zip_code) : (10000 + Math.floor(Math.random() * 80000)).toString().slice(0, 5);
  const addressLine = `บ้านเลขที่ ${Math.ceil(Math.random() * 200)} ซอยสุทธิสาร ต.${subdistrict} อ.${district}`;

  // Build a sanitized payload: only include known keys and copy overrides safely
  const base: EmployeeRandomPayload = {
    prefix,
    firstName,
    lastName,
    email,
    phone,
    birthDate,
    employeeCode: `EMP${randNumberString(5)}`,
    addressLine,
    province,
    district,
    subdistrict,
    postalCode,
    password: `P@ss${randNumberString(6)}`,
  };

  const allowedKeys: (keyof EmployeeRandomPayload)[] = [
    "prefix",
    "firstName",
    "lastName",
    "email",
    "phone",
    "birthDate",
    "employeeCode",
    "addressLine",
    "province",
    "district",
    "subdistrict",
    "postalCode",
    "password",
  ];

  const sanitized: EmployeeRandomPayload = { ...base };

  for (const k of allowedKeys) {
    if (typeof overrides[k] !== "undefined" && overrides[k] !== null) {
      // coerce postalCode to string if provided as number
      if (k === "postalCode") sanitized.postalCode = String(overrides.postalCode);
      else (sanitized as any)[k] = overrides[k];
    }
  }

  return sanitized;
}

export default generateRandomEmployee;
