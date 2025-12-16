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

const shopPrefixes = ["ร้าน", "ห้างหุ้นส่วน", "บจก."];
const shopNames = [
  "เกษตรสมบูรณ์",
  "เคมีภัณฑ์เจริญ",
  "ปุ๋ยไทย",
  "เกษตรกรรม",
  "สหกรณ์การเกษตร",
  "เกษตรแม่น้ำ",
  "ไร่นาสวน",
  "เกษตรภูมิภาค",
  "ปุ๋ยพืชผล",
  "เคมีการเกษตร",
  "เกษตรอินทรีย์",
  "ไร่สวนผสม",
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
  "ประยุทธ์",
  "สุภาพร",
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
];

const cropsList = [
  "ข้าว",
  "อ้อย",
  "มันสำปะหลัง",
  "ข้าวโพด",
  "ปาล์มน้ำมัน",
  "ยางพารา",
];

const productsList = [
  "ปุ๋ยเคมี",
  "สารเคมีกำจัดศัตรูพืช",
  "ฮอร์โมนพืช",
  "สารควบคุมการเจริญเติบโต",
];

const brandsList = [
  "ดาวเกษตร",
  "ปัญญาเกษตร",
  "เกษตรเจริญ",
  "ไทยเกษตร",
  "สยามเคมี",
];

const areaTypes = ["ชนบท", "เมือง", "กึ่งชนบทกึ่งเมือง"];

export type SubdealerRandomPayload = {
  customerCode?: string;
  companyName?: string;
  taxId?: string;
  phone?: string;
  email?: string;
  latitude?: string;
  longitude?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  contactPhone?: string;
  contactEmail?: string;
  receiveFromDealer?: string;
  mainCompetitor?: string;
  areaCrops?: string;
  averageMonthlyPurchase?: string;
  mainProductSold?: string[];
  brandsSold?: string[];
  areaType?: string;
  relationshipScore?: number;
  notes?: string;
};

export function generateRandomSubdealer(
  overrides: Partial<SubdealerRandomPayload> = {}
): SubdealerRandomPayload {
  const baseName = rand(shopNames);
  const prefix = rand(shopPrefixes);
  const companyName = `${prefix}${baseName}`;
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

  // พิกัด GPS สุ่ม
  const baseLat = 13.0 + Math.random() * 7;
  const baseLng = 99.0 + Math.random() * 6;
  const latitude = baseLat.toFixed(6);
  const longitude = baseLng.toFixed(6);

  const personPrefix = rand(prefixes);
  const firstName = rand(firstNames);
  const lastName = rand(lastNames);
  const contactPhone = `0${Math.floor(Math.random() * 9) + 6}${randNumberString(
    8
  )}`;
  const contactEmail = `${(firstName + lastName)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()}${Math.floor(Math.random() * 900 + 100)}@example.com`;

  // สร้างวันเกิดสุ่ม (อายุประมาณ 25-60 ปี)
  const yearBirth = new Date().getFullYear() - (25 + Math.floor(Math.random() * 35));
  const monthBirth = Math.floor(Math.random() * 12) + 1;
  const dayBirth = Math.floor(Math.random() * 28) + 1;
  const birthDate = `${yearBirth}-${String(monthBirth).padStart(2, "0")}-${String(dayBirth).padStart(2, "0")}`;

  // ข้อมูลเฉพาะของ Subdealer
  const areaCrops = [rand(cropsList), rand(cropsList)]
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");
  const mainProductSold = [rand(productsList), rand(productsList)]
    .filter((v, i, a) => a.indexOf(v) === i);
  const brandsSold = [rand(brandsList), rand(brandsList)]
    .filter((v, i, a) => a.indexOf(v) === i);

  const payload: SubdealerRandomPayload = {
    companyName,
    taxId,
    phone,
    email,
    latitude,
    longitude,
    addressLine,
    province,
    district,
    subdistrict,
    postalCode,
    prefix: personPrefix,
    firstName,
    lastName,
    birthDate,
    contactPhone,
    contactEmail,
    receiveFromDealer: `รับสินค้าจาก ${rand(shopNames)}`,
    mainCompetitor: `คู่แข่ง: ${rand(shopNames)}`,
    areaCrops,
    averageMonthlyPurchase: String(Math.floor(Math.random() * 500000) + 50000),
    mainProductSold,
    brandsSold,
    areaType: rand(areaTypes),
    relationshipScore: Math.floor(Math.random() * 5) + 1,
    notes: `ตัวแทนจำหน่ายทดสอบ - ${baseName}`,
    ...overrides,
  };

  // ensure postalCode is string
  if (typeof payload.postalCode === "number")
    payload.postalCode = String(payload.postalCode);

  return payload;
}

export default generateRandomSubdealer;
