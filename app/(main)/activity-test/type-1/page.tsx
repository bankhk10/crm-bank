"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Calendar,
  ClipboardList,
  Sparkles,
  Eye,
  CheckCircle2,
  FileCheck2,
} from "lucide-react";

// Imports from the NEW modules/activity
import {
  Type1PlannedForm,
  useType1PlannedForm,
  Type1ActualForm,
  useType1Actual,
  Type1UnplannedForm,
  useType1UnplannedForm,
  Type1DetailView,
  Type1ApprovalCard,
  Type1PlanCard,
  type Type1TargetItem,
} from "@/modules/activity/features/type-1";

import {
  PlanBasicInfoCard,
  PlanLocationTeamCard,
  usePlanLocationTeam,
  PlanBudgetSection,
  usePlanBudget,
  PlanNotesCard,
} from "@/modules/activity/ui";

import { getCustomersAction } from "@/modules/customers/server/actions";
import { listProductsAction } from "@/modules/products/server/actions";

export default function ActivityType1TestPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Common Header State
  const [title, setTitle] = useState<string>("ทดสอบเข้าพบเกษตรกรและร้านค้า (Type 1)");
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endDate, setEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [endTime, setEndTime] = useState<string>("17:00");
  const [notes, setNotes] = useState<string>("หมายเหตุทดสอบระบบโครงสร้างใหม่");

  // Type 1 Planned Hook
  const type1Planned = useType1PlannedForm({
    defaultProvince: "ขอนแก่น",
  });

  // Location & Team Hook
  const locationTeam = usePlanLocationTeam({
    selectedWorkTypes: ["TYPE_1"],
    employees: [],
  });

  // Budget Hook
  const budget = usePlanBudget();

  // Type 1 Actual Hook
  const type1Actual = useType1Actual();

  // Type 1 Unplanned Hook
  const type1Unplanned = useType1UnplannedForm({
    defaultProvince: "ขอนแก่น",
  });

  useEffect(() => {
    async function loadMasterData() {
      try {
        setLoading(true);
        const [custRes, prodRes] = await Promise.all([
          getCustomersAction({ perPage: 200 }).catch(() => ({ customers: [] })),
          listProductsAction({ status: "ACTIVE", perPage: 200 }).catch(() => ({
            products: [],
          })),
        ]);
        if (custRes?.customers) setCustomers(custRes.customers);
        if (prodRes?.products) setProducts(prodRes.products);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, []);

  const dummyTarget: Type1TargetItem = {
    customer: "ร้านเกษตรสมบูรณ์ ขอนแก่น",
    visitPurpose: "STORE",
    province: "ขอนแก่น",
    topic: "แจ้งข่าวสาร",
    notes: "แจ้งโปรโมชันปุ๋ยรอบใหม่",
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6 pb-24">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge className="bg-emerald-600 text-white font-mono text-xs">
              SANDBOX TEST
            </Badge>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              ทดสอบโครงสร้างใหม่: modules/activity/features/type-1
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            แยกเลเยอร์ Planned, Unplanned, UI, Application, Hooks อย่างเด็ดขาด
          </p>
        </div>
      </div>

      {loading && (
        <div className="p-4 bg-slate-50 border rounded-xl text-center text-xs text-slate-500">
          กำลังโหลดข้อมูลลูกค้าและสินค้า...
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="planned" className="space-y-6">
        <TabsList className="grid grid-cols-2 sm:grid-cols-4 w-full h-auto p-1 bg-slate-100 rounded-xl">
          <TabsTrigger
            value="planned"
            className="gap-2 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
          >
            <ClipboardList className="w-4 h-4" />
            1. ฟอร์มในแผน (Planned)
          </TabsTrigger>
          <TabsTrigger
            value="actual"
            className="gap-2 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
          >
            <FileCheck2 className="w-4 h-4" />
            2. ผลงานจริง (Actual)
          </TabsTrigger>
          <TabsTrigger
            value="unplanned"
            className="gap-2 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            3. งานนอกแผน (Unplanned)
          </TabsTrigger>
          <TabsTrigger
            value="detail-approval"
            className="gap-2 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-emerald-700 data-[state=active]:shadow-sm"
          >
            <Eye className="w-4 h-4" />
            4. Detail & Approval Card
          </TabsTrigger>
        </TabsList>

        {/* ─── TAB 1: PLANNED ─── */}
        <TabsContent value="planned" className="space-y-6">
          <Card className="p-5 md:p-6 space-y-6 bg-white border-slate-200 shadow-sm rounded-2xl">
            {/* 1. ข้อมูลระบบ & วันเวลา */}
            <PlanBasicInfoCard
              title={title}
              setTitle={setTitle}
              startDate={startDate}
              setStartDate={setStartDate}
              startTime={startTime}
              setStartTime={setStartTime}
              endDate={endDate}
              setEndDate={setEndDate}
              endTime={endTime}
              setEndTime={setEndTime}
              workTypeSelectorNode={
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold">
                  ประเภทงานที่เลือก: TYPE 1 - เข้าพบเกษตรกร / ร้านค้า
                </div>
              }
            />

            {/* 2. พื้นที่และทีมงาน */}
            <PlanLocationTeamCard
              selectedWorkTypes={["TYPE_1"]}
              province={locationTeam.province}
              setProvince={locationTeam.setProvince}
              district={locationTeam.district}
              setDistrict={locationTeam.setDistrict}
              locationText={locationTeam.locationText}
              setLocationText={locationTeam.setLocationText}
              helperSearch={locationTeam.helperSearch}
              setHelperSearch={locationTeam.setHelperSearch}
              showHelperDropdown={locationTeam.showHelperDropdown}
              setShowHelperDropdown={locationTeam.setShowHelperDropdown}
              filteredEmployees={locationTeam.filteredEmployees}
              addHelper={locationTeam.addHelper}
              helperEmployeeIds={locationTeam.helperEmployeeIds}
              employees={[]}
              removeHelper={locationTeam.removeHelper}
            />

            {/* 3. Type 1 Planned Slice */}
            <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200">
              <Type1PlannedForm
                items={type1Planned.items}
                customers={customers}
                addItem={type1Planned.addItem}
                updateItem={type1Planned.updateItem}
                deleteItem={type1Planned.deleteItem}
              />
            </div>

            {/* 4. งบประมาณและค่าใช้จ่าย */}
            <PlanBudgetSection
              selectedWorkTypes={["TYPE_1"]}
              isPromotionalMediaSelected={budget.isPromotionalMediaSelected}
              setIsPromotionalMediaSelected={budget.setIsPromotionalMediaSelected}
              isSalesPromotionSelected={budget.isSalesPromotionSelected}
              setIsSalesPromotionSelected={budget.setIsSalesPromotionSelected}
              marketingProductItems={budget.marketingProductItems}
              marketingBudgetAmount={budget.marketingBudgetAmount}
              setMarketingBudgetAmount={budget.setMarketingBudgetAmount}
              addMarketingProductItem={budget.addMarketingProductItem}
              updateMarketingProductItem={budget.updateMarketingProductItem}
              deleteMarketingProductItem={budget.deleteMarketingProductItem}
              salesPromotionItems={budget.salesPromotionItems}
              addSalesPromotionRow={budget.addSalesPromotionRow}
              updateSalesPromotionRow={budget.updateSalesPromotionRow}
              deleteSalesPromotionRow={budget.deleteSalesPromotionRow}
            />

            {/* 5. หมายเหตุ */}
            <PlanNotesCard notes={notes} setNotes={setNotes} />

            {/* Submit Action */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  const validation = type1Planned.validate(customers);
                  if (!validation.isValid) {
                    toast.error(validation.error);
                    return;
                  }
                  toast.success("Validation ผ่าน! ข้อมูลพร้อมส่ง Save");
                  console.log("Planned Payload:", {
                    title,
                    startDate,
                    items: type1Planned.items,
                  });
                }}
              >
                ทดสอบตรวจความถูกต้อง (Validate Planned)
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ─── TAB 2: ACTUAL ─── */}
        <TabsContent value="actual" className="space-y-6">
          <Card className="p-5 md:p-6 space-y-6 bg-white border-slate-200 shadow-sm rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                ฟอร์มบันทึกผลงานจริง (Actual Form)
              </h3>
              <p className="text-xs text-slate-500">
                จำลองการบันทึกผลงานจริงตามเป้าหมายแผนงานที่วางไว้
              </p>
            </div>

            {/* Card สรุปเป้าหมายแผน */}
            <Type1PlanCard
              target={dummyTarget}
              targets={type1Planned.items.map((it) => ({
                customer: it.customerName || it.unregisteredFarmerName || "เป้าหมาย",
                visitPurpose: it.visitPurpose,
                province: it.province,
                topic: it.topic,
                notes: it.notes,
              }))}
            />

            {/* ฟอร์มบันทึกผลงานจริง */}
            <Type1ActualForm
              isVisible={true}
              products={products}
              targets={type1Planned.items.map((it) => ({
                id: it.id,
                customer: it.customerName || it.unregisteredFarmerName || "เป้าหมาย",
                visitPurpose: it.visitPurpose,
                province: it.province,
                topic: it.topic,
                notes: it.notes,
              }))}
              targetActualResults={type1Actual.t1TargetItems}
              onUpdateTargetActualResults={type1Actual.syncFromTargetItems}
              productAdvice={type1Actual.t1ProductAdvice}
              setProductAdvice={type1Actual.setT1ProductAdvice}
              advisedProducts={type1Actual.t1AdvisedProducts}
              setAdvisedProducts={type1Actual.setT1AdvisedProducts}
              discussionResult={type1Actual.t1DiscussionResult}
              setDiscussionResult={type1Actual.setT1DiscussionResult}
              salesOpportunity={type1Actual.t1SalesOpportunity}
              setSalesOpportunity={type1Actual.setT1SalesOpportunity}
              nextAction={type1Actual.t1NextAction}
              setNextAction={type1Actual.setT1NextAction}
              nextMeetingDate={type1Actual.t1NextMeetingDate}
              setNextMeetingDate={type1Actual.setT1NextMeetingDate}
              farmerHomeAddress={type1Actual.t1FarmerHomeAddress}
              setFarmerHomeAddress={type1Actual.setT1FarmerHomeAddress}
              plotLatitude={type1Actual.t1PlotLatitude}
              setPlotLatitude={type1Actual.setT1PlotLatitude}
              plotLongitude={type1Actual.t1PlotLongitude}
              setPlotLongitude={type1Actual.setT1PlotLongitude}
              plotImages={type1Actual.t1PlotImages}
              setPlotImages={type1Actual.setT1PlotImages}
            />
          </Card>
        </TabsContent>

        {/* ─── TAB 3: UNPLANNED ─── */}
        <TabsContent value="unplanned" className="space-y-6">
          <Card className="p-5 md:p-6 space-y-6 bg-white border-slate-200 shadow-sm rounded-2xl">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                ฟอร์มงานนอกแผน (Unplanned Form)
              </h3>
              <p className="text-xs text-slate-500">
                กรอกเป้าหมายร้านค้า + ผลการพบจริง + พิกัด GPS + รูปถ่าย จบในฟอร์มเดียว
              </p>
            </div>

            <Type1UnplannedForm
              items={type1Unplanned.items}
              customers={customers}
              products={products}
              addItem={type1Unplanned.addItem}
              updateItem={type1Unplanned.updateItem}
              deleteItem={type1Unplanned.deleteItem}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  const validation = type1Unplanned.validate(customers);
                  if (!validation.isValid) {
                    toast.error(validation.error);
                    return;
                  }
                  toast.success("Validation นอกแผนผ่านฉลุย!");
                  console.log("Unplanned Payload:", type1Unplanned.items);
                }}
              >
                ทดสอบตรวจความถูกต้อง (Validate Unplanned)
              </Button>
            </div>
          </Card>
        </TabsContent>

        {/* ─── TAB 4: DETAIL & APPROVAL ─── */}
        <TabsContent value="detail-approval" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <Card className="p-5 md:p-6 space-y-4 bg-white border-slate-200 shadow-sm rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800">
                การแสดงผลในหน้าอนุมัติ (Approval Card)
              </h3>
              <Type1ApprovalCard
                isVisible={true}
                targets={[dummyTarget]}
              />
            </Card>

            <Card className="p-5 md:p-6 space-y-4 bg-white border-slate-200 shadow-sm rounded-2xl">
              <h3 className="text-sm font-bold text-slate-800">
                การแสดงผลในหน้ารายละเอียดแผน (Detail View)
              </h3>
              <Type1DetailView
                isVisible={true}
                targets={[
                  {
                    ...dummyTarget,
                    discussionResult: "ลูกค้าสนใจปุ๋ยสูตรใหม่ คาดว่าจะสั่งซื้อ 50 กระสอบ",
                    nextAction: "จัดส่งเอกสารใบเสนอราคาและตัวอย่างสินค้า",
                    nextMeetingDate: "2026-10-25",
                  },
                ]}
              />
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
