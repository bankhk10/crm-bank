export type ProductRandomPayload = {
  productCode?: string;
  name?: string;
  commonName?: string;
  unit?: string;
  productGroup?: string;
  brand?: string;
  packageSize?: string;
  packageSizePerBox?: string;
  status?: "ACTIVE" | "INACTIVE";
  usedForPlants?: string[];
  salesPoint?: string;
  properties?: string;
};

const units = [
  "ขวด",
  "กล่อง",
  "ถัง",
  "แกลลอน",
  "กรัม",
  "กระปุก",
  "กิโลกรัม",
  "ลิตร",
  "ชิ้น",
  "กระสอบ",
  "ชุด",
  "ซอง",
];

const groups = ["SEP", "AMN", "ISPI", "24D", "ABA", "OTH"];
const brands = ["แบรนด์ X", "แบรนด์ Y", "แบรนด์ Z", "แบรนด์ Q"];
const productNames = [
  "ปุ๋ยสูตร A",
  "ยาฆ่าแมลง บี",
  "ฮอร์โมนพืช C",
  "สารบำรุงดิน D",
  "น้ำยาปรับสภาพดิน E",
  "เมล็ดพันธุ์ F",
];

function rand<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randNumberString(len = 4) {
  return Array.from({ length: len }, () => Math.floor(Math.random() * 10)).join(
    ""
  );
}

export function generateRandomProduct(
  overrides: Partial<ProductRandomPayload> = {}
): ProductRandomPayload {
  const name =
    rand(productNames) + " " + rand(["Premium", "Pro", "Standard", "Plus"]);
  const productCode = `P${Date.now().toString().slice(-6)}${randNumberString(
    3
  )}`;
  const payload: ProductRandomPayload = {
    productCode,
    name,
    commonName: name.split(" ")[0],
    unit: rand(units),
    productGroup: rand(groups),
    brand: rand(brands),
    packageSize: `${Math.floor(Math.random() * 1000) + 50} g`,
    packageSizePerBox: `${Math.floor(Math.random() * 20) + 1}`,
    status: "ACTIVE",
    usedForPlants: ["ยางพารา"],
    salesPoint: "สินค้าทดสอบ",
    properties: "คำอธิบายทดสอบสำหรับสินค้า",
    ...overrides,
  };

  return payload;
}

export default generateRandomProduct;
