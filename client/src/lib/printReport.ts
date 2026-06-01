interface PrintReportOptions {
  title: string;
  weekStartDate: string;
  weekEndDate: string;
  projectName?: string;
  summary?: string | null;
  highlights?: string[] | null;
  nextSteps?: string[] | null;
  rawMarkdown?: string;
  stats?: {
    totalCommits: number;
    prsMerged: number;
    prsOpened: number;
    releases: number;
  };
  branding?: {
    agencyName?: string | null;
    logoUrl?: string | null;
    primaryColor?: string;
  };
  generatedDate?: string;
}

function mdToHtml(md: string): string {
  if (!md) return "";
  let html = md
    // Escape HTML entities first
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // Headings
    .replace(/^#{4}\s+(.+)$/gm, "<h4>$1</h4>")
    .replace(/^#{3}\s+(.+)$/gm, "<h3>$1</h3>")
    .replace(/^#{2}\s+(.+)$/gm, "<h2>$1</h2>")
    .replace(/^#{1}\s+(.+)$/gm, "<h1>$1</h1>")
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    // Horizontal rule
    .replace(/^---+$/gm, "<hr>")
    // Unordered list items
    .replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

  // Wrap consecutive <li> items in <ul>
  html = html.replace(/(<li>.*<\/li>\n?)+/gs, (match) => `<ul>${match}</ul>`);

  // Paragraphs: wrap non-tag lines in <p>
  const lines = html.split(/\n/);
  const result: string[] = [];
  let buf = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "") {
      if (buf) {
        result.push(`<p>${buf}</p>`);
        buf = "";
      }
    } else if (/^<(h[1-6]|ul|ol|li|hr|blockquote)/.test(trimmed)) {
      if (buf) { result.push(`<p>${buf}</p>`); buf = ""; }
      result.push(trimmed);
    } else {
      buf = buf ? buf + " " + trimmed : trimmed;
    }
  }
  if (buf) result.push(`<p>${buf}</p>`);
  return result.join("\n");
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "long", day: "numeric", year: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function printReport(opts: PrintReportOptions): void {
  const {
    title,
    weekStartDate,
    weekEndDate,
    projectName,
    summary,
    highlights,
    nextSteps,
    rawMarkdown,
    stats,
    branding,
    generatedDate,
  } = opts;

  const primary = branding?.primaryColor || "#6366F1";
  const agencyName = branding?.agencyName || "Project Report";
  const logoUrl = branding?.logoUrl || null;

  const statsHtml =
    stats && (stats.totalCommits > 0 || stats.prsMerged > 0 || stats.releases > 0)
      ? `
    <div class="stats-row">
      ${stats.totalCommits > 0 ? `<div class="stat-pill stat-blue"><span class="stat-num">${stats.totalCommits}</span><span class="stat-lbl">Commits</span></div>` : ""}
      ${stats.prsMerged > 0 ? `<div class="stat-pill stat-purple"><span class="stat-num">${stats.prsMerged}</span><span class="stat-lbl">PRs Merged</span></div>` : ""}
      ${stats.releases > 0 ? `<div class="stat-pill stat-green"><span class="stat-num">${stats.releases}</span><span class="stat-lbl">Release${stats.releases !== 1 ? "s" : ""}</span></div>` : ""}
      ${stats.prsOpened > 0 ? `<div class="stat-pill stat-orange"><span class="stat-num">${stats.prsOpened}</span><span class="stat-lbl">PRs Open</span></div>` : ""}
    </div>`
      : "";

  const summaryHtml = summary
    ? `<div class="summary-box"><div class="section-label">Summary</div><p>${summary}</p></div>`
    : "";

  const highlightsHtml =
    highlights && highlights.length > 0
      ? `<div class="section">
          <div class="section-heading">Key Highlights</div>
          <ul class="check-list">
            ${highlights.map((h) => `<li>${h}</li>`).join("")}
          </ul>
        </div>`
      : "";

  const nextStepsHtml =
    nextSteps && nextSteps.length > 0
      ? `<div class="section">
          <div class="section-heading">Next Steps</div>
          <ol class="steps-list">
            ${nextSteps.map((s) => `<li>${s}</li>`).join("")}
          </ol>
        </div>`
      : "";

  const bodyHtml = rawMarkdown
    ? `<div class="section"><div class="divider"></div>${mdToHtml(rawMarkdown)}</div>`
    : "";

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" class="logo" alt="${agencyName}" />`
    : `<div class="logo-text">${agencyName}</div>`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    /* ── Reset & base ───────────────────────────────────────────────── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Inter", Helvetica, Arial, sans-serif;
      font-size: 10.5pt;
      line-height: 1.65;
      color: #1a1a2e;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── Page layout ────────────────────────────────────────────────── */
    @page {
      size: A4;
      margin: 18mm 20mm 20mm 20mm;
    }

    .page-wrap {
      max-width: 720px;
      margin: 0 auto;
      padding: 0 0 60px 0;
    }

    /* ── Cover header ───────────────────────────────────────────────── */
    .cover-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      border-bottom: 3px solid ${primary};
      padding-bottom: 20px;
      margin-bottom: 28px;
    }

    .cover-left { display: flex; flex-direction: column; gap: 4px; }

    .logo {
      height: 36px;
      width: auto;
      object-fit: contain;
      margin-bottom: 6px;
      display: block;
    }
    .logo-text {
      font-size: 15pt;
      font-weight: 700;
      color: ${primary};
      margin-bottom: 6px;
    }

    .agency-name {
      font-size: 8pt;
      color: #888;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      margin-bottom: 2px;
    }

    .cover-right {
      text-align: right;
      flex-shrink: 0;
    }
    .report-date-range {
      font-size: 9pt;
      color: #555;
      line-height: 1.5;
    }
    .generated-label {
      font-size: 8pt;
      color: #aaa;
      margin-top: 4px;
    }

    /* ── Report title block ─────────────────────────────────────────── */
    .title-block { margin-bottom: 22px; }

    .report-title {
      font-size: 18pt;
      font-weight: 700;
      color: #0f0f1a;
      line-height: 1.25;
      margin-bottom: 6px;
    }

    .project-chip {
      display: inline-block;
      font-size: 8.5pt;
      font-weight: 600;
      color: ${primary};
      background: ${primary}18;
      border: 1px solid ${primary}40;
      border-radius: 20px;
      padding: 2px 10px;
    }

    /* ── Stats row ──────────────────────────────────────────────────── */
    .stats-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 22px;
    }
    .stat-pill {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid;
      font-size: 9pt;
    }
    .stat-num { font-weight: 700; }
    .stat-lbl { opacity: 0.75; }
    .stat-blue   { background: #eff6ff; border-color: #bfdbfe; color: #1e40af; }
    .stat-purple { background: #f5f3ff; border-color: #ddd6fe; color: #6d28d9; }
    .stat-green  { background: #f0fdf4; border-color: #bbf7d0; color: #15803d; }
    .stat-orange { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }

    /* ── Summary box ────────────────────────────────────────────────── */
    .summary-box {
      background: #f8f8fc;
      border-left: 4px solid ${primary};
      border-radius: 0 6px 6px 0;
      padding: 14px 16px;
      margin-bottom: 22px;
    }
    .summary-box p {
      font-size: 10pt;
      color: #333;
      line-height: 1.65;
    }

    /* ── Sections ───────────────────────────────────────────────────── */
    .section { margin-bottom: 22px; }

    .section-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #999;
      margin-bottom: 8px;
    }

    .section-heading {
      font-size: 11pt;
      font-weight: 700;
      color: #0f0f1a;
      margin-bottom: 10px;
      padding-bottom: 5px;
      border-bottom: 1px solid #eee;
    }

    .check-list, .steps-list {
      padding-left: 0;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 7px;
    }
    .check-list li {
      padding-left: 18px;
      position: relative;
      font-size: 10pt;
      color: #222;
    }
    .check-list li::before {
      content: "•";
      position: absolute;
      left: 0;
      color: ${primary};
      font-weight: 700;
    }
    .steps-list { list-style: decimal; padding-left: 18px; }
    .steps-list li { font-size: 10pt; color: #222; padding-left: 4px; }

    .divider {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 8px 0 18px;
    }

    /* ── Full report body typography ────────────────────────────────── */
    .section h1 { font-size: 13pt; font-weight: 700; margin: 16px 0 8px; color: #0f0f1a; }
    .section h2 { font-size: 11.5pt; font-weight: 700; margin: 14px 0 6px; color: #0f0f1a; }
    .section h3 { font-size: 10.5pt; font-weight: 600; margin: 12px 0 5px; color: #1a1a2e; }
    .section h4 { font-size: 10pt; font-weight: 600; margin: 10px 0 4px; color: #1a1a2e; }
    .section p  { font-size: 10pt; color: #333; margin: 0 0 10px; }
    .section ul, .section ol { padding-left: 20px; margin: 0 0 10px; }
    .section li { font-size: 10pt; color: #333; margin-bottom: 4px; }
    .section hr { border: none; border-top: 1px solid #e5e7eb; margin: 14px 0; }
    .section strong { font-weight: 600; color: #0f0f1a; }
    .section em { font-style: italic; }
    .section code {
      font-family: "SF Mono", "Fira Code", Consolas, monospace;
      font-size: 8.5pt;
      background: #f3f4f6;
      border: 1px solid #e5e7eb;
      border-radius: 3px;
      padding: 1px 4px;
      color: #374151;
    }

    /* ── Footer ─────────────────────────────────────────────────────── */
    .footer {
      margin-top: 40px;
      padding-top: 12px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #aaa;
    }
    .footer-brand { font-weight: 600; color: ${primary}; }

    /* ── Print-only rules ───────────────────────────────────────────── */
    @media print {
      body { font-size: 10pt; }
      .page-wrap { max-width: 100%; }
      .section { page-break-inside: avoid; }
      .cover-header { page-break-after: avoid; }
      .title-block { page-break-after: avoid; }

      /* Print button hidden */
      .print-bar { display: none !important; }
    }

    /* ── Screen: print bar at top ───────────────────────────────────── */
    .print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #1f2937;
      color: #f9fafb;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 9pt;
      z-index: 100;
      gap: 12px;
    }
    .print-bar-label { opacity: 0.7; }
    .print-btn {
      background: ${primary};
      color: #fff;
      border: none;
      border-radius: 6px;
      padding: 7px 18px;
      font-size: 9.5pt;
      font-weight: 600;
      cursor: pointer;
      letter-spacing: 0.02em;
      transition: opacity 0.15s;
    }
    .print-btn:hover { opacity: 0.88; }
    .close-btn {
      background: transparent;
      color: #9ca3af;
      border: 1px solid #374151;
      border-radius: 6px;
      padding: 7px 14px;
      font-size: 9.5pt;
      cursor: pointer;
    }
    .close-btn:hover { color: #f9fafb; }

    @media screen {
      body { padding-top: 52px; background: #f3f4f6; }
      .page-wrap {
        background: #fff;
        margin: 24px auto;
        padding: 40px 44px 60px;
        border-radius: 8px;
        box-shadow: 0 2px 16px rgba(0,0,0,0.10);
      }
    }
  </style>
</head>
<body>
  <!-- Print bar (screen only) -->
  <div class="print-bar">
    <span class="print-bar-label">Preview — ready to save as PDF</span>
    <div style="display:flex;gap:8px;">
      <button class="close-btn" onclick="window.close()">✕ Close</button>
      <button class="print-btn" onclick="window.print()">⬇ Save as PDF / Print</button>
    </div>
  </div>

  <div class="page-wrap">
    <!-- Cover header -->
    <div class="cover-header">
      <div class="cover-left">
        ${logoHtml}
        <div class="agency-name">${agencyName}</div>
      </div>
      <div class="cover-right">
        <div class="report-date-range">
          ${formatDate(weekStartDate)}<br />
          — ${formatDate(weekEndDate)}
        </div>
        ${generatedDate ? `<div class="generated-label">Generated ${generatedDate}</div>` : ""}
      </div>
    </div>

    <!-- Title block -->
    <div class="title-block">
      <div class="report-title">${title}</div>
      ${projectName ? `<span class="project-chip">${projectName}</span>` : ""}
    </div>

    <!-- Activity stats -->
    ${statsHtml}

    <!-- Summary -->
    ${summaryHtml}

    <!-- Highlights -->
    ${highlightsHtml}

    <!-- Next Steps -->
    ${nextStepsHtml}

    <!-- Full report body -->
    ${bodyHtml}

    <!-- Footer -->
    <div class="footer">
      <span>Prepared by <span class="footer-brand">${agencyName}</span></span>
      <span>${formatDate(weekStartDate)} – ${formatDate(weekEndDate)}</span>
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700,scrollbars=yes");
  if (!win) {
    // Fallback if pop-up was blocked
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.html`;
    a.click();
    URL.revokeObjectURL(url);
    return;
  }
  win.document.write(html);
  win.document.close();
}
