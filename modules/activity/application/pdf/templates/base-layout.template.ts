/**
 * Base HTML Layout Template for Activity Plan PDF and Live Preview
 */
export function renderBaseLayout(
  title: string,
  bodyContent: string,
  options?: { landscape?: boolean },
): string {
  const isLandscape = Boolean(options?.landscape);
  const pageSize = isLandscape ? "A4 landscape" : "A4 portrait";
  const maxWidth = isLandscape ? "297mm" : "210mm";

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: ${pageSize};
      margin: 8mm 8mm 12mm 8mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 11px;
      line-height: 1.45;
      color: #1e293b;
      background: #ffffff;
    }

    .pdf-container {
      width: 100%;
      max-width: ${maxWidth};
      margin: 0 auto;
      padding: 2mm 0;
    }

    /* Page Breaks */
    .page-break {
      page-break-before: always;
      break-before: page;
      margin-top: 18px;
      padding-top: 8px;
    }

    .avoid-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Header Styles */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
      border-bottom: 2px solid #0f3568;
      padding-bottom: 10px;
    }

    .header-table td {
      vertical-align: top;
      padding: 0;
    }

    .company-logo {
      width: 65px;
      height: auto;
      max-height: 65px;
      object-fit: contain;
    }

    .company-info h1 {
      margin: 0;
      font-size: 14px;
      font-weight: 800;
      color: #0f3568;
      letter-spacing: 0.3px;
    }

    .company-info h2 {
      margin: 2px 0 3px 0;
      font-size: 10px;
      font-weight: 700;
      color: #334155;
      letter-spacing: 0.2px;
    }

    .company-info p {
      margin: 1px 0;
      font-size: 9px;
      color: #64748b;
    }

    .doc-meta {
      text-align: right;
    }

    .doc-title-main {
      font-size: 13px;
      font-weight: 800;
      color: #0f3568;
      margin: 0 0 2px 0;
    }

    .doc-title-sub {
      font-size: 9.5px;
      color: #64748b;
      font-weight: 600;
      margin: 0 0 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .doc-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 9999px;
      font-size: 9px;
      font-weight: 700;
      border: 1px solid #cbd5e1;
    }

    .badge-blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .badge-green { background: #f0fdf4; color: #15803d; border-color: #bbf7d0; }
    .badge-amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .badge-red { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
    .badge-slate { background: #f8fafc; color: #475569; border-color: #cbd5e1; }

    /* Section Styles */
    .section-box {
      margin-bottom: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .section-header {
      background: #f8fafc;
      padding: 6px 10px;
      font-size: 10.5px;
      font-weight: 700;
      color: #0f3568;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-body {
      padding: 8px 10px;
      background: #ffffff;
    }

    /* Grid / Key-Value Info */
    .info-grid {
      display: table;
      width: 100%;
      border-collapse: collapse;
    }

    .info-row {
      display: table-row;
    }

    .info-cell {
      display: table-cell;
      padding: 3px 6px;
      vertical-align: top;
    }

    .info-label {
      font-size: 9.5px;
      color: #64748b;
      font-weight: 600;
      display: inline-block;
      margin-right: 4px;
    }

    .info-value {
      font-size: 10.5px;
      color: #0f172a;
      font-weight: 500;
    }

    /* Tables */
    .doc-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      margin-bottom: 4px;
      font-size: 9.5px;
    }

    .doc-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      text-align: left;
      padding: 5px 6px;
      border: 1px solid #cbd5e1;
      font-size: 9px;
    }

    .doc-table td {
      padding: 5px 6px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
      color: #1e293b;
    }

    .doc-table tr:nth-child(even) td {
      background: #fafafa;
    }

    .text-center { text-align: center !important; }
    .text-right { text-align: right !important; }
    .text-left { text-align: left !important; }

    /* Signatures */
    .signatures-grid {
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 8px 0;
      margin-top: 14px;
      page-break-inside: avoid;
    }

    .signature-card {
      display: table-cell;
      width: 33.33%;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 10px 8px 8px;
      text-align: center;
      background: #ffffff;
      vertical-align: top;
    }

    .signature-role {
      font-size: 9.5px;
      font-weight: 700;
      color: #0f3568;
      margin-bottom: 30px;
    }

    .signature-line {
      border-top: 1px dotted #94a3b8;
      width: 80%;
      margin: 0 auto 4px auto;
    }

    .signature-name {
      font-size: 9px;
      color: #334155;
      margin-bottom: 2px;
    }

    .signature-date {
      font-size: 8.5px;
      color: #64748b;
    }

    /* KPI Summary Cards */
    .kpi-grid {
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 8px;
      margin-top: 6px;
      margin-bottom: 6px;
      page-break-inside: avoid;
    }

    .kpi-card {
      display: table-cell;
      width: 25%;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 10px;
      text-align: center;
    }

    .kpi-label {
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
      margin-bottom: 2px;
    }

    .kpi-value {
      font-size: 13px;
      font-weight: 800;
      color: #0f3568;
    }

    /* Photo Gallery */
    .gallery-grid {
      display: table;
      width: 100%;
      border-collapse: separate;
      border-spacing: 6px;
      margin-top: 6px;
    }

    .gallery-row {
      display: table-row;
    }

    .gallery-cell {
      display: table-cell;
      width: 50%;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      padding: 4px;
      text-align: center;
      background: #f8fafc;
      vertical-align: top;
    }

    .gallery-img {
      max-width: 100%;
      max-height: 140px;
      object-fit: cover;
      border-radius: 3px;
    }

    .gallery-caption {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 4px;
    }

    @media print {
      body {
        background: #ffffff;
      }
      .pdf-container {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="pdf-container">
    ${bodyContent}
  </div>
</body>
</html>`;
}
