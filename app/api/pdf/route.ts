import { NextResponse } from "next/server";
import { createSamplePdf } from "@/modules/create-pdf/application/generate-pdf";

export async function GET() {
  try {
    const pdfBuffer = await createSamplePdf();

    // สร้าง Response ส่งกลับไปเป็นไฟล์ PDF
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        // ใช้ inline เพื่อเปิด Preview ในเบราว์เซอร์ ถ้าโหลดมาเลยให้เปลี่ยนเป็น attachment
        "Content-Disposition": 'inline; filename="sample-invoice.pdf"',
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้าง PDF" },
      { status: 500 },
    );
  }
}
