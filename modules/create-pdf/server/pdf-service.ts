import puppeteer from "puppeteer";

/**
 * Generate a PDF Buffer from an HTML string using Puppeteer
 * @param html The HTML string to be rendered
 * @returns Promise resolving to a PDF Buffer
 */
export async function generatePdfFromHtml(html: string): Promise<Buffer> {
  // Launch a new browser instance
  const browser = await puppeteer.launch({
    headless: true, // Run in headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for some environments
  });

  try {
    const page = await browser.newPage();

    // Set the HTML content of the page.
    await page.setContent(html, { waitUntil: "networkidle0" });

    // First, generate PDF without footer to count pages
    const initialPdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "5mm",
        bottom: "15mm",
        left: "8mm",
        right: "8mm",
      },
    });

    // Count pages by looking for /Page objects in the PDF structure
    const pdfString = Buffer.from(initialPdf).toString("binary");
    const pageCount = (pdfString.match(/\/Type\s*\/Page\b/g) || []).length;

    // Options for the final PDF
    const pdfOptions: any = {
      format: "A4",
      printBackground: true,
      margin: {
        top: "5mm",
        bottom: "15mm",
        left: "8mm",
        right: "8mm",
      },
    };

    // Only show footer if more than 1 page
    if (pageCount > 1) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = "<div></div>"; // Empty header
      pdfOptions.footerTemplate = `
        <div style="font-size: 10px; color: #777; width: 100%; text-align: center; font-family: 'Sarabun', sans-serif; margin-bottom: 5px;">
          หน้า <span class="pageNumber"></span> จาก <span class="totalPages"></span>
        </div>
      `;
    }

    // Generate the final PDF
    const pdfUint8Array = await page.pdf(pdfOptions);

    // Convert Uint8Array to Buffer
    return Buffer.from(pdfUint8Array);
  } finally {
    // Ensure the browser is closed even if an error occurs
    await browser.close();
  }
}
