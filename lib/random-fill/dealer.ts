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

const companyPrefixes = ["บริษัท", "บจก.", "หจก."];
const companyNames = [
  "อัลฟ่า เทค",
  "เบต้า โซลูชัน",
  "กาม่า โปรดักท์",
  "ดีลต้า เซอร์วิส",
  "โซลาร์เน็ต",
  "ไอที คอนเน็ค",
  "สมาร์ทสตาร์",
  "ไทยโปรดักส์",
  "กรุ๊ป ซัพพลาย",
];

const prefixes = ["นาย", "นาง", "นางสาว"];
const firstNames = ["สมชาย", "สมหญิง", "กิตติ", "อรทัย", "จิราภรณ์", "อนุชา", "วรพล", "ธนภัทร", "ณัฐพล", "สุดารัตน์"];
const lastNames = ["ศรีสวัสดิ์", "ประเสริฐ", "จันทร์อ่อน", "กาญจนกิจ", "บุญมาก", "ชัยชนะ", "ทรัพย์สมบัติ", "รัตนสุข", "ประดิษฐ์", "วัฒนารักษ์"];

export type DealerRandomPayload = {
  customerCode?: string;
  name?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessNotes?: string;
  relationshipScore?: number;
};

export function generateRandomDealer(overrides: Partial<DealerRandomPayload> = {}): DealerRandomPayload {
  const baseName = rand(companyNames);
  const prefix = rand(companyPrefixes);
  const name = `${prefix} ${baseName}`;
  const short = baseName.split(" ")[0].replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const phone = `0${Math.floor(Math.random() * 9) + 6}${randNumberString(8)}`;
  const email = `${short}${Math.floor(Math.random() * 900 + 100)}@example.com`;
  const taxId = randNumberString(13);

  const provObj = provincesData.length ? rand(provincesData) : undefined;
  const districtObj = provObj?.districts && provObj.districts.length ? rand(provObj.districts) : undefined;
  const subObj = districtObj?.sub_districts && districtObj.sub_districts.length ? rand(districtObj.sub_districts) : undefined;

  const province = provObj?.name_th ?? "กรุงเทพมหานคร";
  const district = districtObj?.name_th ?? `อำเภอ${Math.floor(Math.random() * 100)}`;
  const subdistrict = subObj?.name_th ?? `ตำบล${Math.floor(Math.random() * 100)}`;
  const postalCode = subObj?.zip_code ? String(subObj.zip_code) : (10000 + Math.floor(Math.random() * 80000)).toString().slice(0, 5);
  const addressLine = `เลขที่ ${Math.ceil(Math.random() * 200)} ถนนสุขสวัสดิ์ ต.${subdistrict} อ.${district}`;

  const personPrefix = rand(prefixes);
  const firstName = rand(firstNames);
  const lastName = rand(lastNames);
  const contactPhone = `0${Math.floor(Math.random() * 9) + 6}${randNumberString(8)}`;
  const contactEmail = `${(firstName + lastName).replace(/[^a-zA-Z0-9]/g, "").toLowerCase()}${Math.floor(Math.random() * 900 + 100)}@example.com`;

  const payload: DealerRandomPayload = {
    name,
    email,
    phone,
    taxId,
    addressLine,
    province,
    district,
    subdistrict,
    postalCode,
    prefix: personPrefix,
    firstName,
    lastName,
    contactPhone,
    contactEmail,
    businessNotes: `ลูกค้าทดสอบ - ${baseName}`,
    relationshipScore: Math.floor(Math.random() * 5) + 1,
    ...overrides,
  };

  // ensure postalCode is string
  if (typeof payload.postalCode === "number") payload.postalCode = String(payload.postalCode);

  return payload;
}

export default generateRandomDealer;
