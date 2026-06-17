import { Target } from "lucide-react";
import { DetailHero } from "@/components/custom/detail-hero";

export default function SalesForecastReportPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <DetailHero
          backUrl="/reports"
          backLabel="หน้ารายงาน"
          title="รายงานการขายเทียบกับคาดการณ์ยอดขาย"
          icon={<Target className="h-8 w-8 text-white" />}
          backgroundColor="#1e293b"
          accentColor="#8b5cf6"
        />
      </div>
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Target className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            กำลังอยู่ระหว่างการพัฒนา
          </h2>
          <p className="text-slate-500">
            หน้ารายงานนี้ถูกสร้างขึ้นมาเพื่อให้คุณสามารถเริ่มนำไปพัฒนาต่อได้ทันที
          </p>
        </div>
      </div>
    </div>
  );
}
