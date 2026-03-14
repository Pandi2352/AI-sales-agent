import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Share2,
  Image,
  FileText,
  AlertCircle,
  FileCode,
  FileImage,
  FileDown,
  MoreVertical,
  List,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { battlecardService } from '@/services';
import type { BattleCardResult } from '@/types';
import { cn } from '@/utils';
import { Skeleton } from '@/components/common';
import { usePageTitle } from '@/hooks';

// ── HTML Parsing Helpers ─────────────────────────────────────────────

interface TocSection {
  id: string;
  label: string;
}

/** Clean a heading's textContent into a short TOC label. */
function cleanTocLabel(raw: string): string {
  return raw
    .replace(/^(CAUTION|ADVANTAGE|COMPETITIVE)\s*/i, '')
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '') // strip emoji
    .trim();
}

// ── Fallback HTML Builder ────────────────────────────────────────────

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
  text = text.replace(/\*\*\*(.+?)\*\*\*/g, '<b class="bi">$1</b>');
  text = text.replace(/\*\*(.+?:)\*\*/g, '<span class="lbl">$1</span>');
  text = text.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
  text = text.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
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

  const closeList = () => {
    if (inList) {
      o.push(`</${inList}>`);
      inList = '';
    }
  };
  const closeCard = () => {
    if (cardOpen) {
      o.push('</section>');
      cardOpen = false;
    }
  };
  const openSection = (tag: string, content: string, stype: string) => {
    closeList();
    closeCard();
    const icon =
      {
        danger: '&#9888;',
        success: '&#10003;',
        objection: '&#128172;',
        warning: '&#10071;',
        info: '&#9432;',
        purple: '&#127919;',
        stats: '&#128202;',
      }[stype] || '';
    o.push(
      `<${tag} class="sec sec-${stype || 'default'}">${icon ? `<span class="sec-icon">${icon}</span>` : ''}${fmt(content)}</${tag}>`,
    );
    o.push(`<section class="card card-${stype || 'default'}">`);
    cardOpen = true;
  };

  for (const line of lines) {
    const t = line.trim();
    const h3 = t.match(/^###\s+(.+)$/);
    const h2 = !h3 && t.match(/^##\s+(.+)$/);
    const h1 = !h3 && !h2 && t.match(/^#\s+(.+)$/);
    if (h1 || h2 || h3) {
      const m = (h1 || h2 || h3)!;
      const tag = h1 ? 'h2' : h2 ? 'h2' : 'h3';
      const stype = getSectionType(m[1]);
      if (tag === 'h3') {
        closeList();
        o.push(
          `<h3 class="sub-sec ${stype ? 'sub-' + stype : ''}">${fmt(m[1])}</h3>`,
        );
      } else {
        openSection(tag, m[1], stype);
      }
      continue;
    }
    if (
      t &&
      !t.startsWith('*') &&
      !t.startsWith('-') &&
      !t.startsWith('•') &&
      !/^\d+\./.test(t) &&
      t.length < 120 &&
      /^[A-Z]/.test(t) &&
      getSectionType(t)
    ) {
      openSection('h2', t, getSectionType(t));
      continue;
    }
    if (/^[-*_]{3,}\s*$/.test(t)) {
      closeList();
      o.push('<hr>');
      continue;
    }
    const boldLine = t.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldLine && t.length < 100 && !t.match(/^[*\-•]\s/)) {
      closeList();
      o.push(`<div class="subhead">${boldLine[1].replace(/:$/, '')}</div>`);
      continue;
    }
    const bul = t.match(/^[*\-•]\s+(.+)$/);
    if (bul) {
      if (inList !== 'ul') {
        closeList();
        o.push('<ul>');
        inList = 'ul';
      }
      o.push(`<li>${fmt(bul[1])}</li>`);
      continue;
    }
    const num = t.match(/^\d+\.\s+(.+)$/);
    if (num) {
      if (inList !== 'ol') {
        closeList();
        o.push('<ol>');
        inList = 'ol';
      }
      o.push(`<li>${fmt(num[1])}</li>`);
      continue;
    }
    if (t === '') {
      closeList();
      continue;
    }
    closeList();
    o.push(`<p>${fmt(t)}</p>`);
  }

  closeList();
  closeCard();
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

.hdr{background:linear-gradient(135deg,#1e3a5f,var(--navy));color:#fff;padding:56px 48px 48px;position:relative;overflow:hidden}
.hdr::after{content:'';position:absolute;top:-40%;right:-8%;width:500px;height:500px;background:radial-gradient(circle,rgba(99,102,241,.12),transparent 70%)}
.hdr .badge{display:inline-block;background:rgba(59,130,246,.18);border:1px solid rgba(59,130,246,.35);color:#93c5fd;padding:5px 16px;border-radius:20px;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:16px}
.hdr h1{font-size:32px;font-weight:900;letter-spacing:-.5px;margin:0 0 4px}
.hdr .sub{font-size:14px;opacity:.55}

.body{max-width:920px;margin:0 auto;padding:32px 20px 80px}

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

section.card{
  background:#fff;border:1px solid var(--border);border-top:none;
  border-radius:0 0 10px 10px;padding:8px 0 16px;margin-bottom:12px;
}
.card-danger{background:#fef2f2;border-left:3px solid #fecaca}
.card-success{background:#f0fdf4;border-left:3px solid #bbf7d0}
.card-objection{background:#faf5ff;border-left:3px solid #ddd6fe}
.card-warning{background:#fffbeb;border-left:3px solid #fde68a}

.sub-sec{
  font-size:14.5px;font-weight:700;color:var(--navy);margin:0;
  padding:16px 24px 8px;background:rgba(0,0,0,.02);
  border-top:1px dashed var(--border);
}
.sub-sec:first-child{border-top:none}
.sub-objection{color:var(--purple)}

.subhead{
  font-size:14px;font-weight:800;color:var(--navy);
  padding:18px 24px 6px;letter-spacing:-.2px;
  border-bottom:2px solid var(--border);margin:0 24px;
}

p{font-size:14px;line-height:1.8;color:var(--slate);padding:6px 24px}

.lbl{
  font-weight:800;color:var(--navy);display:inline;
  background:linear-gradient(to top,rgba(59,130,246,.15) 0%,rgba(59,130,246,.15) 35%,transparent 35%);
  padding:0 3px;border-radius:2px;
}

b{font-weight:800;color:var(--navy)}
b.bi{font-weight:800;color:var(--navy);font-style:italic}
i{color:#475569;font-style:italic}
code{font-family:'SF Mono',Consolas,monospace;font-size:12px;background:#f1f5f9;color:#dc2626;padding:2px 6px;border-radius:4px}

ul,ol{margin:0;padding:6px 24px 6px 52px;list-style:none}
ol{counter-reset:ol}

li{
  font-size:14px;line-height:1.75;color:var(--slate);
  padding:10px 0;border-bottom:1px solid rgba(0,0,0,.04);position:relative;
}
li:last-child{border-bottom:none}

ul>li::before{
  content:'';position:absolute;left:-20px;top:18px;
  width:7px;height:7px;border-radius:50%;background:var(--blue);
}
ol>li{counter-increment:ol;padding-left:4px}
ol>li::before{
  content:counter(ol);position:absolute;left:-32px;top:9px;
  width:24px;height:24px;border-radius:7px;background:#eff6ff;color:var(--blue);
  font-size:11px;font-weight:800;display:flex;align-items:center;justify-content:center;
}

.card-danger ul>li::before{background:var(--red)}
.card-success ul>li::before{background:var(--green)}
.card-danger ol>li::before{background:#fef2f2;color:var(--red)}
.card-success ol>li::before{background:#f0fdf4;color:var(--green)}
.card-objection ol>li::before{background:#f5f3ff;color:var(--purple)}
.card-warning ol>li::before{background:#fffbeb;color:var(--orange)}

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

li b{font-weight:800;color:var(--navy)}

hr{border:none;height:1px;background:var(--border);margin:28px 0}

@media(max-width:640px){
  .hdr{padding:36px 20px 32px}
  .hdr h1{font-size:24px}
  .body{padding:20px 8px 60px}
  .sec,p,.subhead,.sub-sec{padding-left:16px;padding-right:16px}
  ul,ol{padding-left:36px}
  .subhead{margin:0 16px}
}

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

// ── Main Component ───────────────────────────────────────────────────

export function BattleCardPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  usePageTitle(`Battle Card: ${jobId ?? ''}`);
  const [result, setResult] = useState<BattleCardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'card' | 'infographic'>('card');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Iframe renderer + TOC state
  const cardFrameRef = useRef<HTMLIFrameElement>(null);
  const frameCleanupRef = useRef<(() => void) | null>(null);
  const [tocSections, setTocSections] = useState<TocSection[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);
  const [pdfExporting, setPdfExporting] = useState(false);
  const [cardFrameHeight, setCardFrameHeight] = useState(900);

  // Close mobile menu on outside click
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [mobileMenuOpen]);

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

  // Resolve the HTML to display
  const displayHtml =
    result?.battle_card_html ??
    (result?.raw_output &&
    typeof result.raw_output === 'object' &&
    'final_text' in result.raw_output
      ? buildFallbackHtml(
          (result.raw_output as Record<string, string>).final_text,
        )
      : null);

  // ── Iframe rendering + section scanning ──────────────────────

  const syncCardFrame = useCallback(() => {
    const frame = cardFrameRef.current;
    const doc = frame?.contentDocument;
    const win = frame?.contentWindow;
    if (!frame || !doc || !win) return;

    frameCleanupRef.current?.();
    frameCleanupRef.current = null;

    const headings = Array.from(doc.querySelectorAll<HTMLHeadingElement>('h2'));
    const sections: TocSection[] = headings.map((el, i) => {
      const id = `bc-sec-${i}`;
      el.setAttribute('id', id);
      const raw = el.textContent?.trim() || `Section ${i + 1}`;
      return { id, label: cleanTocLabel(raw) };
    });

    setTocSections(sections);
    setActiveSection((prev) => {
      if (prev && sections.some((section) => section.id === prev)) return prev;
      return sections[0]?.id ?? null;
    });

    const updateHeight = () => {
      const bodyHeight = doc.body?.scrollHeight ?? 0;
      const rootHeight = doc.documentElement?.scrollHeight ?? 0;
      setCardFrameHeight(Math.max(bodyHeight, rootHeight, 900));
    };

    const updateActiveSection = () => {
      if (headings.length === 0) return;
      const y = win.scrollY + 120;
      let currentId = headings[0].id;
      for (const heading of headings) {
        const top = heading.getBoundingClientRect().top + win.scrollY;
        if (top <= y) currentId = heading.id;
        else break;
      }
      setActiveSection(currentId);
    };

    updateHeight();
    updateActiveSection();

    const handleScroll = () => updateActiveSection();
    const handleResize = () => {
      updateHeight();
      updateActiveSection();
    };

    win.addEventListener('scroll', handleScroll, { passive: true });
    win.addEventListener('resize', handleResize);

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => updateHeight())
        : null;
    if (observer && doc.documentElement) observer.observe(doc.documentElement);
    if (observer && doc.body) observer.observe(doc.body);

    const lateMeasure = win.setTimeout(updateHeight, 300);

    frameCleanupRef.current = () => {
      win.removeEventListener('scroll', handleScroll);
      win.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
      win.clearTimeout(lateMeasure);
    };
  }, []);

  useEffect(() => {
    if (activeTab === 'card' && displayHtml) return;
    frameCleanupRef.current?.();
    frameCleanupRef.current = null;
    setTocSections([]);
    setActiveSection(null);
    setMobileTocOpen(false);
  }, [activeTab, displayHtml]);

  useEffect(
    () => () => {
      frameCleanupRef.current?.();
      frameCleanupRef.current = null;
    },
    [],
  );

  const handleCardFrameLoad = useCallback(() => {
    if (activeTab !== 'card' || !displayHtml) return;
    syncCardFrame();
  }, [activeTab, displayHtml, syncCardFrame]);

  const scrollToSection = useCallback((id: string) => {
    const frame = cardFrameRef.current;
    const el = frame?.contentDocument?.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(id);
      setMobileTocOpen(false);
    }
  }, []);

  // ── Download / Share / Print handlers ────────────────────────────

  const handleDownloadHtml = () => {
    if (!displayHtml) return;
    const blob = new Blob([displayHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `battle_card_${jobId}.html`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('HTML battle card downloaded');
  };

  const handleDownloadImage = () => {
    if (!result?.infographic_base64) return;
    const a = document.createElement('a');
    a.href = `data:image/png;base64,${result.infographic_base64}`;
    a.download = `comparison_${jobId}.png`;
    a.click();
    toast.success('Comparison chart downloaded');
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
    toast.success('Raw text file downloaded');
  };

  const handleDownloadPdf = async () => {
    if (!displayHtml || !jobId) return;
    setPdfExporting(true);
    try {
      const { exportBattleCardPdf } = await import('@/utils/pdfExport');
      await exportBattleCardPdf({
        html: displayHtml,
        jobId,
        tocEntries: tocSections,
      });
      toast.success('PDF downloaded');
    } catch {
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setPdfExporting(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  // ── Loading state ────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="border-b border-gray-200 bg-white px-6 py-3">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <div className="h-5 w-px bg-gray-200" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-32 rounded-lg" />
              <Skeleton className="h-9 w-20 rounded-lg" />
            </div>
          </div>
        </div>
        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex gap-6 py-3">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-44" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex gap-6">
            <div className="hidden w-52 shrink-0 lg:block">
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
            <div className="flex-1">
              <Skeleton className="h-[500px] w-full rounded-xl" />
            </div>
          </div>
          <div className="mt-8">
            <Skeleton className="mb-4 h-4 w-36" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4"
                >
                  <Skeleton className="h-11 w-11 shrink-0 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton className="mb-1.5 h-4 w-20" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────

  if (error || !result) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="max-w-sm text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-red-400" />
          <p className="mt-3 text-sm text-gray-700">
            {error || 'Battle card not found.'}
          </p>
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

  // ── Main render ──────────────────────────────────────────────────

  const hasToc = tocSections.length > 0 && activeTab === 'card';

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

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 sm:flex">
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
                onClick={handleDownloadPdf}
                disabled={pdfExporting}
                className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
              >
                {pdfExporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {pdfExporting ? 'Generating...' : 'Download PDF'}
              </button>
            )}
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>

          {/* Mobile actions dropdown */}
          <div ref={menuRef} className="relative sm:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              aria-label="Actions"
            >
              <MoreVertical className="h-4 w-4" />
            </button>
            {mobileMenuOpen && (
              <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                {displayHtml && (
                  <button
                    onClick={() => {
                      handleDownloadHtml();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Download className="h-4 w-4 text-gray-400" />
                    Download HTML
                  </button>
                )}
                {result.infographic_base64 && (
                  <button
                    onClick={() => {
                      handleDownloadImage();
                      setMobileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Image className="h-4 w-4 text-gray-400" />
                    Download Chart
                  </button>
                )}
                {displayHtml && (
                  <button
                    onClick={() => {
                      handleDownloadPdf();
                      setMobileMenuOpen(false);
                    }}
                    disabled={pdfExporting}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                  >
                    {pdfExporting ? (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    ) : (
                      <FileDown className="h-4 w-4 text-gray-400" />
                    )}
                    {pdfExporting ? 'Generating...' : 'Download PDF'}
                  </button>
                )}
                <button
                  onClick={() => {
                    handleShare();
                    setMobileMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Share2 className="h-4 w-4 text-gray-400" />
                  Share Link
                </button>
              </div>
            )}
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
          <div className="flex gap-6">
            {/* TOC Sidebar — Desktop */}
            {hasToc && (
              <aside className="hidden w-52 shrink-0 lg:block">
                <nav className="sticky top-20 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    Table of Contents
                  </h4>
                  <ul className="space-y-0.5">
                    {tocSections.map((section) => (
                      <li key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            'w-full truncate rounded-md px-3 py-1.5 text-left text-[13px] transition-colors',
                            activeSection === section.id
                              ? 'bg-blue-50 font-semibold text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                          )}
                          title={section.label}
                        >
                          {section.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                </nav>
              </aside>
            )}

            {/* Main card area */}
            <div className="min-w-0 flex-1">
              {/* Mobile TOC toggle */}
              {hasToc && (
                <div className="relative mb-4 lg:hidden">
                  <button
                    onClick={() => setMobileTocOpen(!mobileTocOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <List className="h-4 w-4 text-gray-400" />
                      {tocSections.find((s) => s.id === activeSection)?.label ??
                        'Jump to section'}
                    </span>
                    <ChevronIcon open={mobileTocOpen} />
                  </button>

                  {mobileTocOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      {tocSections.map((section) => (
                        <button
                          key={section.id}
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            'w-full px-4 py-2 text-left text-sm transition-colors',
                            activeSection === section.id
                              ? 'bg-blue-50 font-semibold text-blue-700'
                              : 'text-gray-600 hover:bg-gray-50',
                          )}
                        >
                          {section.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Battle card (iframe srcDoc renderer) */}
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <iframe
                  ref={cardFrameRef}
                  title={`Battle Card ${jobId ?? ''}`}
                  srcDoc={displayHtml}
                  onLoad={handleCardFrameLoad}
                  className="w-full border-0"
                  style={{ height: `${cardFrameHeight}px` }}
                />
              </div>
            </div>
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
            {displayHtml && (
              <button
                onClick={handleDownloadHtml}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-100">
                  <FileCode className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    HTML File
                  </p>
                  <p className="text-xs text-gray-500">
                    Full styled battle card
                  </p>
                </div>
                <Download className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-blue-500" />
              </button>
            )}

            {result.infographic_base64 && (
              <button
                onClick={handleDownloadImage}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-purple-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600 transition-colors group-hover:bg-purple-100">
                  <FileImage className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Infographic
                  </p>
                  <p className="text-xs text-gray-500">
                    Comparison chart PNG
                  </p>
                </div>
                <Download className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-purple-500" />
              </button>
            )}

            {displayHtml && (
              <button
                onClick={handleDownloadPdf}
                disabled={pdfExporting}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-green-300 hover:shadow-md disabled:opacity-60"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                  {pdfExporting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <FileDown className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {pdfExporting ? 'Generating PDF...' : 'Download PDF'}
                  </p>
                  <p className="text-xs text-gray-500">
                    Branded PDF with table of contents
                  </p>
                </div>
                <Download className="ml-auto h-4 w-4 text-gray-300 transition-colors group-hover:text-green-500" />
              </button>
            )}

            {result.raw_output && (
              <button
                onClick={handleDownloadText}
                className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-amber-300 hover:shadow-md"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 transition-colors group-hover:bg-amber-100">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Raw Text
                  </p>
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

// ── Small helpers ────────────────────────────────────────────────────

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={cn(
        'h-4 w-4 text-gray-400 transition-transform duration-200',
        open && 'rotate-180',
      )}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

