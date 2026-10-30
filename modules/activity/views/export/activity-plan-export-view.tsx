"use client";

import React from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { useActivityPlanExport } from "./hooks/use-activity-plan-export";
import { ExportHeaderBar } from "./components/export-header-bar";
import { ExportSettingsSidebar } from "./components/export-settings-sidebar";
import { ExportLivePreview } from "./components/export-live-preview";

interface ActivityPlanExportViewProps {
  id?: string;
}

export default function ActivityPlanExportView({
  id,
}: ActivityPlanExportViewProps) {
  const {
    plan,
    selectedPlanId,
    setSelectedPlanId,
    availablePlans,
    loadingPlan,
    error,
    availableWorkTypes,
    mode,
    setMode,
    selectedMonth,
    setSelectedMonth,
    selectedYear,
    setSelectedYear,
    selectedTypeCode,
    setSelectedTypeCode,
    includeActual,
    setIncludeActual,
    includePhotos,
    setIncludePhotos,
    pageBreakPerType,
    setPageBreakPerType,
    previewHtml,
    loadingPreview,
    downloadingPdf,
    iframeRef,
    handlePrint,
    handleDownloadPdf,
    handleRefreshPreview,
    handleBack,
  } = useActivityPlanExport(id);

  if (loadingPlan && mode === "SINGLE" && !plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="text-xs text-slate-500 font-medium">
          กำลังเตรียมห้องพิมพ์เอกสาร (Print Studio)...
        </p>
      </div>
    );
  }

  if (mode === "SINGLE" && (error || !plan)) {
    return (
      <div className="container mx-auto p-6 max-w-2xl space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            {error || "ไม่พบข้อมูลแผนงานที่ต้องการพิมพ์"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" onClick={handleBack} className="text-xs">
          กลับหน้ารายการแผนงาน
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ─── 1. TOP HEADER ACTION BAR ─── */}
      <ExportHeaderBar
        plan={plan}
        mode={mode}
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        loadingPreview={loadingPreview}
        downloadingPdf={downloadingPdf}
        onBack={handleBack}
        onPrint={handlePrint}
        onDownloadPdf={handleDownloadPdf}
        onRefreshPreview={handleRefreshPreview}
      />

      {/* ─── 2. MAIN WORKSPACE CANVAS (2 COLUMNS) ─── */}
      <div className="container mx-auto p-4 sm:p-6 flex-1 flex flex-col lg:flex-row items-start gap-6">
        {/* Left: Print Settings Sidebar */}
        <ExportSettingsSidebar
          selectedPlanId={selectedPlanId}
          setSelectedPlanId={setSelectedPlanId}
          availablePlans={availablePlans}
          mode={mode}
          setMode={setMode}
          selectedMonth={selectedMonth}
          setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
          selectedTypeCode={selectedTypeCode}
          setSelectedTypeCode={setSelectedTypeCode}
          availableWorkTypes={availableWorkTypes}
          includeActual={includeActual}
          setIncludeActual={setIncludeActual}
          includePhotos={includePhotos}
          setIncludePhotos={setIncludePhotos}
          pageBreakPerType={pageBreakPerType}
          setPageBreakPerType={setPageBreakPerType}
        />

        {/* Right: Live A4 Paper Preview */}
        <ExportLivePreview
          previewHtml={previewHtml}
          loadingPreview={loadingPreview}
          iframeRef={iframeRef}
        />
      </div>
    </div>
  );
}
