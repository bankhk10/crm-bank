export type CompanyRandomPayload = {
  name: string;
  companyCode?: string;
  shortName?: string;
  email?: string;
  phone?: string;
  taxId?: string;
  addressLine?: string;
  province?: string;
  district?: string;
  subdistrict?: string;
  postalCode?: string;
};
import provincesJson from "@/data/thai-province-data/province_with_district_and_sub_district.json";

const companyPrefixes = ["บริษัท", "บจก.", "หจก.", "ธุกิจ"]; // simple prefixes
const names = [
  "อัลฟ่า เทค",
  "เบต้า โซลูชัน",
  "กาม่า โปรดักท์",
  "ดีลต้า เซอร์วิส",
  "อีโก้ อินโนเวชั่น",
  "โซลาร์เน็ต",
  "ไอที คอนเน็ค",
  "สมาร์ทสตาร์",
  "ไทยโปรดักส์",
  "กรุ๊ป ซัพพลาย",
];

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

export function generateRandomCompany(
  overrides: Partial<CompanyRandomPayload> = {}
): CompanyRandomPayload {
  const baseName = rand(names);
  const prefix = rand(companyPrefixes);
  const name = `${prefix} ${baseName}`;
  const companyCode = `COMP${randNumberString(4)}`;
  const shortName = baseName.split(" ")[0];
  const phone = `0${Math.floor(Math.random() * 9) + 6}${randNumberString(8)}`; // e.g. 08xxxxxxxx
  const email = `${shortName
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase()}@example.com`;
  const taxId = randNumberString(13);

  // pick a real province -> district -> subdistrict if available
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

  const payload: CompanyRandomPayload = {
    name,
    companyCode,
    shortName,
    email,
    phone,
    taxId,
    addressLine,
    province,
    district,
    subdistrict,
    postalCode,
    ...overrides,
  };

  return payload;
}
