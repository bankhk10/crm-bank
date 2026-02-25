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
    args: ["--no-sandbox", "--disable-setuid-sandbox"], // Required for some environments (e.g., Docker, Vercel if custom setup)
  });

  try {
    const page = await browser.newPage();

    // Set the HTML content of the page.
    // waitUntil 'networkidle0' ensures all network requests (fonts, images) are completed before PDF generation
    await page.setContent(html, { waitUntil: "networkidle0" });

    // Generate the PDF
    const pdfUint8Array = await page.pdf({
      format: "A4",
      printBackground: true, // Important to render CSS backgrounds and colors
      margin: {
        top: "15mm",
        bottom: "15mm",
        left: "15mm",
        right: "15mm",
      },
    });

    // Convert Uint8Array to Buffer (Puppeteer returns Uint8Array in recent versions)
    return Buffer.from(pdfUint8Array);
  } finally {
    // Ensure the browser is closed even if an error occurs
    await browser.close();
  }
}
