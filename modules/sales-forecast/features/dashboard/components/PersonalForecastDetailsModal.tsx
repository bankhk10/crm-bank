import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Building2, Package, CalendarDays } from "lucide-react";

interface DetailItem {
  productId: string;
  productName: string;
  month: number;
  shopId: string;
  shopName: string;
  amount: number;
  quantity: number;
}

interface PersonalForecastDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  details: DetailItem[];
  formatCurrency: (val: number) => string;
}

export function PersonalForecastDetailsModal({
  isOpen,
  onClose,
  employeeName,
  details,
  formatCurrency,
}: PersonalForecastDetailsModalProps) {
  // Aggregate by Product
  const productMap = new Map<string, { name: string; amount: number; qty: number }>();
  // Aggregate by Shop
  const shopMap = new Map<string, { name: string; amount: number; qty: number }>();
  // Aggregate by Month -> Shop -> Product
  const monthMap = new Map<number, DetailItem[]>();

  details.forEach((item) => {
    // Products
    if (!productMap.has(item.productId)) {
      productMap.set(item.productId, { name: item.productName, amount: 0, qty: 0 });
    }
    const p = productMap.get(item.productId)!;
    p.amount += item.amount;
    p.qty += item.quantity;

    // Shops
    if (!shopMap.has(item.shopId)) {
      shopMap.set(item.shopId, { name: item.shopName, amount: 0, qty: 0 });
    }
    const s = shopMap.get(item.shopId)!;
    s.amount += item.amount;
    s.qty += item.quantity;

    // Months
    if (!monthMap.has(item.month)) {
      monthMap.set(item.month, []);
    }
    monthMap.get(item.month)!.push(item);
  });

  const products = Array.from(productMap.values()).sort((a, b) => b.amount - a.amount);
  const shops = Array.from(shopMap.values()).sort((a, b) => b.amount - a.amount);
  const months = Array.from(monthMap.keys()).sort((a, b) => a - b);

  const getMonthName = (m: number) => {
    const d = new Date();
    d.setMonth(m - 1);
    return d.toLocaleString('th-TH', { month: 'long' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-6 pb-4 bg-white border-b border-slate-100 shrink-0">
          <DialogTitle className="text-xl sm:text-2xl font-bold flex flex-col gap-1">
            <span>รายละเอียดเป้าหมายยอดขาย</span>
            <span className="text-blue-600 text-lg sm:text-xl font-medium">{employeeName}</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="products" className="flex-1 flex flex-col overflow-hidden w-full">
          <div className="px-6 py-4 bg-white border-b border-slate-100 shrink-0 overflow-x-auto scrollbar-hide">
            <TabsList className="bg-slate-100 p-1.5 rounded-xl h-auto">
              <TabsTrigger value="products" className="rounded-lg px-4 py-2 flex items-center gap-2 data-[state=active]:text-blue-700">
                <Package className="w-4 h-4" /> สินค้า
              </TabsTrigger>
              <TabsTrigger value="shops" className="rounded-lg px-4 py-2 flex items-center gap-2 data-[state=active]:text-blue-700">
                <Building2 className="w-4 h-4" /> ร้านค้า
              </TabsTrigger>
              <TabsTrigger value="months" className="rounded-lg px-4 py-2 flex items-center gap-2 data-[state=active]:text-blue-700">
                <CalendarDays className="w-4 h-4" /> รายเดือน
              </TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            <TabsContent value="products" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((p, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <p className="font-semibold text-slate-800 line-clamp-2" title={p.name}>{p.name}</p>
                    <div className="mt-auto">
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(p.amount)}</p>
                      <p className="text-sm text-slate-500">จำนวน: {p.qty.toLocaleString()} ชิ้น</p>
                    </div>
                  </div>
                ))}
                {products.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-500">
                    ไม่มีข้อมูลสินค้า
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="shops" className="mt-0 focus-visible:outline-none">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shops.map((s, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800 line-clamp-2" title={s.name}>{s.name || 'ไม่ระบุชื่อร้านค้า'}</p>
                        <p className="text-lg font-bold text-blue-600 mt-1">{formatCurrency(s.amount)}</p>
                        <p className="text-sm text-slate-500">รวมสินค้า {s.qty.toLocaleString()} ชิ้น</p>
                      </div>
                    </div>
                  </div>
                ))}
                {shops.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-500">
                    ไม่มีข้อมูลร้านค้า
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="months" className="mt-0 focus-visible:outline-none space-y-6">
              {months.map(m => {
                const monthItems = monthMap.get(m)!;
                return (
                  <div key={m} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                      <h4 className="font-bold text-slate-800 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4 text-blue-600" />
                        เดือน{getMonthName(m)}
                      </h4>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {monthItems.map((item, idx) => (
                        <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="space-y-1">
                            <p className="font-medium text-slate-800">{item.productName}</p>
                            <p className="text-sm text-slate-500 flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5" />
                              {item.shopName || 'ไม่ระบุชื่อร้านค้า'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-bold text-blue-600">{formatCurrency(item.amount)}</p>
                            <p className="text-xs text-slate-400">{item.quantity.toLocaleString()} ชิ้น</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
              {months.length === 0 && (
                <div className="py-8 text-center text-slate-500">
                  ไม่มีข้อมูลรายเดือน
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
