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
  "เอปซิลอน กรุ๊ป",
  "โอเมก้า เทรดดิ้ง",
  "สยาม ดิจิตอล",
  "ฟิวเจอร์ วิชั่น",
  "โกลบอล ซิสเต็ม",
  "เน็กซ์ เจน เน็ตเวิร์ค",
  "ไพร์ม โซลูชั่น",
  "โกลเด้น เกท",
  "ซิลเวอร์ พลัส",
  "ไซเบอร์ ลิงค์",
  "อีซี่ คอร์ป",
  "สตาร์ อินโนเวชั่น",
  "บลู โอเชียน",
  "กรีน เอ็นเนอร์จี",
  "ท็อป เทียร์ เทค",
  "วิสดอม ซอฟต์",
  "อินฟินิตี้ เวิลด์",
  "แมทริกซ์ ซัพพลาย",
  "พาวเวอร์ กริด",
  "ยูนิค ดีไซน์",
  "ออพติม่า เซอร์วิส",
];

const prefixes = ["นาย", "นาง", "นางสาว"];
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
  billingAddressLine?: string;
  billingProvince?: string;
  billingDistrict?: string;
  billingSubdistrict?: string;
  billingPostalCode?: string;
  shippingAddressLine?: string;
  shippingProvince?: string;
  shippingDistrict?: string;
  shippingSubdistrict?: string;
  shippingPostalCode?: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  contactPhone?: string;
  contactEmail?: string;
  businessNotes?: string;
  relationshipScore?: number;
};

export function generateRandomDealer(
  overrides: Partial<DealerRandomPayload> = {}
): DealerRandomPayload {
  const baseName = rand(companyNames);
  const prefix = rand(companyPrefixes);
  const name = `${prefix} ${baseName}`;
  const short = baseName
    .split(" ")[0]
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  const phone = `0${Math.floor(Math.random() * 9) + 6}${randNumberString(8)}`;
  const email = `${short}${Math.floor(Math.random() * 900 + 100)}@example.com`;
  const taxId = randNumberString(13);

  const provObj = provincesData.length ? rand(provincesData) : undefined;
  const districtObj =
    provObj?.districts && provObj.districts.length
      ? rand(provObj.districts)
      : undefined;
  const subObj =
    districtObj?.sub_districts && districtObj.sub_districts.length
      ? rand(districtObj.sub_districts)
      : undefined;

  const province = provObj?.name_th ?? "กรุงเทพมหานคร";
  const district =
    districtObj?.name_th ?? `อำเภอ${Math.floor(Math.random() * 100)}`;
  const subdistrict =
    subObj?.name_th ?? `ตำบล${Math.floor(Math.random() * 100)}`;
  const postalCode = subObj?.zip_code
    ? String(subObj.zip_code)
    : (10000 + Math.floor(Math.random() * 80000)).toString().slice(0, 5);
  const addressLine = `เลขที่ ${Math.ceil(
    Math.random() * 200
  )} ถนนสุขสวัสดิ์ ต.${subdistrict} อ.${district}`;

  // billing address (either same area or separate random pick)
  const provObjB = provincesData.length ? rand(provincesData) : undefined;
  const districtObjB =
    provObjB?.districts && provObjB.districts.length
      ? rand(provObjB.districts)
      : undefined;
  const subObjB =
    districtObjB?.sub_districts && districtObjB.sub_districts.length
      ? rand(districtObjB.sub_districts)
      : undefined;
  const billingProvince = provObjB?.name_th ?? province;
  const billingDistrict =
    districtObjB?.name_th ?? `อำเภอ${Math.floor(Math.random() * 100)}`;
  const billingSubdistrict =
    subObjB?.name_th ?? `ตำบล${Math.floor(Math.random() * 100)}`;
  const billingPostalCode = subObjB?.zip_code
    ? String(subObjB.zip_code)
    : (10000 + Math.floor(Math.random() * 80000)).toString().slice(0, 5);
  const billingAddressLine = `เลขที่ ${Math.ceil(
    Math.random() * 200
  )} หมู่ ${Math.ceil(Math.random() * 15)} ต.${billingSubdistrict} อ.${billingDistrict}`;

  // shipping address (separate random pick)
  const provObjS = provincesData.length ? rand(provincesData) : undefined;
  const districtObjS =
    provObjS?.districts && provObjS.districts.length
      ? rand(provObjS.districts)
      : undefined;
  const subObjS =
    districtObjS?.sub_districts && districtObjS.sub_districts.length
      ? rand(districtObjS.sub_districts)
      : undefined;
  const shippingProvince = provObjS?.name_th ?? province;
  const shippingDistrict =
    districtObjS?.name_th ?? `อำเภอ${Math.floor(Math.random() * 100)}`;
  const shippingSubdistrict =
    subObjS?.name_th ?? `ตำบล${Math.floor(Math.random() * 100)}`;
  const shippingPostalCode = subObjS?.zip_code
    ? String(subObjS.zip_code)
    : (10000 + Math.floor(Math.random() * 80000)).toString().slice(0, 5);
  const shippingAddressLine = `เลขที่ ${Math.ceil(
    Math.random() * 200
  )} ถนนสุขุมวิท ต.${shippingSubdistrict} อ.${shippingDistrict}`;

  const personPrefix = rand(prefixes);
  const firstName = rand(firstNames);
  const lastName = rand(lastNames);
  const contactPhone = `0${Math.floor(Math.random() * 9) + 6}${randNumberString(
    8
  )}`;
  const contactEmail = `${(firstName + lastName)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()}${Math.floor(Math.random() * 900 + 100)}@example.com`;

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
    billingAddressLine,
    billingProvince,
    billingDistrict,
    billingSubdistrict,
    billingPostalCode,
    shippingAddressLine,
    shippingProvince,
    shippingDistrict,
    shippingSubdistrict,
    shippingPostalCode,
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
  if (typeof payload.postalCode === "number")
    payload.postalCode = String(payload.postalCode);

  return payload;
}

export default generateRandomDealer;
