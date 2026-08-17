// Master 11 work types list
export const WORK_TYPES = [
  "เข้าพบร้านค้า / Key Farmer",
  "ติดตามผลการใช้สินค้า",
  "เสนอขายสินค้า",
  "วางบิล / เก็บเงิน",
  "สำรวจตลาดของคู่แข่ง",
  "แก้ปัญหา / รับเรื่องร้องเรียน",
  "ติดตามแปลงสาธิต / ทำแปลง",
  "จัดประชุมการเกษตร / ดีลเลอร์ / ซับดีลเลอร์",
  "จัดกิจกรรมส่งเสริมการขายหน้าร้าน",
  "จัดงาน Field Day",
  "ตรวจเช็กสต็อกหน้าร้าน",
];

// Sample lists for dropdowns
export const DEMO_OWNERS = [
  "บริษัททดสอบ",
  "ร้านทดสอบ สาขา 1",
  "เกษตรกรตัวอย่าง 1",
  "ร้านสหายพานิช",
];

export const DEMO_PRODUCTS = [
  "สินค้าทดสอบ A",
  "สินค้าทดสอบ B",
  "สินค้าทดสอบ C",
  "ปุ๋ยเคมีสูตรพิเศษ",
];

export const DEMO_PRODUCT_PRICES: Record<string, number> = {
  "สินค้าทดสอบ A": 500,
  "สินค้าทดสอบ B": 750,
  "สินค้าทดสอบ C": 1200,
  ปุ๋ยเคมีสูตรพิเศษ: 950,
};

export const MARKETING_PRODUCT_CATEGORIES = [
  "Premium_item",
  "PP_Board",
  "Banner",
  "Leaflet",
  "อุปกรณ์จัดงาน",
  "อื่นๆ",
];

export interface MarketingProductOption {
  name: string;
  price: number;
  unit?: string;
}

export const MARKETING_PRODUCTS_BY_CATEGORY: Record<
  string,
  MarketingProductOption[]
> = {
  Premium_item: [
    { name: "สมุดฉีก", price: 25, unit: "เล่ม" },
    { name: 'ถุงผ้าสปันสีแดง "โลโก้ปืนใหญ่"', price: 35, unit: "ใบ" },
    { name: "เสื้อแขนยาว ปืนใหญ่ สีแดง", price: 250, unit: "ตัว" },
    { name: "เสื้อแขนยาว ปืนใหญ่ สีแดง 3XL", price: 270, unit: "ตัว" },
    { name: "หมวกคลุมหน้าสีแดง", price: 120, unit: "ใบ" },
    { name: "น้ำดื่มตราปืนใหญ่ แพคละ 24 ขวด", price: 60, unit: "แพค" },
    { name: "ถุงพลาสติกหูหิ้ว", price: 45, unit: "แพค" },
    { name: "แก้วแดง", price: 50, unit: "ใบ" },
    { name: "ที่เปิดขวดน้ำ", price: 20, unit: "อัน" },
    { name: "หมอนเทอรา-ซอร์บ เขียว", price: 180, unit: "ใบ" },
    { name: "หมอนเทอรา-ซอร์บ แดง", price: 180, unit: "ใบ" },
    { name: "ร่ม ตีกอล์ฟ 30 นิ้ว กัน UV", price: 350, unit: "คัน" },
    { name: "เสื้อลายสก๊อต", price: 280, unit: "ตัว" },
    {
      name: "น้ำยาล้างจาน ตราปืนใหญ่ บรรจุ 24 ซอง/ลัง",
      price: 240,
      unit: "ลัง",
    },
    { name: "สติ๊กเกอร์ปืนใหญ่ ขนาดใหญ่", price: 15, unit: "แผ่น" },
    { name: "ป้ายราคาพิเศษ", price: 10, unit: "แผ่น" },
    { name: "สติกเกอร์พรอมมิส", price: 15, unit: "แผ่น" },
    { name: "บัตรเชิญประชุมเกษตรกร", price: 5, unit: "ใบ" },
    { name: "คูปองจับสลาก ตราปืนใหญ่", price: 2, unit: "ใบ" },
    { name: "กล่องใสชุดฟ้าประธาน", price: 150, unit: "กล่อง" },
    { name: "ร่มชายหาด", price: 550, unit: "คัน" },
  ],
  PP_Board: [
    { name: "สติมเท็กซ์ โกลด์ (นาข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "สติมเพล็กซ์(ทุเรียน) ขนาด 60x80 ซม.", price: 120 },
    { name: "ควีแลนท์ ไมเนอร์(ทุเรียน) ขนาด 60x80 ซม.", price: 120 },
    { name: "ควีแลนท์ ไมเนอร์(ชมพู่) ขนาด 60x80 ซม.", price: 120 },
    { name: "ควีแลนท์ ไมเนอร์(ลำไย) ขนาด 60x80 ซม.", price: 120 },
    { name: "ควีแลนท์ แคลเซียม ขนาด 60x80 ซม.", price: 120 },
    { name: "เทอรา ซอร์บ ขนาด 60x80 ซม.", price: 120 },
    { name: "เทอรา ซอร์บ เรดิคูรา ขนาด 60x80 ซม.", price: 120 },
    { name: "สติมเพล็กซ์ แม็กซ์(นาข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "สติมเพล็กซ์ แม็กซ์(ผัก) ขนาด 60x80 ซม.", price: 120 },
    { name: "ชุดฟื้นทรัพย์ ขนาด 60x80 ซม.", price: 120 },
    { name: "ชุดเปิดทรัพย์ ขนาด 60x80 ซม.", price: 120 },
    { name: "ชุดเสริมทรัพย์ ขนาด 60x80 ซม.", price: 120 },
    { name: "ชุดออมทรัพย์ ขนาด 60x80 ซม.", price: 120 },
    { name: "ชุดรับทรัพย์ ขนาด 60x80 ซม.", price: 120 },
    { name: "แอพพรูพ 40 เอสซี ขนาด 60x80 ซม.", price: 120 },
    { name: "แฮกทริก ขนาด 60x80 ซม.", price: 120 },
    { name: "เทคนิค ขนาด 60x80 ซม.", price: 120 },
    { name: "เพอฟอร์ม ขนาด 60x80 ซม.", price: 120 },
    { name: "เพอฟอร์ม(ทุเรียน) ขนาด 60x80 ซม.", price: 120 },
    { name: "เพอฟอร์ม(ข้าวโพด) ขนาด 60x80 ซม.", price: 120 },
    { name: "พรอมมิส(ข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "โนม็อบ ขนาด 60x80 ซม.", price: 120 },
    { name: "พรอมมิส(นาข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "พรอมมิส(ข้าวโพด) ขนาด 60x80 ซม.", price: 120 },
    { name: "พรอมมิส(ทุเรียน) ขนาด 60x80 ซม.", price: 120 },
    { name: "พรอมมิส(ไม้ผล) ขนาด 60x80 ซม.", price: 120 },
    { name: "โรดแม็บ ขนาด 60x80 ซม.", price: 120 },
    { name: "ไรเบน ขนาด 60x80 ซม.", price: 120 },
    { name: "ไตรโซดริน ขนาด 60x80 ซม.", price: 120 },
    { name: "ไตรโซดริน(หนอนกอข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "ดิสแทนท์(ข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "ดิสแทนท์(ทุเรียน) ขนาด 60x80 ซม.", price: 120 },
    { name: "ดิสแทนท์+เพอฟอร์ม(ข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "ดิสแทนท์+เพอฟอร์ม(ข้าวโพด) ขนาด 60x80 ซม.", price: 120 },
    { name: "ดิสแทนท์+เพอฟอร์ม(ทุเรียน) ขนาด 60x80 ซม.", price: 120 },
    { name: "ดิสแทนท์+โรดแม็บ(ข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "ดิสแทนท์+โรดแม็บ(ทุเรียน) ขนาด 60x80 ซม.", price: 120 },
    { name: "เฟียร์ส ขนาด 60x80 ซม.", price: 120 },
    { name: "แฮพเพ่น ขนาด 60x80 ซม.", price: 120 },
    { name: "พังเจอร์ ขนาด 60x80 ซม.", price: 120 },
    { name: "เรดแน็พ ขนาด 60x80 ซม.", price: 120 },
    { name: "อะเวค ขนาด 60x80 ซม.", price: 120 },
    { name: "แฮตแทค ขนาด 40x60 ซม.", price: 90 },
    { name: "แฮตแทค ขนาด 60x80 ซม.", price: 120 },
    { name: "บีเฟซ ขนาด 60x80 ซม.", price: 120 },
    { name: "ซิกแนล ขนาด 60x80 ซม.", price: 120 },
    { name: "จัสคอล70 ขนาด 60x80 ซม.", price: 120 },
    { name: "โคชชิ่ง ขนาด 60x80 ซม.", price: 120 },
    { name: "คิวบีน ขนาด 60x80 ซม.", price: 120 },
    { name: "เอแลค ขนาด 60x80 ซม.", price: 120 },
    { name: "เฟสทีพ ขนาด 60x80 ซม.", price: 120 },
    { name: "ซัมมิท ขนาด 60x80 ซม.", price: 120 },
    { name: "ซัมมิท+จัสคอล70 ขนาด 60x80 ซม.", price: 120 },
    { name: "เซจคิว ขนาด 60x80 ซม.", price: 120 },
    { name: "เอ็กไซท์ 48 + พาเหรด 84 ขนาด 60x80 ซม.", price: 120 },
    { name: "เอ็กไซท์ 48 ขาว ขนาด 60x80 ซม.", price: 120 },
    { name: "เอ็กไซท์ 48 แดง ขนาด 60x80 ซม.", price: 120 },
    { name: "คีพเปอร์ ขนาด 60x80 ซม.", price: 120 },
    { name: "ไซบลาส ขนาด 60x80 ซม.", price: 120 },
    { name: "พาร์25 ขนาด 60x80 ซม.", price: 120 },
    { name: "ซีโตเร่ ขนาด 60x80 ซม.", price: 120 },
    { name: "เอมัส ขนาด 60x80 ซม.", price: 120 },
    { name: "บล็อกกิ้ง ขนาด 60x80 ซม.", price: 120 },
    { name: "ซูโด ขนาด 60x80 ซม.", price: 120 },
    { name: "คาบัน ขนาด 60x80 ซม.", price: 120 },
    { name: "ออเดรย์(นาข้าว) ขนาด 40x60 ซม.", price: 90 },
    { name: "ออเดรย์(ทุเรียน) ขนาด 40x60 ซม.", price: 90 },
    { name: "แลคเกอร์-พาวเวอร์ ขนาด 40x60 ซม.", price: 90 },
    { name: "โลโก้ปืนใหญ่ ขนาด 60x80 ซม.", price: 120 },
    { name: "มะม่วง ขนาด 60x80 ซม.", price: 120 },
    { name: "ชมพู่ ขนาด 60x80 ซม.", price: 120 },
    { name: "มังคุด ขนาด 60x80 ซม.", price: 120 },
    { name: "ลำไย ขนาด 60x80 ซม.", price: 120 },
    { name: "ผลิตภัณฑ์ตราปืนใหญ่เพื่อชาวไร่อ้อย ขนาด 80x110 ซม.", price: 180 },
    { name: "แตงโม ขนาด 80x110 ซม.", price: 180 },
    { name: "อลูฟอส(กระชาย) ขนาด 40x60 ซม.", price: 90 },
    { name: "บีทเทิล ขนาด 60x80 ซม.", price: 120 },
    { name: "กลูโฟซิเนต + แอมโมเนีย ขนาด 60x80 ซม.", price: 120 },
    { name: "เทคเคน ขนาด 60x80 ซม.", price: 120 },
    { name: "แฮตแทค + ไซโนอีส ขนาด 60x80 ซม.", price: 120 },
    { name: "คร็อพโทนิค (นาข้าว) ขนาด 60x80 ซม.", price: 120 },
    { name: "คร็อพโทนิค (ทุเรียน) ขนาด 60x80 ซม.", price: 120 },
    { name: "อัลเทอร่า-เค ขนาด 60x80 ซม.", price: 120 },
  ],
  Banner: [
    { name: "อลูฟอส ขนาด 1x2 เมตร", price: 250 },
    { name: "ควีแลนท์ ซิงค์แมงกานีส ขนาด 1x2 เมตร", price: 250 },
    { name: "ควีแลนท์ ไมเนอร์ ขนาด 1x2 เมตร", price: 250 },
    { name: "เทอรา-ซอร์บ เรดิคูรา ขนาด 1x2 เมตร", price: 250 },
    { name: "เทคนิค ขนาด 1x2 เมตร", price: 250 },
    { name: "เพอฟอร์ม(ข้าวโพด) ขนาด 1x2 เมตร", price: 250 },
    { name: "ดิสแทนท์(ข้าว) ขนาด 1x2 เมตร", price: 250 },
    { name: "ดิสแทนท์(ทุเรียน) ขนาด 1x2 เมตร", price: 250 },
    { name: "ดิสแทนท์+เพอฟอร์ม(ข้าวโพด) ขนาด 1x2 เมตร", price: 250 },
    { name: "ดิสแทนท์+เพอฟอร์ม(ข้าว) ขนาด 1x2 เมตร", price: 250 },
    { name: "ดิสแทนท์+เพอฟอร์ม(ทุเรียน) ขนาด 1x2 เมตร", price: 250 },
    { name: "ดิสแทนท์+โรดแม็บ(ข้าว) ขนาด 1x2 เมตร", price: 250 },
    { name: "แฮพเพ่น ขนาด 1x2 เมตร", price: 250 },
    { name: "เฟียร์ส ขนาด 1x2 เมตร", price: 250 },
    { name: "แฮตแทค ขนาด 1x2 เมตร", price: 250 },
    { name: "ซิกแนล ขนาด 1x2 เมตร", price: 250 },
    { name: "บีเฟซ ขนาด 1x2 เมตร", price: 250 },
    { name: "โคชชิ่ง ขนาด 1x2 เมตร", price: 250 },
    { name: "อัคคาบัน ขนาด 1x2 เมตร", price: 250 },
    { name: "บล็อกกิ้ง ขนาด 1x2 เมตร", price: 250 },
    { name: "ซูโด ขนาด 1x2 เมตร", price: 250 },
    { name: "โลโก้ปืนใหญ่ ขนาด 1x2 เมตร", price: 250 },
    { name: "อัลเทอร่า ซีรีส์ 7 สูตร", price: 250 },
    { name: "มังคุด ขนาด 1x2 เมตร", price: 250 },
    { name: "เทคเคน ขนาด 1x2 เมตร", price: 250 },
    { name: "เทอรา ซอร์บ ขนาด 1x2 เมตร", price: 250 },
    { name: "แอพพรูพ 40 เอสซี ขนาด 1x2 เมตร", price: 250 },
    { name: "เพอฟอร์ม ขนาด 1x2 เมตร", price: 250 },
    { name: "โรดแม็บ ขนาด 1x2 เมตร", price: 250 },
    { name: "เรดแน็พ ขนาด 1x2 เมตร", price: 250 },
    { name: "ซีโตเร่ ขนาด 1x2 เมตร", price: 250 },
    { name: "บิทเทิล ขนาด 1x2 เมตร", price: 250 },
    { name: "ไซบลาส ขนาด 1x2 เมตร", price: 250 },
    { name: "อะเวค ขนาด 1x2 เมตร", price: 250 },
    { name: "สติมเท็กซ์ โกลด์(ผลไม้) ขนาด 1x2 เมตร", price: 250 },
    { name: "คีพเปอร์ ขนาด 1x2 เมตร", price: 250 },
    { name: "สติมเท็กซ์ โกลด์(นาข้าว) ขนาด 1x2 เมตร", price: 250 },
    { name: "คร็อพโทนิค (นาข้าว) ขนาด 60x80 ซม.", price: 150 },
    { name: "คร็อพโทนิค (ทุเรียน) ขนาด 60x80 ซม.", price: 150 },
    { name: "อัลเทอร่า - เค ขนาด 1x2 เมตร", price: 250 },
  ],
  Leaflet: [
    { name: "เล่มคู่มือทุเรียน", price: 45 },
    { name: "เล่มคู่มือนาข้าว", price: 45 },
    { name: "ใบปลิวคู่มือนาข้าวสำหรับการใช้โดรน", price: 8 },
    { name: "ใบปลิวมะม่วง", price: 5 },
    { name: "ใบปลิวเงาะ", price: 5 },
    { name: "ใบปลิวลำไย", price: 5 },
    { name: "ใบปลิวชมพู่", price: 5 },
    { name: "ใบปลิวมังคุด", price: 5 },
    { name: "ใบปลิวมะนาว", price: 5 },
    { name: "ใบปลิวหอม", price: 5 },
    { name: "ใบปลิวพริก", price: 5 },
    { name: "ใบปลิวผลิตภัณฑ์ตราปืนใหญ่เพื่อชาวไร่อ้อย", price: 5 },
    { name: "ใบปลิวมันสำปะหลัง", price: 5 },
    { name: "ใบปลิวผักกินใบ", price: 5 },
    { name: "ใบปลิวกล้วยไม้", price: 5 },
    { name: "ใบปลิวเทอรา ซอร์บ", price: 5 },
    { name: "ใบปลิวเทอรา-ซอร์บ เรดิคูรา", price: 5 },
    { name: "ใบปลิวควีแลนท์ แคลเซียม", price: 5 },
    { name: "ใบปลิวเพอฟอร์ม", price: 5 },
    { name: "ใบปลิวเพอฟอร์+ดิสแทนท์ (ข้าวโพด)", price: 5 },
    { name: "ใบปลิวคีพเปอร์", price: 5 },
    { name: "ใบปลิวซิกแนล", price: 5 },
    { name: "ใบปลิวเอมัส", price: 5 },
    { name: "ใบปลิวแท็คทีมพรี", price: 5 },
    { name: "ใบปลิวซัมมิท+จัสคอล70", price: 5 },
    { name: "ใบปลิวแฮตแทค", price: 5 },
    { name: "ใบปลิวแลคเกอร์-พาวเวอร์", price: 5 },
    { name: "ใบปลิวซูโด+บล็อกกิ้ง+อัคคาบัน", price: 5 },
    { name: "ใบปลิวเรดแน็พ+เฟียร์ส+แฮพเพ่น", price: 5 },
    { name: "ใบปลิวสติมเท็กซ์ โกลด์", price: 5 },
  ],
  อุปกรณ์จัดงาน: [
    { name: "เต็นท์", price: 2500 },
    { name: "โต๊ะใหญ่ พร้อมผ้าปู", price: 600 },
    { name: "โต๊ะเล็ก พร้อมผ้าปู", price: 400 },
    { name: "ธงชายหาดใหญ่", price: 1200 },
    { name: "ธงชายหาดเล็ก", price: 850 },
    { name: "Backdrop ใหญ่", price: 4500 },
    { name: "Backdrop เล็ก", price: 2800 },
    { name: "ชุดอุปกรณ์ผสมยา", price: 1500 },
    { name: "ลำโพง JBL พร้อมไมค์", price: 8500 },
    { name: "ขวดสินค้าตัวอย่าง ระบุ...", price: 300 },
    { name: "ธงราว", price: 200 },
    { name: "ชุดเกมส์โยนห่วง", price: 750 },
    { name: "ชุดเกมส์ปาเป้า", price: 800 },
    { name: "แท่นหมุนวงล้อ", price: 1800 },
    { name: "ชุดเกมส์สอยดาว", price: 1200 },
    { name: "PVC รายการพิเศษ ระบุ...", price: 500 },
    { name: "กล่องจับรางวัล ขนาดเล็ก", price: 350 },
    { name: "กล่องจับรางวัล ขนาดกลาง", price: 550 },
    { name: "ตู้หมุนสลากรางวัล", price: 2200 },
    { name: "Standy รายการพิเศษ ระบุ ....", price: 650 },
    { name: "ร่มสนาม", price: 1400 },
    { name: "หญ้าเทียม", price: 1800 },
  ],
  อื่นๆ: [{ name: "", price: 0, unit: "ชิ้น" }],
};

export const CROP_CATEGORIES = ["ผักและพืชล้มลุก", "พืชไร่", "พืชสวน"];

export const CROPS_BY_CATEGORY: Record<string, string[]> = {
  ผักและพืชล้มลุก: [
    "คะน้า",
    "กะหล่ำปลี",
    "พริก",
    "มะเขือเทศ",
    "แตงกวา",
    "หอมแดง",
    "กระเทียม",
    "แตงโม",
    "ฟักทอง",
    "ผักและพืชล้มลุกอื่นๆ",
  ],
  พืชไร่: [
    "ข้าว",
    "มันสำปะหลัง",
    "ยางพารา",
    "อ้อย",
    "ข้าวโพด",
    "ปาล์มน้ำมัน",
    "ถั่วเหลือง",
    "พืชไร่อื่นๆ",
  ],
  พืชสวน: [
    "ทุเรียน",
    "ชมพู่",
    "มังคุด",
    "เงาะ",
    "ส้ม",
    "มะม่วง",
    "ลำไย",
    "มะพร้าว",
    "ลองกอง",
    "พืชสวนอื่นๆ",
  ],
};

export const TARGET_CROPS = [
  "ทุเรียน",
  "ข้าว",
  "มันสำปะหลัง",
  "ยางพารา",
  "อ้อย",
  "ส้ม",
];

export const STORES_LIST = [
  "ร้านทดสอบ สาขา 1",
  "ร้านทดสอบ สาขา 2",
  "ร้านสหายพานิช จันทบุรี",
  "ร้านเกษตรพัฒนา",
];

export const REQUISITION_UNITS = [
  "ขวด",
  "ซอง",
  "แผ่น",
  "กล่อง",
  "ชิ้น",
  "ถุง",
  "ชุด",
  "ม้วน",
];

export const MARKETING_UNITS = [
  "ชิ้น",
  "ใบ",
  "เล่ม",
  "ตัว",
  "แผ่น",
  "ผืน",
  "กล่อง",
  "ลัง",
  "แพค",
  "อัน",
  "คัน",
  "ชุด",
  "ขวด",
  "ซอง",
  "ถุง",
  "ม้วน",
];

export interface UserDemoPlotOption {
  id: string;
  code?: string;
  name: string;
  location: string;
  targetCrop: string;
  showcase: string;
  ownerName?: string;
  cropCategory?: string;
  cropName?: string;
  customCropName?: string;
  productName?: string;
  areaRai?: number;
  treeCount?: number;
  startDate?: string;
  status?: string;
  visitsCount?: number;
  totalCost?: number;
  daysSinceStart?: number;
  objective?: string;
  experimentDetail?: string;
  latitude?: string;
  longitude?: string;
}

export const USER_DEMO_PLOTS: UserDemoPlotOption[] = [
  {
    id: "plot-1",
    name: "แปลงสาธิตสวนทุเรียน อ.แกลง (นายสมชาย)",
    location: "แปลงสาธิตสวนทุเรียน ต.วังหว้า อ.แกลง จ.ระยอง",
    targetCrop: "ทุเรียนหมอนทอง",
    showcase: "ปุ๋ยสูตรพรีเมียม A",
    ownerName: "นายสมชาย ใจดี",
    cropCategory: "พืชสวน",
    cropName: "ทุเรียน",
    productName: "สินค้าทดสอบ A",
    areaRai: 10,
    treeCount: 120,
    startDate: "2026-03-15",
  },
  {
    id: "plot-2",
    name: "แปลงสาธิตนาข้าว อ.บางเลน (ร้านเกษตรพัฒนา)",
    location: "แปลงสาธิตนาข้าว ต.บางเลน อ.บางเลน จ.นครปฐม",
    targetCrop: "ข้าวหอมมะลิ",
    showcase: "ฮอร์โมนเร่งรวง B",
    ownerName: "ร้านเกษตรพัฒนา (นายสมศักดิ์)",
    cropCategory: "พืชไร่",
    cropName: "ข้าว",
    productName: "สินค้าทดสอบ B",
    areaRai: 25,
    treeCount: 0,
    startDate: "2026-04-01",
  },
  {
    id: "plot-3",
    name: "แปลงสาธิตมันสำปะหลัง อ.ด่านขุนทด (ร้านสหายพานิช)",
    location: "แปลงสาธิต ต.ห้วยบง อ.ด่านขุนทด จ.นครราชสีมา",
    targetCrop: "มันสำปะหลัง",
    showcase: "ปุ๋ยชีวภาพเร่งหัว C",
    ownerName: "ร้านสหายพานิช",
    cropCategory: "พืชไร่",
    cropName: "มันสำปะหลัง",
    productName: "สินค้าทดสอบ C",
    areaRai: 15,
    treeCount: 0,
    startDate: "2026-02-10",
  },
  {
    id: "plot-4",
    name: "แปลงสาธิตสวนส้ม อ.ฝาง (เกษตรกรตัวอย่าง 1)",
    location: "แปลงสาธิต ต.เวียง อ.ฝาง จ.เชียงใหม่",
    targetCrop: "ส้มสายน้ำผึ้ง",
    showcase: "สารบำรุงใบพรีเมียม",
    ownerName: "เกษตรกรตัวอย่าง 1 (นายวิชัย)",
    cropCategory: "พืชสวน",
    cropName: "ส้ม",
    productName: "ปุ๋ยเคมีสูตรพิเศษ",
    areaRai: 8,
    treeCount: 150,
    startDate: "2026-01-20",
  },
];

/**
 * Helper to identify whether an ActivityPlanItem is a Type 10 (Field Day) item
 */
export function isFieldDayItem(item: any): boolean {
  if (!item) return false;
  if (item.itemType === "TYPE_10") return true;
  if (typeof item.meetingTopic === "string" && item.meetingTopic.includes("Field Day")) return true;
  const detailStr = String(item.detail || "");
  if (
    detailStr.includes("[Field Day]") ||
    detailStr.includes("Field Day") ||
    detailStr.includes("จัดงาน Field Day")
  ) {
    return true;
  }
  if (
    detailStr.includes("สินค้าโชว์:") ||
    (detailStr.includes("พืชเป้าหมาย:") && (detailStr.includes("เป้ายอดจอง:") || detailStr.includes("ผู้ร่วมงาน:")))
  ) {
    return true;
  }
  if (
    item.plotProductName &&
    item.plotCropName &&
    item.meetingAttendeesCount != null &&
    item.saleTotalPrice != null &&
    !item.saleQuantity &&
    !item.plotActivityType
  ) {
    return true;
  }
  return false;
}
