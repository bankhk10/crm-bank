export const customerStores = [
  {
    id: "store-01",
    name: "ร้านรุ่งเรืองการเกษตร",
    code: "CUST-001",
    type: "ดีลเลอร์",
    province: "นครปฐม",
    totalSales: 128500,
    avgOrderValue: 6425,
    purchaseFrequency: 0.8,
  },
  {
    id: "store-02",
    name: "ศูนย์ปุ๋ยพิษณุโลก",
    code: "CUST-014",
    type: "ซับดีลเลอร์",
    province: "พิษณุโลก",
    totalSales: 95400,
    avgOrderValue: 7950,
    purchaseFrequency: 0.5,
  },
  {
    id: "store-03",
    name: "ฟาร์มเกษตรรวมใจ",
    code: "CUST-028",
    type: "เกษตรกร",
    province: "ขอนแก่น",
    totalSales: 64750,
    avgOrderValue: 4317,
    purchaseFrequency: 0.3,
  },
];

export const customerSalesDetails: Record<
  string,
  {
    totalSales: number;
    avgPerOrder: number;
    avgMonthlyPurchase: number;
    frequentProducts: string[];
    purchasedProducts: string[];
    purchaseHistory: Array<{
      date: string;
      orderNo: string;
      items: number;
      total: number;
    }>;
  }
> = {
  "store-01": {
    totalSales: 128500,
    avgPerOrder: 6425,
    avgMonthlyPurchase: 0.1,
    frequentProducts: ["ปุ๋ยอินทรีย์ A", "สารเร่งโต X", "เมล็ดพันธุ์ข้าว"],
    purchasedProducts: [
      "ปุ๋ยอินทรีย์ A",
      "สารเร่งโต X",
      "เมล็ดพันธุ์ข้าว",
      "ปุ๋ยสูตร 16-16-16",
    ],
    purchaseHistory: [
      {
        date: "10 ส.ค. 2024",
        orderNo: "SO-240810",
        items: 12,
        total: 17800,
      },
      {
        date: "12 ก.ค. 2024",
        orderNo: "SO-240712",
        items: 9,
        total: 15600,
      },
      {
        date: "18 มิ.ย. 2024",
        orderNo: "SO-240618",
        items: 8,
        total: 13950,
      },
    ],
  },
  "store-02": {
    totalSales: 95400,
    avgPerOrder: 7950,
    avgMonthlyPurchase: 0.1,
    frequentProducts: [
      "สารเร่งโต X",
      "ปุ๋ยสูตร 21-7-14",
      "สารกำจัดศัตรูพืช B",
    ],
    purchasedProducts: [
      "สารเร่งโต X",
      "ปุ๋ยสูตร 21-7-14",
      "สารกำจัดศัตรูพืช B",
      "เมล็ดพันธุ์ข้าวโพด",
    ],
    purchaseHistory: [
      {
        date: "05 ส.ค. 2024",
        orderNo: "SO-240805",
        items: 10,
        total: 22400,
      },
      {
        date: "02 ก.ค. 2024",
        orderNo: "SO-240702",
        items: 7,
        total: 14800,
      },
      {
        date: "08 มิ.ย. 2024",
        orderNo: "SO-240608",
        items: 6,
        total: 11900,
      },
    ],
  },
  "store-03": {
    totalSales: 64750,
    avgPerOrder: 4317,
    avgMonthlyPurchase: 0.1,
    frequentProducts: ["เมล็ดพันธุ์ข้าวโพด", "ปุ๋ยอินทรีย์ A"],
    purchasedProducts: [
      "เมล็ดพันธุ์ข้าวโพด",
      "ปุ๋ยอินทรีย์ A",
      "สารกำจัดศัตรูพืช B",
    ],
    purchaseHistory: [
      {
        date: "29 ก.ค. 2024",
        orderNo: "SO-240729",
        items: 5,
        total: 8200,
      },
      {
        date: "15 มิ.ย. 2024",
        orderNo: "SO-240615",
        items: 4,
        total: 6800,
      },
      {
        date: "18 พ.ค. 2024",
        orderNo: "SO-240518",
        items: 6,
        total: 9600,
      },
    ],
  },
};
