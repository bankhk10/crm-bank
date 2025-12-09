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

const cropTypes = [
  "ข้าว",
  "อ้อย",
  "มันสำปะหลัง",
  "ข้าวโพด",
  "ปาล์มน้ำมัน",
  "ยางพารา",
  "ผลไม้",
  "ถั่วเหลือง",
];

const varieties = [
  "พันธุ์ไทย",
  "พันธุ์ลูกผสม",
  "พันธุ์ปรับปรุง",
  "พันธุ์ท้องถิ่น",
];

const soilTypes = [
  "ดินร่วน",
  "ดินเหนียว",
  "ดินทราย",
  "ดินร่วนปนทราย",
  "ดินร่วนปนเหนียว",
];

const waterSources = [
  "น้ำฝน",
  "แม่น้ำ",
  "คลอง",
  "บ่อบาดาล",
  "ระบบชลประทาน",
  "สระน้ำ",
];

type FarmPlot = {
  latitude?: string;
  longitude?: string;
  areaRai?: string;
  cropType?: string;
  variety?: string;
  soilType?: string;
  waterSource?: string;
};

export type FarmerRandomPayload = {
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
  farmPlots?: FarmPlot[];
  notes?: string;
};

export function generateRandomFarmer(
  overrides: Partial<FarmerRandomPayload> = {}
): FarmerRandomPayload {
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

  // สร้างวันเกิดสุ่ม (อายุประมาณ 25-65 ปี)
  const yearBirth = new Date().getFullYear() - (25 + Math.floor(Math.random() * 40));
  const monthBirth = Math.floor(Math.random() * 12) + 1;
  const dayBirth = Math.floor(Math.random() * 28) + 1;
  const birthDate = `${yearBirth}-${String(monthBirth).padStart(2, "0")}-${String(dayBirth).padStart(2, "0")}`;

  // สร้างข้อมูลแปลงเกษตร 1-3 แปลง
  const plotCount = Math.floor(Math.random() * 3) + 1;
  const farmPlots: FarmPlot[] = [];
  
  for (let i = 0; i < plotCount; i++) {
    const baseLat = 13.0 + Math.random() * 7; // ละติจูดในประเทศไทย
    const baseLng = 99.0 + Math.random() * 6; // ลองจิจูดในประเทศไทย
    
    farmPlots.push({
      latitude: baseLat.toFixed(6),
      longitude: baseLng.toFixed(6),
      areaRai: String(Math.floor(Math.random() * 50) + 5),
      cropType: rand(cropTypes),
      variety: rand(varieties),
      soilType: rand(soilTypes),
      waterSource: rand(waterSources),
    });
  }

  const payload: FarmerRandomPayload = {
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
    farmPlots,
    notes: `เกษตรกรทดสอบ - ${firstName} ${lastName}`,
    ...overrides,
  };

  // ensure postalCode is string
  if (typeof payload.postalCode === "number")
    payload.postalCode = String(payload.postalCode);

  return payload;
}

export default generateRandomFarmer;
