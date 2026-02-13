import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Share2,
  Image,
  FileText,
  Loader2,
  AlertCircle,
  FileCode,
  FileImage,
  Printer,
  FileDown,
} from 'lucide-react';
import { battlecardService } from '@/services';
import type { BattleCardResult } from '@/types';
import { cn } from '@/utils';

/** Detect special battle card section types */
function getSectionType(text: string): string {
  const l = text.toLowerCase();
  if (l.includes('caution') || l.includes('their strength')) return 'danger';
  if (l.includes('advantage') || l.includes('their weakness')) return 'success';
  if (l.includes('objection')) return 'objection';
  if (l.includes('killer question')) return 'warning';
  if (l.includes('landmine') || l.includes('trap')) return 'danger';
  if (l.includes('feature') || l.includes('comparison')) return 'info';
  if (l.includes('positioning') || l.includes('summary')) return 'purple';
  if (l.includes('quick stat')) return 'stats';
  return '';
}

/** Inline markdown formatting */
function fmt(text: string): string {
  // Bold+italic
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<b class="bi">$1</b>');
  // Bold with colon → colored label badge
  text = text.replace(/\*\*(.+?:)\*\*/g, '<span class="lbl">$1</span>');
  // Bold → strong tag
  text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  // Italic (single *)
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  // Inline code
  text = text.replace(/`(.+?)`/g, '<code>$1</code>');
  return text;
}

function buildFallbackHtml(rawText: string): string {
  const esc = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const lines = esc.split('\n');
  const o: string[] = [];
  let inList: 'ul' | 'ol' | '' = '';
  let cardOpen = false;

  const closeList = () => { if (inList) { o.push(`</${inList}>`); inList = ''; } };
  const closeCard = () => { if (cardOpen) { o.push('</section>'); cardOpen = false; } };
  const openSection = (tag: string, content: string, stype: string) => {
    closeList(); closeCard();
    const icon = { danger: '&#9888;', success: '&#10003;', objection: '&#128172;', warning: '&#10071;', info: '&#9432;', purple: '&#127919;', stats: '&#128202;' }[stype] || '';
    o.push(`<${tag} class="sec sec-${stype || 'default'}">${icon ? `<span class="sec-icon">${icon}</span>` : ''}${fmt(content)}</${tag}>`);
    o.push(`<section class="card card-${stype || 'default'}">`);
    cardOpen = true;
  };

  for (const line of lines) {
    const t = line.trim();

    // ── Markdown headers ──
    const h3 = t.match(/^###\s+(.+)$/);
    const h2 = !h3 && t.match(/^##\s+(.+)$/);
    const h1 = !h3 && !h2 && t.match(/^#\s+(.+)$/);
    if (h1 || h2 || h3) {
      const m = (h1 || h2 || h3)!;
      const tag = h1 ? 'h2' : h2 ? 'h2' : 'h3';
      const stype = getSectionType(m[1]);
      if (tag === 'h3') {
        // h3 = subsection header within a card
        closeList();
        o.push(`<h3 class="sub-sec ${stype ? 'sub-' + stype : ''}">${fmt(m[1])}</h3>`);
      } else {
        openSection(tag, m[1], stype);
      }
      continue;
    }

    // ── Plain-text section headers (no # prefix) ──
    if (
      t && !t.startsWith('*') && !t.startsWith('-') && !t.startsWith('•') &&
      !/^\d+\./.test(t) && t.length < 120 && /^[A-Z]/.test(t) && getSectionType(t)
    ) {
      openSection('h2', t, getSectionType(t));
      continue;
    }

    // ── Horizontal rule ──
    if (/^[-*_]{3,}\s*$/.test(t)) { closeList(); o.push('<hr>'); continue; }

    // ── Bold-only line → subheading ──
    const boldLine = t.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldLine && t.length < 100 && !t.match(/^[*\-•]\s/)) {
      closeList();
      o.push(`<div class="subhead">${boldLine[1].replace(/:$/, '')}</div>`);
      continue;
    }

    // ── Bullet list ──
    const bul = t.match(/^[*\-•]\s+(.+)$/);
    if (bul) {
      if (inList !== 'ul') { closeList(); o.push('<ul>'); inList = 'ul'; }
      o.push(`<li>${fmt(bul[1])}</li>`);
      continue;
    }

    // ── Numbered list ──
    const num = t.match(/^\d+\.\s+(.+)$/);
    if (num) {
      if (inList !== 'ol') { closeList(); o.push('<ol>'); inList = 'ol'; }
      o.push(`<li>${fmt(num[1])}</li>`);
      continue;
    }

    // ── Empty line ──
    if (t === '') { closeList(); continue; }

    // ── Regular paragraph ──
    closeList();
    o.push(`<p>${fmt(t)}</p>`);
  }

  closeList(); closeCard();
  const body = o.join('\n');

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Battle Card</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}

:root{
  --blue:#3b82f6; --navy:#0f172a; --slate:#334155; --light:#f8fafc; --border:#e2e8f0;
  --red:#ef4444; --green:#22c55e; --purple:#8b5cf6; --amber:#f59e0b; --orange:#f97316; --cyan:#0ea5e9;
}

body{font-family:'Inter',system-ui,sans-serif;background:#f1f5f9;color:var(--navy);line-height:1.7;-webkit-font-smoothing:antialiased}

/* ═══ HEADER ═══ */
.hdr{background:linear-gradient(135deg,#1e3a5f,var(--navy));color:#fff;padding:56px 48px 48px;position:relative;overflow:hidden}
.hdr::after{content:'';position:absolute;top:-40%;right:-8%;width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,.12),transparent 70%)}
.hdr .badge{display:inline-block;background:rgba(59,130,246,.18);border:1px solid rgba(59,130,246,.35);color:#93c5fd;padding:5px 16px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px}
.hdr h1{font-size:32px;font-weight:900;letter-spacing:-.5px;margin:0 0 4px}
.hdr .sub{font-size:14px;opacity:.55}

/* ═══ BODY ═══ */
.body{max-width:920px;margin:0 auto;padding:32px 20px 80px}

/* ═══ SECTION HEADINGS ═══ */
.sec{
  font-size:17px;font-weight:800;color:var(--navy);margin:36px 0 0;
  padding:18px 24px 14px 24px;background:#fff;
  border:1px solid var(--border);border-left:5px solid var(--blue);
  border-radius:10px 10px 0 0;display:flex;align-items:center;gap:10px;
}
.sec-icon{font-size:18px;opacity:.6;flex-shrink:0}
.sec-danger{border-left-color:var(--red)}
.sec-success{border-left-color:var(--green)}
.sec-objection{border-left-color:var(--purple)}
.sec-warning{border-left-color:var(--orange)}
.sec-info{border-left-color:var(--cyan)}
.sec-purple{border-left-color:var(--purple)}
.sec-stats{border-left-color:#6366f1}

/* ═══ CARDS ═══ */
section.card{
  background:#fff;border:1px solid var(--border);border-top:none;
  border-radius:0 0 10px 10px;padding:8px 0 16px;margin-bottom:12px;
}
.card-danger{background:#fef2f2;border-left:3px solid #fecaca}
.card-success{background:#f0fdf4;border-left:3px solid #bbf7d0}
.card-objection{background:#faf5ff;border-left:3px solid #ddd6fe}
.card-warning{background:#fffbeb;border-left:3px solid #fde68a}

/* ═══ SUB-SECTION (### inside card) ═══ */
.sub-sec{
  font-size:14.5px;font-weight:700;color:var(--navy);margin:0;
  padding:16px 24px 8px;background:rgba(0,0,0,.02);
  border-top:1px dashed var(--border);
}
.sub-sec:first-child{border-top:none}
.sub-objection{color:var(--purple)}

/* ═══ SUBHEAD (bold-only line) ═══ */
.subhead{
  font-size:14px;font-weight:800;color:var(--navy);
  padding:18px 24px 6px;letter-spacing:-.2px;
  border-bottom:2px solid var(--border);margin:0 24px;
}

/* ═══ PARAGRAPHS ═══ */
p{font-size:14px;line-height:1.8;color:var(--slate);padding:6px 24px}

/* ═══ BOLD LABEL (text ending with colon) ═══ */
.lbl{
  font-weight:800;color:var(--navy);display:inline;
  background:linear-gradient(to top,rgba(59,130,246,.15) 0%,rgba(59,130,246,.15) 35%,transparent 35%);
  padding:0 3px;border-radius:2px;
}

/* ═══ INLINE ═══ */
b{font-weight:800;color:var(--navy)}
b.bi{font-weight:800;color:var(--navy);font-style:italic}
i{color:#475569;font-style:italic}
code{font-family:'SF Mono',Consolas,monospace;font-size:12px;background:#f1f5f9;color:#dc2626;padding:2px 6px;border-radius:4px}

/* ═══ LISTS ═══ */
ul,ol{margin:0;padding:6px 24px 6px 52px;list-style:none}
ol{counter-reset:ol}

li{
  font-size:14px;line-height:1.75;color:var(--slate);
  padding:10px 0;border-bottom:1px solid rgba(0,0,0,.04);position:relative;
}
li:last-child{border-bottom:none}

/* bullet dots */
ul>li::before{
  content:'';position:absolute;left:-20px;top:18px;
  width:7px;height:7px;border-radius:50%;background:var(--blue);
}
/* numbered badges */
ol>li{counter-increment:ol;padding-left:4px}
ol>li::before{
  content:counter(ol);position:absolute;left:-32px;top:9px;
  width:24px;height:24px;border-radius:7px;background:#eff6ff;color:var(--blue);
  font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;
}

/* colored list markers per card type */
.card-danger ul>li::before{background:var(--red)}
.card-success ul>li::before{background:var(--green)}
.card-danger ol>li::before{background:#fef2f2;color:var(--red)}
.card-success ol>li::before{background:#f0fdf4;color:var(--green)}
.card-objection ol>li::before{background:#f5f3ff;color:var(--purple)}
.card-warning ol>li::before{background:#fffbeb;color:var(--orange)}

/* bold labels inside lists are extra prominent */
li .lbl{
  display:inline-block;margin-bottom:2px;font-size:13.5px;
  background:linear-gradient(to top,rgba(59,130,246,.18) 0%,rgba(59,130,246,.18) 40%,transparent 40%);
}
.card-danger li .lbl{
  background:linear-gradient(to top,rgba(239,68,68,.15) 0%,rgba(239,68,68,.15) 40%,transparent 40%);
  color:#b91c1c;
}
.card-success li .lbl{
  background:linear-gradient(to top,rgba(34,197,94,.15) 0%,rgba(34,197,94,.15) 40%,transparent 40%);
  color:#15803d;
}
.card-objection li .lbl{
  background:linear-gradient(to top,rgba(139,92,246,.15) 0%,rgba(139,92,246,.15) 40%,transparent 40%);
  color:#6d28d9;
}

/* bold inside li */
li b{font-weight:800;color:var(--navy)}

hr{border:none;height:1px;background:var(--border);margin:28px 0}

/* ═══ RESPONSIVE ═══ */
@media(max-width:640px){
  .hdr{padding:36px 20px 32px}
  .hdr h1{font-size:24px}
  .body{padding:20px 8px 60px}
  .sec,p,.subhead,.sub-sec{padding-left:16px;padding-right:16px}
  ul,ol{padding-left:36px}
  .subhead{margin:0 16px}
}

/* ═══ PRINT ═══ */
@media print{
  body{background:#fff}
  .hdr{break-after:avoid;padding:32px}
  .sec{break-after:avoid}
  section.card{break-inside:avoid}
  li{break-inside:avoid}
}
</style>
</head><body>
<div class="hdr">
  <div class="badge">Competitive Battle Card</div>
  <h1>Battle Card Analysis</h1>
  <div class="sub">AI-Generated Competitive Intelligence for Sales Teams</div>
</div>
<div class="body">
${body}
</div>
</body></html>`;
}

export function BattleCardPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [result, setResult] = useState<BattleCardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'card' | 'infographic'>('card');

  useEffect(() => {
    if (!jobId) return;

    const fetchResult = async () => {
      try {
        const data = await battlecardService.getResult(jobId);
        setResult(data);
      } catch {
        setError('Failed to load battle card. It may still be processing.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [jobId]);

  // Resolve the HTML to display: prefer battle_card_html, fallback to raw_output
  const displayHtml =
    result?.battle_card_html ??
    (result?.raw_output && typeof result.raw_output === 'object' && 'final_text' in result.raw_output
      ? buildFallbackHtml((result.raw_output as Record<string, string>).final_text)
      : null);

  const handleDownloadHtml = () => {
    if (!displayHtml) return;
    const blob = new Blob([displayHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle_card_${jobId}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadImage = () => {
    if (!result?.infographic_base64) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${result.infographic_base64}`;
    a.download = `comparison_${jobId}.png`;
    a.click();
  };

  const handleDownloadText = () => {
    if (!result?.raw_output) return;
    const text =
      typeof result.raw_output === 'object' && 'final_text' in result.raw_output
        ? (result.raw_output as Record<string, string>).final_text
        : JSON.stringify(result.raw_output, null, 2);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle_card_${jobId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    if (!displayHtml) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(displayHtml);
    win.document.close();
    win.onload = () => {
      win.print();
    };
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-3 text-sm text-gray-500">Loading battle card...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm text-gray-700">{error || 'Battle card not found.'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white px-6 py-3">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Dashboard
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <span className="text-sm font-medium text-gray-900">
              Battle Card: {jobId}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {result.infographic_base64 && (
              <button
                onClick={handleDownloadImage}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Image className="h-4 w-4" />
                Download Chart
              </button>
            )}
            {displayHtml && (
              <button
                onClick={handleDownloadHtml}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Download HTML
              </button>
            )}
            <button className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-6">
            <button
              onClick={() => setActiveTab('card')}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                activeTab === 'card'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              )}
            >
              <FileText className="h-4 w-4" />
              Battle Card
            </button>
            {result.infographic_base64 && (
              <button
                onClick={() => setActiveTab('infographic')}
                className={cn(
                  'flex items-center gap-2 border-b-2 px-1 py-3 text-sm font-medium transition-colors',
                  activeTab === 'infographic'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                )}
              >
                <Image className="h-4 w-4" />
                Comparison Infographic
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {activeTab === 'card' && displayHtml && (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <iframe
              srcDoc={displayHtml}
              title="Battle Card"
              className="h-[800px] w-full border-0"
              sandbox="allow-same-origin"
            />
          </div>
        )}

        {activeTab === 'card' && !displayHtml && (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <FileText className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">
              No battle card content was generated for this job.
            </p>
          </div>
        )}

        {activeTab === 'infographic' && result.infographic_base64 && (
          <div className="flex justify-center rounded-xl border border-gray-200 bg-white p-8">
            <img
              src={`data:image/png;base64,${result.infographic_base64}`}
              alt="Comparison Infographic"
              className="max-w-full rounded-lg"
            />
          </div>
        )}

        {/* Download Section */}
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">
            Download & Export
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* HTML Download */}
            {displayHtml && (
              <button
                onClick={handleDownloadHtml}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">HTML File</p>
                  <p className="text-xs text-gray-500">Full styled battle card</p>
                </div>
                <Download className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
              </button>
            )}

            {/* PNG Download */}
            {result.infographic_base64 && (
              <button
                onClick={handleDownloadImage}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-purple-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                  <FileImage className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Infographic</p>
                  <p className="text-xs text-gray-500">Comparison chart PNG</p>
                </div>
                <Download className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-purple-500" />
              </button>
            )}

            {/* Print / PDF */}
            {displayHtml && (
              <button
                onClick={handlePrint}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-green-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Print / PDF</p>
                  <p className="text-xs text-gray-500">Print or save as PDF</p>
                </div>
                <FileDown className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-green-500" />
              </button>
            )}

            {/* Raw Text Download */}
            {result.raw_output && (
              <button
                onClick={handleDownloadText}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Raw Text</p>
                  <p className="text-xs text-gray-500">Plain text export</p>
                </div>
                <Download className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-amber-500" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
