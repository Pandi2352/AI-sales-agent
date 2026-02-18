import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface TocEntry {
  label: string;
}

interface PdfExportOptions {
  html: string;
  jobId: string;
  tocEntries: TocEntry[];
}

/**
 * Build a self-contained HTML string ready for off-screen rendering.
 * Includes a branded header, table of contents, and the battle card body.
 */
function buildPdfHtml(
  html: string,
  jobId: string,
  tocEntries: TocEntry[],
): string {
  // Extract <style> blocks
  const styleTags = html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || [];
  const styles = styleTags.join('\n');

  // Extract <body> content (fall back to entire string)
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const body = bodyMatch ? bodyMatch[1] : html;

  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const tocRows = tocEntries
    .map(
      (e, i) =>
        `<li style="padding:6px 0;color:#334155;font-size:13px;border-bottom:1px solid #f1f5f9;">
          <span style="color:#3b82f6;font-weight:700;margin-right:8px;">${String(i + 1).padStart(2, '0')}</span>
          ${e.label}
        </li>`,
    )
    .join('');

  const tocBlock =
    tocEntries.length > 0
      ? `<div style="margin:0 auto;max-width:920px;padding:28px 20px 0;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:24px 28px;">
            <h3 style="font-family:Inter,system-ui,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin:0 0 16px;">Table of Contents</h3>
            <ol style="list-style:none;margin:0;padding:0;">${tocRows}</ol>
          </div>
        </div>`
      : '';

  return `
    ${styles}
    <style>
      *, *::before, *::after { box-sizing: border-box; }
    </style>
    <div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);color:#fff;padding:44px 48px 36px;font-family:Inter,system-ui,sans-serif;">
      <div style="display:inline-block;background:rgba(59,130,246,.18);border:1px solid rgba(59,130,246,.35);color:#93c5fd;padding:5px 16px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:14px;">
        AI Sales Agent
      </div>
      <h1 style="font-size:28px;font-weight:900;letter-spacing:-.5px;margin:0 0 6px;color:#fff;">
        Battle Card Analysis
      </h1>
      <div style="font-size:12px;opacity:.55;">
        Job: ${jobId} &nbsp;|&nbsp; Generated: ${today}
      </div>
    </div>
    ${tocBlock}
    ${body}
  `;
}

/**
 * Render the given battle card HTML to a branded, multi-page PDF and trigger
 * a one-click download. Includes a branded header, optional TOC, and page
 * numbers on every page.
 */
export async function exportBattleCardPdf({
  html,
  jobId,
  tocEntries,
}: PdfExportOptions): Promise<void> {
  // 1. Create hidden off-screen container
  const wrapper = document.createElement('div');
  wrapper.style.cssText =
    'position:fixed;left:-9999px;top:0;width:794px;background:#f1f5f9;z-index:-1;';
  document.body.appendChild(wrapper);

  wrapper.innerHTML = buildPdfHtml(html, jobId, tocEntries);

  // 2. Wait for fonts & images to settle
  await document.fonts.ready;
  await new Promise((r) => setTimeout(r, 300));

  try {
    // 3. Capture the entire container as a high-res canvas
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      width: 794,
      windowWidth: 794,
    });

    // 4. Create PDF (A4 portrait)
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const footerHeight = 12;
    const contentWidth = pageWidth - 2 * margin;
    const contentHeight = pageHeight - 2 * margin - footerHeight;

    // How tall the canvas is in mm at the target width
    const imgTotalHeight = (canvas.height * contentWidth) / canvas.width;
    const totalPages = Math.ceil(imgTotalHeight / contentHeight);

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage();

      // Slice source canvas for this page
      const srcY = Math.round(
        (i * contentHeight * canvas.width) / contentWidth,
      );
      const srcH = Math.min(
        Math.round((contentHeight * canvas.width) / contentWidth),
        canvas.height - srcY,
      );

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = srcH;

      const ctx = pageCanvas.getContext('2d');
      if (!ctx) continue;
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      const sliceImgHeight = (srcH * contentWidth) / canvas.width;
      const imgData = pageCanvas.toDataURL('image/jpeg', 0.92);

      pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, sliceImgHeight);

      // ── Footer: accent line + page number ──
      const lineY = pageHeight - margin - footerHeight + 2;
      pdf.setDrawColor(59, 130, 246);
      pdf.setLineWidth(0.4);
      pdf.line(margin, lineY, pageWidth - margin, lineY);

      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(
        `Page ${i + 1} of ${totalPages}`,
        pageWidth / 2,
        lineY + 6,
        { align: 'center' },
      );

      pdf.setTextColor(180);
      pdf.text('AI Sales Agent', margin, lineY + 6);
    }

    // 5. Download
    pdf.save(`battle_card_${jobId}.pdf`);
  } finally {
    // 6. Cleanup
    document.body.removeChild(wrapper);
  }
}
