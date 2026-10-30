"use client";

import React from "react";
import { Loader2, Eye } from "lucide-react";

interface ExportLivePreviewProps {
  previewHtml: string;
  loadingPreview: boolean;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export function ExportLivePreview({
  previewHtml,
  loadingPreview,
  iframeRef,
}: ExportLivePreviewProps) {
  return (
    <main className="flex-1 min-w-0 bg-slate-100/90 rounded-2xl p-3 sm:p-6 border border-slate-200/80 shadow-inner flex flex-col items-center overflow-auto min-h-[600px] relative">
      {/* Canvas Top Bar */}
      <div className="w-full max-w-[210mm] flex items-center justify-between pb-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5 font-medium">
          <Eye className="w-3.5 h-3.5 text-blue-600" />
          <span>ตัวอย่างเอกสารก่อนพิมพ์ (Live A4 Preview)</span>
        </div>
        <span className="text-[11px] bg-slate-200/70 text-slate-700 px-2 py-0.5 rounded font-mono">
          กระดาษ A4 (210 × 297 มม.)
        </span>
      </div>

      {/* Loading Overlay */}
      {loadingPreview && (
        <div className="absolute inset-0 bg-white/70 backdrop-blur-2xs z-10 flex flex-col items-center justify-center gap-2 rounded-2xl">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs font-semibold text-slate-700">กำลังประมวลผลตัวอย่างเอกสาร...</p>
        </div>
      )}

      {/* A4 Sheet Paper Simulation */}
      <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-lg border border-slate-200/80 overflow-hidden min-h-[297mm] transition-all">
        {previewHtml ? (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            title="PDF Live Preview"
            className="w-full min-h-[850px] sm:min-h-[1100px] border-none block"
            style={{ width: "100%", height: "100%" }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-slate-400 min-h-[400px]">
            <Loader2 className="w-6 h-6 animate-spin mb-2 text-slate-400" />
            <p className="text-xs">กำลังเตรียมเอกสาร...</p>
          </div>
        )}
      </div>
    </main>
  );
}

