# Optimization & Feature Expansion Plan

> Extended roadmap covering performance optimizations, code quality improvements, and new feature ideas — complementing the existing [FUTURE_PLAN.md](./FUTURE_PLAN.md).

---

## Table of Contents

- [Current State Summary](#current-state-summary)
- [Part 1 — Performance Optimizations](#part-1--performance-optimizations)
- [Part 2 — Code Quality Optimizations](#part-2--code-quality-optimizations)
- [Part 3 — UX & Frontend Optimizations](#part-3--ux--frontend-optimizations)
- [Part 4 — Backend & Infrastructure Optimizations](#part-4--backend--infrastructure-optimizations)
- [Part 5 — New Feature Ideas (Tier 1 — High Impact Differentiators)](#part-5--new-feature-ideas-tier-1--high-impact-differentiators)
- [Part 6 — New Feature Ideas (Tier 2 — Workflow Enhancements)](#part-6--new-feature-ideas-tier-2--workflow-enhancements)
- [Part 7 — New Feature Ideas (Tier 3 — Integrations & Distribution)](#part-7--new-feature-ideas-tier-3--integrations--distribution)
- [Part 8 — New Feature Ideas (Tier 4 — Advanced AI)](#part-8--new-feature-ideas-tier-4--advanced-ai)
- [Part 9 — New Feature Ideas (Tier 5 — Monetization & SaaS)](#part-9--new-feature-ideas-tier-5--monetization--saas)
- [Priority Matrix](#priority-matrix)
- [Recommended Implementation Roadmap](#recommended-implementation-roadmap)
- [Tech Stack Additions](#tech-stack-additions)

---

## Current State Summary

| Layer | Status | Notes |
|-------|--------|-------|
| 7-Agent Pipeline (Google ADK + Gemini 2.5 Flash) | Working | Sequential execution only |
| FastAPI Backend (5 endpoints) | Working | In-memory job store |
| AI Competitor Auto-Discovery | Working | Google Search grounding |
| React 19 + TypeScript Frontend (6 pages) | Working | Vite + Tailwind CSS v4 |
| Real-time Pipeline Progress (polling every 2.5s) | Working | No SSE/WebSocket |
| Battle Card Viewer + Exports (HTML, PNG, PDF, TXT) | Working | iframe-based rendering |
| Dashboard with Search, Tags, Stars | Working | localStorage persistence |
| Compare View (side-by-side) | Working | 4 comparison tabs |

**What's NOT optimized yet:** Agent parallelism, caching, bundle size, streaming output, error recovery, database persistence, auth, testing, monitoring.

---

## Part 1 — Performance Optimizations

> **Goal:** Make the pipeline faster, cheaper, and more responsive.

### 1.1 Parallel Agent Execution

- [ ] Run stages 1-3 (Research, Features, Positioning) concurrently — they have no dependencies on each other
- [ ] Stage 4 (SWOT) waits for stages 1-3 to complete, then runs with combined context
- [ ] Stages 5-7 continue sequentially as before (they depend on prior outputs)
- [ ] Use Python `asyncio.gather()` or Google ADK `ParallelAgent` for concurrent execution
- [ ] Update progress tracking to handle parallel stages (weighted progress per stage)
- [ ] **Expected speedup: 2-3x faster** pipeline completion (from ~90s to ~35-45s)

**Files to modify:**
```
backend/app/agents/pipeline.py        # Convert to parallel execution
backend/app/agents/root_agent.py      # Update orchestration
backend/app/api/routes.py             # Update progress calculation
```

### 1.2 Smart Caching Layer

- [ ] Cache competitor research results with TTL (24-72 hours)
- [ ] Cache AI-discovered competitors per project (TTL: 7 days)
- [ ] Generate a content hash of competitor data to detect if re-research is needed
- [ ] Skip re-running full pipeline if cached data is still fresh
- [ ] Add a "Force Refresh" option in the UI to bypass cache
- [ ] Start with file-based cache (JSON files in `backend/cache/`), migrate to Redis later
- [ ] **Expected savings:** 50-70% reduction in Gemini API calls for repeat competitors

**Files to create/modify:**
```
backend/app/utils/cache.py            # Cache manager (file-based → Redis)
backend/app/agents/research_agent.py  # Check cache before researching
backend/app/api/routes.py             # Add force_refresh parameter
```

### 1.3 Streaming Agent Output

- [ ] Stream each agent's text output as it's being generated (not wait for full completion)
- [ ] Use FastAPI `StreamingResponse` with Server-Sent Events (SSE)
- [ ] Frontend receives partial text updates in real-time
- [ ] Users see the battle card being "written" live — much better perceived performance
- [ ] Reduces time-to-first-content from ~90s (full pipeline) to ~10s (first agent starts writing)

**Files to create/modify:**
```
backend/app/api/streaming.py          # SSE endpoint
backend/app/agents/pipeline.py        # Yield agent outputs as they complete
src/hooks/useSSE.ts                   # EventSource hook
src/pages/Pipeline/PipelinePage.tsx    # Replace polling with SSE
```

### 1.4 Model Tiering Strategy

- [ ] Use **Gemini 2.5 Flash** for simple/fast agents: Research, Feature Analysis, Discovery
- [ ] Use **Gemini 2.5 Pro** for complex/quality-critical agents: SWOT, Objection Scripts, Battle Card HTML
- [ ] Make model selection configurable per-agent in `settings.py`
- [ ] Add a "Quality vs Speed" toggle in Setup Wizard:
  - **Fast mode:** All Flash (current behavior)
  - **Quality mode:** Flash + Pro mix
  - **Max quality:** All Pro (slower, more expensive, better output)
- [ ] **Expected improvement:** Better battle card quality with minimal speed impact

**Files to modify:**
```
backend/app/config/settings.py        # Per-agent model config
backend/app/agents/*.py               # Use configured model per agent
src/pages/Setup/SetupWizard.tsx       # Quality toggle UI
```

### 1.5 Prompt Optimization

- [ ] Audit all 7 agent prompts for token efficiency
- [ ] Remove redundant instructions and verbose examples
- [ ] Use structured output format (JSON mode) where applicable
- [ ] Add few-shot examples only for complex agents (battle card, objection scripts)
- [ ] Benchmark before/after: tokens used, output quality, generation time
- [ ] **Expected savings:** 20-30% reduction in token usage per pipeline run

### 1.6 Image Optimization

- [ ] Compress infographic PNG server-side before converting to base64
- [ ] Use WebP format instead of PNG (50-70% smaller file size)
- [ ] Add image dimension limits (max 1200px width for infographics)
- [ ] Lazy-load infographic on the battle card page (load only when scrolled into view)
- [ ] **Expected savings:** 50-70% reduction in infographic payload size

---

## Part 2 — Code Quality Optimizations

> **Goal:** Cleaner, more maintainable, and more robust codebase.

### 2.1 TypeScript Strictness

- [ ] Enable `strictNullChecks` in `tsconfig.json`
- [ ] Fix all resulting null/undefined errors across the codebase
- [ ] Enable `noUncheckedIndexedAccess` for safer array/object access
- [ ] Add proper return types to all exported functions
- [ ] **Impact:** Catch entire categories of bugs at compile time

### 2.2 API Layer with React Query / TanStack Query

- [ ] Replace raw Axios calls with TanStack Query for:
  - Automatic caching and deduplication
  - Background revalidation (stale-while-revalidate)
  - Retry logic with exponential backoff
  - Loading/error states without manual `useState`
  - Optimistic updates for dashboard actions (star, tag)
- [ ] Replace manual polling with React Query's `refetchInterval`
- [ ] **Impact:** Less boilerplate, better UX, fewer race conditions

**Files to modify:**
```
src/services/battlecardService.ts     # Wrap in React Query hooks
src/pages/Pipeline/PipelinePage.tsx    # Use useQuery with refetchInterval
src/pages/Dashboard/DashboardPage.tsx  # Use useQuery for job list
src/pages/BattleCard/BattleCardPage.tsx # Use useQuery for results
```

### 2.3 Shared Custom Hooks

- [ ] Extract `usePollJob(jobId)` — encapsulates polling logic used in Pipeline & Dashboard
- [ ] Extract `useExport(jobId)` — encapsulates HTML/PDF/PNG/TXT export logic from BattleCardPage
- [ ] Extract `usePipelineStatus(jobId)` — status tracking with auto-redirect on completion
- [ ] Extract `useWizardState()` — sessionStorage persistence for setup wizard
- [ ] **Impact:** Reduce code duplication, easier to test

### 2.4 Component Architecture

- [ ] Split `BattleCardPage.tsx` into smaller components:
  - `BattleCardViewer` — iframe rendering
  - `TableOfContents` — TOC sidebar
  - `ExportPanel` — download buttons
  - `InfographicViewer` — comparison chart display
  - `RawDataModal` — JSON viewer modal
- [ ] Split `DashboardPage.tsx` into:
  - `JobList` — job cards
  - `JobFilters` — search, sort, status filter
  - `JobCard` — individual job card with actions
  - `TagManager` — tag add/remove/filter
- [ ] **Impact:** Each component under 150 lines, easier to maintain

### 2.5 Testing Foundation

- [ ] Add Vitest for frontend unit tests
- [ ] Add React Testing Library for component tests
- [ ] Add pytest for backend unit tests
- [ ] Priority test targets:
  - `battlecardService.ts` — API calls
  - `useJobMeta` hook — localStorage logic
  - `backend/app/api/routes.py` — endpoint handlers
  - `backend/app/agents/pipeline.py` — pipeline orchestration
- [ ] Add test scripts to `package.json` and CI pipeline
- [ ] **Target:** 60%+ code coverage on critical paths

**Files to create:**
```
src/__tests__/                        # Frontend tests
backend/tests/                        # Backend tests (expand existing)
vitest.config.ts                      # Vitest configuration
```

### 2.6 Error Handling Improvements

- [ ] Create typed error classes for backend (PipelineError, AgentError, ValidationError)
- [ ] Return consistent error response format from all API endpoints
- [ ] Add frontend error boundary per-page (not just global)
- [ ] Add toast notifications for recoverable errors (network retry, etc.)
- [ ] Add detailed error context in pipeline failures (which agent, what input)
- [ ] **Impact:** Better debugging, better user experience on failures

---

## Part 3 — UX & Frontend Optimizations

> **Goal:** Faster, smoother, more polished user experience.

### 3.1 Route-Level Code Splitting

- [ ] Add `React.lazy()` + `Suspense` for all page components
- [ ] Show skeleton loading states during chunk loading
- [ ] Preload adjacent routes on hover (e.g., preload `/pipeline` when hovering "Generate")
- [ ] **Expected improvement:** 40-60% faster initial page load

```tsx
const DashboardPage = lazy(() => import('./pages/Dashboard/DashboardPage'));
const BattleCardPage = lazy(() => import('./pages/BattleCard/BattleCardPage'));
```

### 3.2 Lazy-Load Heavy Dependencies

- [ ] Lazy-load `html2canvas` (280KB) — only when PDF export is clicked
- [ ] Lazy-load `jsPDF` (200KB) — only when PDF export is clicked
- [ ] Dynamic import pattern: `const html2canvas = await import('html2canvas')`
- [ ] **Expected improvement:** ~480KB smaller initial bundle

### 3.3 Virtual Scrolling for Dashboard

- [ ] Implement virtual list rendering for job cards when count > 50
- [ ] Use `@tanstack/react-virtual` or `react-window`
- [ ] Only render visible job cards in the viewport
- [ ] **Impact:** Smooth scrolling even with 1000+ jobs

### 3.4 Skeleton Loading States

- [ ] Add skeleton placeholders for:
  - Dashboard job cards while loading
  - Battle card content while iframe loads
  - Pipeline stage cards while polling
  - Compare page sections while fetching
- [ ] Use existing `Skeleton.tsx` component consistently
- [ ] **Impact:** Perceived performance improvement, no layout shift

### 3.5 Keyboard Shortcuts

- [ ] `Ctrl+K` — Global search (search across all battle cards)
- [ ] `Ctrl+N` — New battle card (go to Setup)
- [ ] `Ctrl+D` — Go to Dashboard
- [ ] `Ctrl+P` — Print/export current battle card
- [ ] `Escape` — Close modals, cancel actions
- [ ] Show shortcut hints in tooltips
- [ ] **Impact:** Power user productivity

### 3.6 Responsive Design Polish

- [ ] Audit all pages on mobile (375px), tablet (768px), desktop (1440px+)
- [ ] Fix any layout breaks on the Battle Card viewer at mobile widths
- [ ] Make the Setup Wizard step indicator horizontal on mobile
- [ ] Collapsible sidebar TOC on tablet
- [ ] Touch-friendly tap targets (min 44px) for mobile
- [ ] **Impact:** Professional feel on all devices

### 3.7 Dark Mode Support

- [ ] Extend existing dark mode (landing page only) to all pages
- [ ] Add dark mode toggle in the header
- [ ] Persist dark mode preference in localStorage
- [ ] Style the battle card iframe content for dark mode
- [ ] Ensure all Tailwind utility classes support `dark:` variants
- [ ] **Impact:** User comfort, modern appearance

---

## Part 4 — Backend & Infrastructure Optimizations

> **Goal:** More reliable, observable, and production-ready backend.

### 4.1 Request Validation Middleware

- [ ] Add Pydantic validation on all request bodies (already partially done)
- [ ] Sanitize string inputs (strip HTML, limit length, block injection patterns)
- [ ] Validate competitor/product names (no empty strings, reasonable length)
- [ ] Return detailed validation errors with field-level messages
- [ ] **Impact:** Security + better error messages for users

### 4.2 Structured Logging

- [ ] Add `structlog` with JSON output format
- [ ] Log every agent execution: agent name, input length, output length, duration, tokens used
- [ ] Add correlation IDs (job_id) to all log entries for a pipeline run
- [ ] Log API request/response with timing (middleware)
- [ ] Separate log levels: DEBUG (agent details), INFO (pipeline progress), ERROR (failures)
- [ ] **Impact:** Debugging, monitoring, cost tracking

**Files to create:**
```
backend/app/utils/logging.py          # Structured logging setup
backend/app/middleware/logging.py      # Request/response logging middleware
```

### 4.3 Health Check & Readiness

- [ ] Add `GET /health` endpoint that checks:
  - Server is running
  - Gemini API key is valid (lightweight ping)
  - Database is connected (when added)
  - Redis is connected (when added)
- [ ] Add `GET /ready` endpoint for container orchestration
- [ ] Return degraded status if optional dependencies are down
- [ ] **Impact:** Container orchestration, monitoring, alerting

### 4.4 Graceful Shutdown

- [ ] Handle SIGTERM/SIGINT signals properly
- [ ] Wait for running pipelines to complete (or save state) before shutdown
- [ ] Close database connections cleanly
- [ ] Return 503 for new requests during shutdown
- [ ] **Impact:** No lost work during deployments

### 4.5 API Versioning

- [ ] Prefix all endpoints with `/api/v1/`
- [ ] Plan for `/api/v2/` when breaking changes are needed
- [ ] Add `API-Version` response header
- [ ] Document version deprecation policy
- [ ] **Impact:** Safe API evolution without breaking clients

### 4.6 Pipeline Timeout & Cancellation

- [ ] Add configurable timeout per pipeline (default: 10 minutes)
- [ ] Add `POST /api/battlecard/cancel/{jobId}` endpoint
- [ ] Frontend "Cancel" button on Pipeline page
- [ ] Clean up resources (cancel Gemini API calls) on cancellation
- [ ] Set job status to `cancelled` (new status)
- [ ] **Impact:** No stuck jobs, user control

---

## Part 5 — New Feature Ideas (Tier 1 — High Impact Differentiators)

> **Goal:** Features that set AI Sales Agent apart from competitors.

### 5.1 Live Battle Card Chat

An AI-powered conversational interface embedded on the battle card page. Sales reps can ask context-aware questions about the competitor.

- [ ] Add a chat sidebar/panel on the Battle Card page
- [ ] Use RAG (Retrieval-Augmented Generation) over the battle card data
- [ ] Example queries:
  - "How do I counter their pricing argument?"
  - "What's their biggest weakness in enterprise?"
  - "Give me a 30-second elevator pitch against them"
  - "What questions should I ask the prospect to highlight our strengths?"
- [ ] Maintain conversation history per battle card session
- [ ] Pre-populate with suggested questions based on the battle card content
- [ ] **Value:** Turns a static document into an interactive sales coach

**Files to create:**
```
backend/app/agents/chat_agent.py      # RAG-based chat agent
backend/app/api/chat.py               # Chat endpoint
src/pages/BattleCard/ChatPanel.tsx     # Chat UI component
src/hooks/useChat.ts                   # Chat state management
```

### 5.2 Deal Simulator

An interactive tool where sales reps can simulate a competitive deal scenario.

- [ ] Input: deal size, decision criteria, buyer persona, competitor
- [ ] AI simulates how a sales conversation would unfold
- [ ] Generates recommended talking points for each scenario
- [ ] Shows "risk score" — how likely you are to win vs. this competitor
- [ ] Provides specific counter-arguments for likely objections
- [ ] Can run multiple scenarios (different buyer personas, different competitors)
- [ ] **Value:** Practice before high-stakes calls

**Files to create:**
```
backend/app/agents/simulator_agent.py  # Deal simulation agent
src/pages/Simulator/SimulatorPage.tsx   # Simulator UI
```

### 5.3 Win/Loss Review Agent

A new pipeline agent that analyzes real customer reviews to find patterns.

- [ ] Scrape/search G2, Capterra, TrustRadius for competitor reviews
- [ ] Analyze sentiment patterns: what customers love, what they complain about
- [ ] Compare your product's reviews vs. competitor's reviews
- [ ] Generate "social proof" talking points from positive reviews
- [ ] Identify common churn reasons from negative competitor reviews
- [ ] Add as optional stage 8 in the pipeline
- [ ] **Value:** Real-world evidence, not just AI-generated analysis

**Files to create:**
```
backend/app/agents/review_agent.py     # Review analysis agent
```

### 5.4 Competitive News Feed

Background monitoring that tracks competitor changes over time.

- [ ] Schedule periodic web research on tracked competitors
- [ ] Detect and log changes: new features, pricing updates, funding rounds, partnerships
- [ ] News feed page (`/feed`) showing recent competitive intelligence
- [ ] Alert system — push notification or email when significant changes detected
- [ ] Severity levels: Info (blog post), Warning (feature launch), Critical (pricing change)
- [ ] **Value:** Always up-to-date competitive intelligence without manual effort

**Files to create:**
```
backend/app/services/monitor.py        # Background monitoring service
backend/app/api/feed.py                # News feed endpoint
src/pages/Feed/NewsFeedPage.tsx         # News feed UI
```

### 5.5 Battle Card Diff View

Visual comparison showing what changed between two versions of a battle card.

- [ ] Store battle card versions in database (with timestamps)
- [ ] Highlight added, removed, and changed sections
- [ ] Side-by-side or inline diff view (like GitHub PR diffs)
- [ ] "What's Changed" summary generated by AI
- [ ] Accessible from battle card page: "Compare with previous version"
- [ ] **Value:** Track how competitive landscape evolves over time

**Files to create:**
```
src/pages/BattleCard/DiffView.tsx      # Diff viewer component
backend/app/api/versions.py            # Version history endpoint
```

### 5.6 Team Playbook Builder

Combine multiple battle cards into a comprehensive competitive playbook document.

- [ ] Select multiple battle cards from dashboard
- [ ] AI generates a unified "Competitive Playbook" with:
  - Executive summary of competitive landscape
  - Competitor ranking matrix
  - Top objections across all competitors
  - Unified win themes and positioning
- [ ] Export as PDF, PPTX, or DOCX
- [ ] Auto-update playbook when individual battle cards are refreshed
- [ ] **Value:** Enterprise-grade deliverable for sales leadership

**Files to create:**
```
backend/app/agents/playbook_agent.py   # Playbook synthesis agent
backend/app/api/playbook.py            # Playbook endpoints
src/pages/Playbook/PlaybookPage.tsx     # Playbook builder UI
```

---

## Part 6 — New Feature Ideas (Tier 2 — Workflow Enhancements)

> **Goal:** Make daily usage faster and more flexible.

### 6.1 Quick Regenerate Single Section

- [ ] "Regenerate" button on each section of the battle card (SWOT, Objections, etc.)
- [ ] Re-runs only the selected agent, keeping other sections intact
- [ ] Option to provide additional context: "Focus more on enterprise features"
- [ ] Much faster than re-running the full pipeline (~10s vs ~90s)
- [ ] **Value:** Iterate on specific sections without starting over

### 6.2 Custom Sections

- [ ] Let users add custom sections to battle cards beyond the default 7
- [ ] Example custom sections:
  - "Compliance Comparison"
  - "Migration Guide"
  - "Customer Success Stories"
  - "Integration Ecosystem"
  - "Security Posture Comparison"
- [ ] User defines section name + guiding prompt
- [ ] AI generates the section using existing research data as context
- [ ] Save custom section templates for reuse across battle cards
- [ ] **Value:** Adaptable to any industry or use case

### 6.3 Editable Battle Cards (Rich Text Editor)

- [ ] In-browser rich text editor overlaid on the generated battle card
- [ ] Click any section to edit text, add notes, correct inaccuracies
- [ ] Add comments/annotations for team collaboration
- [ ] Track manual edits separately from AI-generated content
- [ ] "Revert to AI version" option per section
- [ ] Auto-save edits to database
- [ ] **Value:** Bridge the gap between AI-generated and human-curated content

**Files to create:**
```
src/pages/BattleCard/EditableCard.tsx  # Rich text editor component
src/hooks/useCardEditor.ts             # Editor state management
```

### 6.4 Scheduled Auto-Refresh

- [ ] Set a battle card to auto-regenerate on a schedule (weekly, biweekly, monthly)
- [ ] Dashboard shows "Last refreshed" and "Next refresh" timestamps
- [ ] Notification when auto-refresh completes: "Your Salesforce battle card was updated"
- [ ] Only re-run if competitor data has changed (use caching hash comparison)
- [ ] **Value:** Always-fresh competitive intelligence without manual effort

### 6.5 Bulk Import Competitors

- [ ] Upload a CSV file with competitor names, websites, and descriptions
- [ ] Batch-generate battle cards for all competitors in the CSV
- [ ] Progress tracker for the batch job (X of Y completed)
- [ ] Generate a combined "Competitive Landscape" summary report
- [ ] **Value:** Onboard an entire competitive landscape in one action

### 6.6 Battle Card Scoring & Completeness

- [ ] AI evaluates each battle card section on:
  - **Completeness** — Are all key areas covered?
  - **Actionability** — Can a sales rep use this in a call?
  - **Data freshness** — Is the information current?
  - **Specificity** — Are claims backed with evidence?
- [ ] Overall score (0-100) displayed on the battle card and dashboard
- [ ] Suggestions for improvement: "Add more pricing details", "SWOT section lacks evidence"
- [ ] **Value:** Quality assurance for generated content

### 6.7 Favorites & Quick Access Widget

- [ ] Pin top 3-5 battle cards for one-click access from any page
- [ ] Quick access bar in the header or a floating widget
- [ ] Recently viewed battle cards list
- [ ] **Value:** Faster access during active sales cycles

### 6.8 Battle Card Collections

- [ ] Group battle cards into named collections: "Q1 Enterprise Deals", "APAC Competitors"
- [ ] Filter dashboard by collection
- [ ] Share entire collections with team members
- [ ] **Value:** Organization for large competitive landscapes

---

## Part 7 — New Feature Ideas (Tier 3 — Integrations & Distribution)

> **Goal:** Battle cards go where sales reps already work.

### 7.1 Slack Bot Integration

- [ ] `/battlecard [competitor]` command in Slack triggers generation
- [ ] Posts formatted summary + link to full battle card in the channel
- [ ] `/battlecard-ask [competitor] [question]` for quick competitive Q&A
- [ ] Notification to Slack channel when a battle card is updated
- [ ] **Value:** Sales reps access intel without leaving Slack

### 7.2 Chrome Extension

- [ ] While browsing a competitor's website, click extension icon
- [ ] Auto-detects competitor name from the website domain
- [ ] One-click battle card generation or lookup of existing card
- [ ] Quick summary popup without navigating to the full app
- [ ] **Value:** Competitive intel at the point of research

### 7.3 CRM Integration (Salesforce / HubSpot)

- [ ] Push battle card as a note/attachment to a CRM deal record
- [ ] Auto-generate battle card when a competitive deal is logged
- [ ] Embed battle card viewer as a CRM iframe widget
- [ ] Sync competitor names from CRM fields
- [ ] **Value:** Battle cards live where deal decisions are made

### 7.4 Notion / Confluence Sync

- [ ] Auto-push generated battle cards to a Notion database or Confluence space
- [ ] Keep wiki pages in sync when battle cards are regenerated
- [ ] Map battle card sections to wiki page sections
- [ ] **Value:** Single source of truth in the team's existing wiki

### 7.5 Email Integration

- [ ] "Email this battle card" button with recipient input
- [ ] Pre-formatted email with battle card summary + link
- [ ] Schedule competitive digest emails (weekly/monthly) to the sales team
- [ ] **Value:** Distribution to stakeholders who don't use the app

### 7.6 Public API & Webhooks

- [ ] REST API for programmatic battle card generation
- [ ] API key management in user profile
- [ ] Webhook notifications for pipeline completion
- [ ] Rate limits per API key
- [ ] **Value:** Enables custom integrations and automation workflows

**Files to create:**
```
backend/app/api/public_api.py          # Public API endpoints
backend/app/api/webhooks.py            # Webhook management
src/pages/Settings/APIKeysPage.tsx      # API key management UI
```

---

## Part 8 — New Feature Ideas (Tier 4 — Advanced AI)

> **Goal:** Push the boundaries of AI-powered competitive intelligence.

### 8.1 Persona-Based Battle Cards

- [ ] Same competitor, different cards for different buyer personas:
  - **CTO Card** — Focus on technology, architecture, security, APIs
  - **CFO Card** — Focus on ROI, TCO, pricing comparison, cost savings
  - **VP Sales Card** — Focus on competitive positioning, objection handling
  - **End User Card** — Focus on UX, features, learning curve
- [ ] Select persona in Setup Wizard or switch on the battle card page
- [ ] **Value:** Tailored intel for each stakeholder in the buying committee

### 8.2 AI Sales Coach (Practice Mode)

- [ ] Interactive chat simulator for objection handling practice
- [ ] AI plays the role of a prospect raising competitor-specific objections
- [ ] Evaluates the sales rep's responses and provides coaching feedback
- [ ] Difficulty levels: Easy (obvious objections) → Hard (nuanced competitive scenarios)
- [ ] Tracks improvement over time
- [ ] **Value:** Sales training tool built on real competitive data

**Files to create:**
```
backend/app/agents/coach_agent.py      # Sales coach AI agent
src/pages/Coach/SalesCoachPage.tsx      # Practice mode UI
```

### 8.3 Market Map Generator

- [ ] AI generates a visual 2x2 positioning map (like Gartner Magic Quadrant)
- [ ] Axes configurable: Features vs. Price, Enterprise vs. SMB, etc.
- [ ] Plots your product and all analyzed competitors
- [ ] Interactive — click on a dot to see the competitor's battle card
- [ ] Export as PNG/SVG for presentations
- [ ] **Value:** Visual strategic overview of competitive landscape

**Files to create:**
```
backend/app/agents/market_map_agent.py # Market map data generator
src/pages/MarketMap/MarketMapPage.tsx   # Interactive market map UI
```

### 8.4 Competitive Pricing Calculator

- [ ] Interactive tool comparing pricing across competitors
- [ ] Input: seat count, contract length, features needed
- [ ] Output: side-by-side pricing comparison table
- [ ] Highlights where your product is cheaper/more expensive
- [ ] Generates pricing-focused talking points
- [ ] **Value:** Sales reps can build pricing proposals on the fly

### 8.5 Voice Briefing Mode

- [ ] Generate a 60-second audio summary of key battle card points
- [ ] Text-to-speech using Google Cloud TTS or ElevenLabs
- [ ] "Listen before your call" button on the battle card page
- [ ] Customizable briefing: "Focus on their weaknesses" or "Focus on our strengths"
- [ ] Download as MP3 for offline listening
- [ ] **Value:** Quick prep for sales calls, especially for mobile reps

### 8.6 Multi-Language Battle Cards

- [ ] Generate battle cards in 10+ languages: Spanish, French, German, Japanese, etc.
- [ ] Language selection in Setup Wizard
- [ ] Translate objection scripts for regional sales teams
- [ ] Localized competitor research (use region-specific search)
- [ ] **Value:** Global sales team support

### 8.7 Competitive Intelligence RAG Knowledge Base

- [ ] Aggregate all generated battle cards into a searchable knowledge base
- [ ] Semantic search across all competitive data: "Which competitors have SOC 2?"
- [ ] AI answers questions using the full knowledge base as context
- [ ] **Value:** Institutional memory that grows with every battle card generated

---

## Part 9 — New Feature Ideas (Tier 5 — Monetization & SaaS)

> **Goal:** Transform from a tool into a revenue-generating SaaS product.

### 9.1 Freemium Tier Structure

| Tier | Price | Battle Cards/Month | Features |
|------|-------|-------------------|----------|
| **Free** | $0 | 3 | Basic template, no exports |
| **Starter** | $29/mo | 15 | All templates, PDF/DOCX export |
| **Pro** | $79/mo | Unlimited | All features, API access, team workspace |
| **Enterprise** | Custom | Unlimited | SSO, audit logs, CRM integration, SLA |

### 9.2 Usage-Based Billing

- [ ] Track token usage per user per month
- [ ] Overage charges beyond plan limits
- [ ] Usage dashboard in user profile
- [ ] Billing integration with Stripe

### 9.3 Team & Workspace Features

- [ ] Create teams with shared battle card libraries
- [ ] Role-based access: Admin, Editor, Viewer
- [ ] Activity log: who generated/edited/viewed which battle cards
- [ ] Shared custom templates across the team
- [ ] **Value:** Enterprise collaboration and governance

### 9.4 White-Label / Custom Branding

- [ ] Custom logo and colors on generated battle cards
- [ ] Custom domain support (e.g., `intel.yourcompany.com`)
- [ ] Remove "AI Sales Agent" branding on Enterprise tier
- [ ] Custom email templates for digests and alerts
- [ ] **Value:** Enterprise customers want their branding

### 9.5 Admin Dashboard

- [ ] Organization-wide usage analytics
- [ ] User management (invite, remove, change roles)
- [ ] Billing management
- [ ] API key management
- [ ] Audit logs for compliance
- [ ] **Value:** Enterprise governance and control

---

## Priority Matrix

### Optimizations

| # | Optimization | Priority | Effort | Impact | Dependencies |
|---|-------------|----------|--------|--------|-------------|
| 1.1 | Parallel Agent Execution | **Critical** | Medium | High | None |
| 1.2 | Smart Caching | **Critical** | Low | High | None |
| 1.3 | Streaming Output (SSE) | **High** | Medium | High | None |
| 1.4 | Model Tiering | **High** | Low | Medium | None |
| 1.5 | Prompt Optimization | **High** | Low | Medium | None |
| 1.6 | Image Optimization | Medium | Low | Low | None |
| 2.1 | TypeScript Strictness | Medium | Medium | Medium | None |
| 2.2 | React Query | **High** | Medium | High | None |
| 2.3 | Shared Hooks | Medium | Low | Medium | None |
| 2.4 | Component Splitting | Medium | Medium | Medium | None |
| 2.5 | Testing Foundation | **High** | High | High | None |
| 2.6 | Error Handling | **High** | Medium | High | None |
| 3.1 | Code Splitting | Medium | Low | Medium | None |
| 3.2 | Lazy-Load Heavy Deps | Medium | Low | Medium | None |
| 3.7 | Dark Mode | Medium | Medium | Medium | None |
| 4.1 | Request Validation | **High** | Low | High | None |
| 4.2 | Structured Logging | **High** | Medium | High | None |
| 4.6 | Pipeline Cancellation | **High** | Medium | High | None |

### New Features

| # | Feature | Priority | Effort | Impact | Dependencies |
|---|---------|----------|--------|--------|-------------|
| 5.1 | Live Battle Card Chat | **Critical** | High | Very High | Database |
| 5.2 | Deal Simulator | Medium | High | High | 5.1 |
| 5.3 | Win/Loss Review Agent | **High** | Medium | High | None |
| 5.4 | Competitive News Feed | Medium | High | High | Database, Scheduler |
| 5.5 | Battle Card Diff | Medium | Medium | Medium | Database (versions) |
| 5.6 | Team Playbook Builder | **High** | High | Very High | Database, Auth |
| 6.1 | Quick Regenerate Section | **Critical** | Medium | High | None |
| 6.2 | Custom Sections | **High** | Medium | High | None |
| 6.3 | Editable Battle Cards | **High** | High | Very High | Database |
| 6.4 | Scheduled Auto-Refresh | Medium | Medium | Medium | Database, Scheduler |
| 6.5 | Bulk Import | Medium | Medium | Medium | Batch Pipeline |
| 6.6 | Battle Card Scoring | Medium | Medium | Medium | None |
| 7.1 | Slack Bot | Medium | High | High | Auth, Public API |
| 7.2 | Chrome Extension | Low | High | Medium | Auth, Public API |
| 7.3 | CRM Integration | **High** | Very High | Very High | Auth, Database |
| 7.6 | Public API | **High** | Medium | High | Auth, Rate Limiting |
| 8.1 | Persona-Based Cards | **High** | Medium | High | Templates |
| 8.2 | AI Sales Coach | Medium | High | High | Chat Agent |
| 8.3 | Market Map Generator | Medium | High | High | Multiple BCs |
| 8.7 | RAG Knowledge Base | **High** | Very High | Very High | Database, All BCs |

---

## Recommended Implementation Roadmap

```
Sprint 1 (Week 1-2): Performance Quick Wins
├── 1.1  Parallel Agent Execution (2-3x speedup)
├── 1.2  Smart Caching Layer (save API costs)
├── 1.5  Prompt Optimization (20-30% fewer tokens)
└── 1.4  Model Tiering Strategy

Sprint 2 (Week 3-4): Real-Time & Code Quality
├── 1.3  Streaming Output (SSE)
├── 2.2  React Query Integration
├── 2.6  Error Handling Improvements
└── 4.6  Pipeline Cancellation

Sprint 3 (Week 5-6): Foundation Features
├── 6.1  Quick Regenerate Single Section
├── 6.2  Custom Sections
├── 3.1  Route-Level Code Splitting
└── 3.2  Lazy-Load Heavy Dependencies

Sprint 4 (Week 7-8): Database & Persistence (from FUTURE_PLAN Phase 1)
├── Database Integration (PostgreSQL + SQLAlchemy)
├── Pipeline Error Recovery
├── Output Validation
└── 4.2  Structured Logging

Sprint 5 (Week 9-10): Auth & User Features (from FUTURE_PLAN Phase 2)
├── JWT Authentication
├── Login/Register Pages
├── User Profile
└── 3.7  Dark Mode (full app)

Sprint 6 (Week 11-12): High-Impact Features
├── 5.1  Live Battle Card Chat
├── 6.3  Editable Battle Cards
├── 5.3  Win/Loss Review Agent
└── 8.1  Persona-Based Cards

Sprint 7 (Week 13-14): Enterprise Features
├── 5.6  Team Playbook Builder
├── 6.4  Scheduled Auto-Refresh
├── 7.6  Public API & Webhooks
└── 2.5  Testing Foundation

Sprint 8 (Week 15-16): Distribution & Polish
├── 7.1  Slack Bot Integration
├── 7.5  Email Integration
├── 5.5  Battle Card Diff View
└── 6.6  Battle Card Scoring

Month 5+: Advanced AI & SaaS
├── 8.2  AI Sales Coach
├── 8.3  Market Map Generator
├── 8.7  RAG Knowledge Base
├── 7.3  CRM Integration
├── 9.1  Freemium Tier Structure
└── 9.3  Team & Workspace Features
```

---

## Tech Stack Additions

| Need | Recommended | When |
|------|-------------|------|
| API Caching (Frontend) | TanStack Query (React Query) | Sprint 2 |
| Server Caching | File-based → Redis | Sprint 1 → Sprint 4 |
| Database | PostgreSQL + SQLAlchemy + Alembic | Sprint 4 |
| Auth | PyJWT + bcrypt | Sprint 5 |
| Job Queue | Redis + Celery | Sprint 4 |
| SSE | FastAPI StreamingResponse | Sprint 2 |
| Testing (Frontend) | Vitest + React Testing Library | Sprint 7 |
| Testing (Backend) | pytest + httpx (async) | Sprint 7 |
| PDF Export (Server) | WeasyPrint | Sprint 6 |
| DOCX Export | python-docx | Sprint 6 |
| PPTX Export | python-pptx | Sprint 6 |
| Logging | structlog | Sprint 4 |
| Error Tracking | Sentry | Sprint 4 |
| Virtual Scrolling | @tanstack/react-virtual | Sprint 3 |
| Rich Text Editor | TipTap or Lexical | Sprint 6 |
| Text-to-Speech | Google Cloud TTS / ElevenLabs | Month 5+ |
| Payments | Stripe | Month 5+ |
| Containerization | Docker + Docker Compose | Sprint 5 |
| CI/CD | GitHub Actions | Sprint 5 |
| Cloud | GCP Cloud Run + Cloud SQL | Sprint 5+ |

---

## Summary

| Category | Count |
|----------|-------|
| Performance Optimizations | 6 |
| Code Quality Optimizations | 6 |
| UX & Frontend Optimizations | 7 |
| Backend Optimizations | 6 |
| Tier 1 Features (Differentiators) | 6 |
| Tier 2 Features (Workflow) | 8 |
| Tier 3 Features (Integrations) | 6 |
| Tier 4 Features (Advanced AI) | 7 |
| Tier 5 Features (Monetization) | 5 |
| **Total Items** | **57** |

---

> **Next Step:** Pick which sprint to start with and we'll begin implementation.
