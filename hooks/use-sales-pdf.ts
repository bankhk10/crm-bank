"use client";

import { useCallback, useState } from "react";

export function useSalesPdf(
  documentRef: React.RefObject<HTMLDivElement | null>,
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const generatePdfBlob = useCallback(async (): Promise<Blob | null> => {
    const element = documentRef.current;
    if (!element) return null;

    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");

    // A4 dimensions in mm
    const a4Width = 210;
    const a4Height = 297;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (clonedDoc) => {
        // Remove external CSS links (Tailwind v4 uses lab()/oklch() that html2canvas can't parse)
        const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
        links.forEach((link) => link.remove());

        // Remove only <style> tags that contain lab() or oklch() color functions
        const allStyles = clonedDoc.querySelectorAll("style");
        allStyles.forEach((s) => {
          const text = s.textContent || "";
          if (text.includes("lab(") || text.includes("oklch(")) {
            s.remove();
          }
        });

        // Reset CSS custom properties on :root that may use lab()
        clonedDoc.documentElement.style.cssText = "";
        clonedDoc.body.style.cssText =
          "margin:0; padding:0; background:#ffffff;";
      },
    });

    const imgData = canvas.toDataURL("image/png");
    const imgWidth = a4Width;
    const imgHeight = (canvas.height * a4Width) / canvas.width;

    const pdf = new jsPDF("p", "mm", "a4");

    if (imgHeight <= a4Height) {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      let remainingHeight = imgHeight;
      let position = 0;

      while (remainingHeight > 0) {
        if (position > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "PNG", 0, -position, imgWidth, imgHeight);
        position += a4Height;
        remainingHeight -= a4Height;
      }
    }

    return pdf.output("blob");
  }, [documentRef]);

  const handlePreview = useCallback(async () => {
    setIsGenerating(true);
    try {
      const blob = await generatePdfBlob();
      if (blob) {
        // Revoke previous URL if exists
        if (pdfUrl) URL.revokeObjectURL(pdfUrl);
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
        setShowPreview(true);
      }
    } catch (error) {
      console.error("Failed to generate PDF preview:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [generatePdfBlob, pdfUrl]);

  const handleDownloadPdf = useCallback(
    async (saleNumber: string) => {
      setIsGenerating(true);
      try {
        const blob = await generatePdfBlob();
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${saleNumber}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } catch (error) {
        console.error("Failed to generate PDF:", error);
      } finally {
        setIsGenerating(false);
      }
    },
    [generatePdfBlob],
  );

  const handlePrintFromPreview = useCallback(() => {
    if (!pdfUrl) return;
    const iframe = document.querySelector(
      "#pdf-preview-iframe",
    ) as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.print();
    }
  }, [pdfUrl]);

  const closePreview = useCallback(() => {
    setShowPreview(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
  }, [pdfUrl]);

  return {
    handlePreview,
    handleDownloadPdf,
    handlePrintFromPreview,
    closePreview,
    isGenerating,
    pdfUrl,
    showPreview,
  };
}
