<div align="center">

# AI Sales Agent — Roadmap

### Feature Plans, UI Optimization & Enhancement Strategy

[![Status](https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge)]()
[![Phase](https://img.shields.io/badge/Current_Phase-3-blue?style=for-the-badge)]()
[![Last Updated](https://img.shields.io/badge/Updated-Feb_2026-orange?style=for-the-badge)]()

</div>

---

## Table of Contents

- [Current State](#-current-state)
- [Phase 1: UI Polish & Quick Wins](#-phase-1-ui-polish--quick-wins)
- [Phase 2: UX Enhancements](#-phase-2-ux-enhancements)
- [Phase 3: New Features](#-phase-3-new-features)
- [Phase 4: UI Optimization & Performance](#-phase-4-ui-optimization--performance)
- [Phase 5: Advanced Roadmap](#-phase-5-advanced-roadmap)
- [Priority Matrix](#-priority-matrix)

---

## Current State

**Stack:** React 19 · TypeScript 5.9 · Vite 7 · Tailwind CSS v4 · Axios · React Router v7 · Lucide Icons · jsPDF · html2canvas

**Core Flow:**

```
Landing Page → Setup Wizard (4-step) → Pipeline Tracker (7 AI Agents) → Battle Card Viewer
                                                                              ↕
                                                                          Dashboard → Compare Mode
```

### Active Pages

| Route | Page | Status |
|---|---|---|
| `/` | Landing Page | Complete — marketing page with Hero, Features, How It Works, CTA |
| `/setup` | Setup Wizard | Complete — 4-step wizard with AI competitor discovery, 4 output templates, sessionStorage persistence |
| `/pipeline/:jobId` | Pipeline Tracker | Complete — real-time 7-stage progress with polling + expandable stage output previews |
| `/battlecard/:jobId` | Battle Card Viewer | Complete — Shadow DOM renderer, TOC sidebar, PDF/HTML/PNG/TXT exports, share link |
| `/dashboard` | Dashboard | Complete — job list with stats, search/filter/sort, multi-select checkboxes, compare mode launch |
| `/compare?jobs=...` | Compare Mode | Complete — side-by-side comparison with tabbed sections (Overview, Features, SWOT, Objections) |

### Active Services

| Service | Endpoints |
|---|---|
| `battlecardService` | `generate`, `getStatus`, `getResult`, `listJobs`, `getStageResult`, `discoverCompetitors` |

---

## Phase 1: UI Polish & Quick Wins ✅

> All items complete.

### 1.1 — Extract Shared App Header ✅

- [x] Reusable `<AppHeader />` component with configurable right-side actions
- [x] Used across all app pages (Dashboard, Setup, Pipeline, BattleCard, Compare)

### 1.2 — Remove Dead / Orphaned Code ✅

- [x] Deleted unused pages: `HomePage`, `AboutPage`
- [x] Deleted unused layout components: `Header`, `Footer`, `RootLayout`
- [x] Cleaned up stale `ROUTES` constants
- [x] Removed `AuthContext` provider
- [x] Audited barrel exports for stale re-exports

### 1.3 — Toast Notification System ✅

- [x] Integrated `sonner` toast library
- [x] Toasts for: download success, share link copied, pipeline started, connection errors
- [x] `<Toaster>` mounted in `App.tsx` with `richColors` and `closeButton`

### 1.4 — Loading Skeletons ✅

- [x] `<Skeleton>` component with shimmer animation
- [x] Dashboard: 3 stat cards + 4 job row skeletons
- [x] BattleCard: header bar + TOC sidebar + content area + download grid skeletons

### 1.5 — Responsive Fixes ✅

- [x] BattleCard uses Shadow DOM (not iframe) — auto-sizes to content
- [x] Mobile dropdown menu for action buttons on small screens
- [x] Mobile TOC dropdown for section navigation

### 1.6 — Favicon & Meta Tags ✅

- [x] Branded `favicon.svg` replaces default `vite.svg`
- [x] `usePageTitle` hook sets per-page `<title>` across all pages

---

## Phase 2: UX Enhancements

### 2.1 — Multi-Step Setup Wizard ✅

- [x] 4-step flow: Project Info → Competitor → Audience & Options → Review & Launch
- [x] `<StepIndicator>` with clickable navigation for completed steps
- [x] Wizard state persisted in `sessionStorage`

### 2.2 — Pipeline Stage Detail Panels ✅

- [x] Completed stages are clickable and expandable
- [x] Clicking reveals per-stage output preview fetched from backend
- [x] Stage results cached client-side after first fetch
- [x] Animated expand/collapse with rotating chevron icon

### 2.3 — Battle Card Section Navigation ✅

- [x] Sticky sidebar Table of Contents on desktop
- [x] Dropdown TOC on mobile
- [x] Active section tracking via `IntersectionObserver`
- [x] Click-to-scroll navigation within Shadow DOM

### 2.4 — Dashboard Search & Filters ✅

- [x] Search bar to filter jobs by ID
- [x] Status filter tabs: `All` | `In Progress` | `Completed` | `Failed` with live counts
- [x] Sort dropdown: Newest First (default), Oldest First, By Status
- [x] Filter-aware empty states with contextual messages and "Clear filters" action

### 2.5 — Job Naming & Metadata ✅

- [x] Backend stores `project_name`, `competitor`, `created_at` (UTC ISO) per job at creation
- [x] `list_jobs` and `get_job_status` endpoints return metadata
- [x] Dashboard shows "Project vs Competitor" title instead of raw job IDs
- [x] Relative timestamps ("5m ago", "2h ago", "3d ago") with full date on hover
- [x] Search matches against project name, competitor, and job ID
- [x] Pipeline page shows "Project vs Competitor" subtitle under the progress header

### 2.6 — Estimated Time Remaining

- [ ] Track average duration per stage and display ETA below progress bar
- [ ] Per-stage estimated duration in the stage list

---

## Phase 3: New Features

### 3.1 — Authentication System

- [ ] Build Login and Register pages
- [ ] Wire up auth provider in `App.tsx`
- [ ] Add route guards for protected pages
- [ ] Show user profile in app header

### 3.2 — Dark Mode

- [ ] System-preference detection + manual toggle
- [ ] Tailwind `dark:` variant classes across all app pages
- [ ] Preference stored in `localStorage`
- [ ] Toggle button in app header

### 3.3 — Compare Mode ✅

- [x] Multi-select checkboxes on completed Dashboard job cards
- [x] Floating "Compare (N)" action bar when 2+ jobs selected
- [x] Side-by-side comparison page at `/compare?jobs=id1,id2,...`
- [x] Tabbed sections: Overview, Features, SWOT, Objections
- [x] Parallel data fetching via `useCompareData` hook

### 3.4 — Battle Card Templates ✅

- [x] 4 output format options in Setup Wizard step 3:
  - **Sales Rep Quick Card** — 1-page summary with key talking points
  - **Executive Summary** — high-level strategic overview
  - **Detailed Analysis** — full 7-section report (default)
  - **Slide Deck Format** — structured for presentations
- [x] `TemplateName` type + `TemplateEnum` on backend
- [x] Template choice passed to backend and appended to AI agent prompt

### 3.5 — History, Favorites & Tags ✅

- [x] Star/bookmark battle cards on Dashboard (persisted in localStorage, starred items float to top)
- [x] Add custom tags per job (inline tag input with Enter to confirm, Escape to cancel)
- [x] Remove tags with one-click ✕ button
- [x] Filter by tag on Dashboard (clickable tag filter chips)
- [x] Filter starred-only toggle
- [x] All tags and stars persist across sessions via `useJobMeta` hook + localStorage

### 3.6 — Shareable Links ✅

- [x] Share button copies current battle card URL to clipboard
- [x] Toast feedback on copy success/failure
- [x] Available on both desktop header and mobile dropdown

### 3.7 — Proper PDF Export ✅

- [x] Client-side PDF generation using `jsPDF` + `html2canvas`
- [x] Branded header with "AI Sales Agent" logo, job ID, and generation date
- [x] Table of contents from battle card section headings
- [x] Page numbers and accent line footer on every page
- [x] One-click download — no print dialog
- [x] Lazy-loaded (code-split) for zero impact on initial bundle

### 3.8 — WebSocket / SSE for Pipeline Updates

- [ ] Replace polling (`setInterval` every 2.5s) with WebSocket or SSE
- [ ] Instant stage transitions and lower server load
- [ ] Graceful fallback to polling if connection fails

---

## Phase 4: UI Optimization & Performance

> Technical improvements for speed and reliability.

### 4.1 — Route-Based Code Splitting

- [ ] Wrap all page imports in `React.lazy()` + `<Suspense>`
- [ ] Add a shared loading fallback component

### 4.2 — Data Fetching with React Query / SWR

- [ ] Replace manual `useState` + `useEffect` + `setInterval` patterns
- [ ] Automatic caching, request deduplication, background refetching, retry logic
- [ ] Improves: `DashboardPage` (polls every 5s), `PipelinePage` (polls every 2.5s)

### 4.3 — Memoization

- [ ] `useMemo` for `buildFallbackHtml()` in `BattleCardPage`
- [ ] Memoize computed values like filtered job lists in `DashboardPage`

### 4.4 — Image Optimization

- [ ] Lazy loading for infographic tab
- [ ] Convert base64 to blob URL for better memory usage
- [ ] Loading placeholder while image decodes

### 4.5 — Error Boundaries ✅

- [x] Root `<ErrorBoundary>` wrapping `App.tsx` (full-page fallback with error details, Try Again + Home buttons)
- [x] Page-level boundaries for `BattleCardPage` and `PipelinePage` in the router
- [x] Reusable `ErrorBoundary` component with 3 modes: full-page (default), `inline` (compact card), and custom `fallback`
- [x] Expandable error details for debugging

### 4.6 — Accessibility (a11y)

- [ ] ARIA labels on icon-only buttons
- [ ] Skip-to-content links
- [ ] Focus management on route changes
- [ ] Color contrast fixes for WCAG AA
- [ ] `aria-describedby` for form error messages

---

## Phase 5: Advanced Roadmap

> Growth features for scaling to a production SaaS.

### 5.1 — Pricing Section

- [ ] Add pricing component to landing page with 3 tiers (Free, Pro, Enterprise)
- [ ] Integrate with Stripe or similar for payments

### 5.2 — Testimonials Section

- [ ] Social proof section with customer quotes, logos, and metrics

### 5.3 — Onboarding Tour

- [ ] First-time user walkthrough highlighting key features
- [ ] Use `react-joyride` or `driver.js`

### 5.4 — Notification Center

- [ ] Bell icon in app header with pipeline status notifications
- [ ] Optional browser push notifications for background pipelines

### 5.5 — Multi-Language Support (i18n)

- [ ] Internationalization with `react-intl` or `i18next`
- [ ] Language switcher in footer or settings

### 5.6 — Analytics Dashboard v2

- [ ] Rich visualizations: battle cards over time, avg duration, top competitors, success rate
- [ ] Use `recharts` or `chart.js`

### 5.7 — Team & Workspace Management

- [ ] Multi-user workspaces with roles (Admin, Editor, Viewer)
- [ ] Shared battle card library, activity feed, email invites

### 5.8 — API Key Management

- [ ] Users bring their own Google API key
- [ ] Settings page for key management and usage tracking

---

## Priority Matrix

| Priority | Items | Effort | Impact |
|---|---|---|---|
| **P0 — Done** ✅ | 1.1–1.6 (all Phase 1), 2.1–2.5 (wizard, stage panels, TOC, search/filter, job naming), 3.3 (compare), 3.4 (templates), 3.5 (favorites/tags), 3.6 (share), 3.7 (PDF) | — | — |
| **P1 — Next Sprint** | 4.1 (code splitting), 4.2 (react-query) | Low–Med | High |
| **P2 — Soon** | 2.6 (ETA), 3.1 (auth), 3.2 (dark mode) | Medium | High |
| **P3 — Later** | 3.8 (websockets), 4.3 (memoization), 4.4 (image optim), 4.6 (a11y) | Medium–High | Medium |
| **P4 — Future** | 5.1–5.8 (pricing, testimonials, i18n, analytics v2, teams, onboarding) | High | Growth |

### Progress

```
Phase 1 ████████████████████ 6/6  (100%)
Phase 2 ████████████████░░░░ 5/6  ( 83%)
Phase 3 ████████████░░░░░░░░ 5/8  ( 63%)
Phase 4 ███░░░░░░░░░░░░░░░░░ 1/6  ( 17%)
Phase 5 ░░░░░░░░░░░░░░░░░░░░ 0/8  (  0%)

Overall ██████████░░░░░░░░░░ 17/34 (50%)
```

---

<div align="center">

**Last updated:** February 2026

Built with React 19 · TypeScript · Tailwind CSS v4 · Google ADK + Gemini

</div>
