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
  "วิชัย",
  "นิภา",
  "รัตนา",
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

const cropTypesList = [
  "ข้าว",
  "อ้อย",
  "มันสำปะหลัง",
  "ข้าวโพด",
  "ปาล์มน้ำมัน",
  "ยางพารา",
  "ผลไม้",
];

const shopNames = [
  "ร้านเกษตรสมบูรณ์",
  "ร้านเคมีภัณฑ์เจริญ",
  "ร้านปุ๋ยไทย",
  "ร้านเกษตรกรรม",
  "ร้านสหกรณ์",
];

const serviceTypesList = [
  "จัดหาเกษตรกร",
  "ให้คำปรึกษา",
  "จัดส่งสินค้า",
  "รับซื้อผลผลิต",
];

const brandNames = [
  "ดาวเกษตร",
  "ปัญญาเกษตร",
  "เกษตรเจริญ",
  "ไทยเกษตร",
  "สยามเคมี",
];

export type BrokerRandomPayload = {
  customerCode?: string;
  prefix?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
  cropTypes?: string;
  currentYield?: string;
  farmerCount?: string;
  plotCount?: string;
  totalAreaRai?: string;
  harvestPerYear?: string;
  creditDays?: string;
  chemicalValuePerCycle?: string;
  chemicalQtyPerCycle?: string;
  regularShops?: string;
  serviceTypes?: string;
  usedBrands?: string;
  notes?: string;
};

export function generateRandomBroker(
  overrides: Partial<BrokerRandomPayload> = {}
): BrokerRandomPayload {
  const personPrefix = rand(prefixes);
  const firstName = rand(firstNames);
  const lastName = rand(lastNames);
  const phone = `0${Math.floor(Math.random() * 9) + 6}${randNumberString(8)}`;
  const email = `${(firstName + lastName)
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()}${Math.floor(Math.random() * 900 + 100)}@example.com`;

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
  )} หมู่ ${Math.ceil(Math.random() * 15)} ต.${subdistrict} อ.${district}`;

  // สุ่มข้อมูลเฉพาะของ Broker
  const cropTypes = [rand(cropTypesList), rand(cropTypesList)]
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");
  const farmerCount = String(Math.floor(Math.random() * 50) + 10);
  const plotCount = String(Math.floor(Math.random() * 100) + 20);
  const totalAreaRai = String(Math.floor(Math.random() * 500) + 100);
  const harvestPerYear = String(Math.floor(Math.random() * 3) + 1);
  const creditDays = String([30, 45, 60, 90][Math.floor(Math.random() * 4)]);
  const chemicalValuePerCycle = String(
    Math.floor(Math.random() * 500000) + 100000
  );
  const chemicalQtyPerCycle = String(Math.floor(Math.random() * 100) + 20);
  const regularShops = [rand(shopNames), rand(shopNames)]
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");
  const serviceTypes = [rand(serviceTypesList), rand(serviceTypesList)]
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");
  const usedBrands = [rand(brandNames), rand(brandNames)]
    .filter((v, i, a) => a.indexOf(v) === i)
    .join(", ");

  // สร้างวันเกิดสุ่ม (อายุประมาณ 30-60 ปี)
  const yearBirth = new Date().getFullYear() - (30 + Math.floor(Math.random() * 30));
  const monthBirth = Math.floor(Math.random() * 12) + 1;
  const dayBirth = Math.floor(Math.random() * 28) + 1;
  const birthDate = `${yearBirth}-${String(monthBirth).padStart(2, "0")}-${String(dayBirth).padStart(2, "0")}`;

  const payload: BrokerRandomPayload = {
    prefix: personPrefix,
    firstName,
    lastName,
    birthDate,
    phone,
    email,
    addressLine,
    province,
    district,
    subdistrict,
    postalCode,
    cropTypes,
    currentYield: String(Math.floor(Math.random() * 100) + 50),
    farmerCount,
    plotCount,
    totalAreaRai,
    harvestPerYear,
    creditDays,
    chemicalValuePerCycle,
    chemicalQtyPerCycle,
    regularShops,
    serviceTypes,
    usedBrands,
    notes: `นายหน้าทดสอบ - ${firstName} ${lastName}`,
    ...overrides,
  };

  // ensure postalCode is string
  if (typeof payload.postalCode === "number")
    payload.postalCode = String(payload.postalCode);

  return payload;
}

export default generateRandomBroker;
