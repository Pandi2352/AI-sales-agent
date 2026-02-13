# Future Implementation Plan

> Roadmap for taking AI Sales Agent from MVP to production-ready SaaS.

---

## Current Status (What's Built)

| Layer | Status |
|-------|--------|
| 7-Agent Pipeline (Google ADK) | Working |
| FastAPI Backend with 5 endpoints | Working |
| AI Competitor Auto-Discovery | Working |
| React Frontend (6 pages) | Working |
| Real-time Pipeline Progress (polling) | Working |
| Battle Card Viewer + Downloads (HTML, PNG, PDF, TXT) | Working |
| Dashboard with Job List | Working |
| In-memory Job Storage | Working (not persistent) |

**What's NOT built yet:** Database, Authentication, User accounts, SSE/WebSocket, Testing, Logging, Rate limiting, Multi-tenancy, Export formats, Templates, Analytics.

---

## Phase 1 — Data Persistence & Reliability

> **Goal:** Battle cards survive server restarts. Pipeline failures are recoverable.

### 1.1 Database Integration
- [ ] Choose database: **PostgreSQL** (structured) or **MongoDB** (flexible documents)
- [ ] Create schema/models:
  - `users` — id, name, email, password_hash, created_at
  - `jobs` — id, user_id, status, progress, current_stage, error, created_at, updated_at
  - `battle_cards` — id, job_id, competitor, product, html_content, raw_output, created_at
  - `infographics` — id, job_id, image_base64, mime_type, file_path
  - `discovered_competitors` — id, user_id, project_name, competitors_json, created_at
- [ ] Add SQLAlchemy/Tortoise ORM (PostgreSQL) or Motor (MongoDB)
- [ ] Migrate in-memory `_jobs` dict to database reads/writes
- [ ] Store generated HTML and infographic in database, not just in-memory
- [ ] Add database connection pooling for concurrent requests

### 1.2 Pipeline Error Recovery
- [ ] Add per-agent retry logic (max 2 retries with exponential backoff)
- [ ] Save intermediate agent outputs to database after each stage
- [ ] Allow resuming a failed pipeline from the last successful stage
- [ ] Add pipeline timeout (max 10 minutes per job)
- [ ] Log detailed error context (which agent failed, what input it received)

### 1.3 Output Validation
- [ ] Validate each agent's output against expected schema before passing to next agent
- [ ] Add fallback prompts when agent output doesn't match expected format
- [ ] Ensure `generate_battle_card_html` tool is always called by BattleCardGenerator agent
- [ ] Validate comparison chart image is actually generated (not empty/error response)

**Files to create/modify:**
```
backend/app/db/
├── database.py          # Connection setup, engine, session factory
├── models.py            # SQLAlchemy/Pydantic models
├── migrations/          # Alembic migrations
backend/app/api/routes.py  # Replace _jobs dict with DB queries
backend/app/agents/pipeline.py  # Add retry logic
```

---

## Phase 2 — Authentication & User Accounts

> **Goal:** Users log in, own their battle cards, have private dashboards.

### 2.1 Backend Auth
- [ ] Implement JWT authentication (access token + refresh token)
- [ ] Create auth endpoints:
  - `POST /api/auth/register` — Create account (name, email, password)
  - `POST /api/auth/login` — Returns JWT tokens
  - `POST /api/auth/logout` — Invalidate refresh token
  - `POST /api/auth/refresh` — Issue new access token
- [ ] Password hashing with bcrypt
- [ ] Add `auth_required` dependency for protected routes
- [ ] Associate jobs and battle cards with user_id

### 2.2 Frontend Auth
- [ ] Build Login page (`/login`)
- [ ] Build Register page (`/register`)
- [ ] Wire `AuthContext.tsx` to real backend (currently stubbed)
- [ ] Add protected route wrapper (redirect to `/login` if not authenticated)
- [ ] Show logged-in user info in header (replace hardcoded "Alex Johnson")
- [ ] Persist auth tokens in localStorage with auto-refresh

### 2.3 User Profile
- [ ] Build Profile page (`/profile`)
- [ ] Implement `GET /api/users/profile` endpoint
- [ ] Allow updating name, email, avatar
- [ ] Show user's battle card history and usage stats

**Files to create/modify:**
```
backend/app/api/auth.py         # Auth route handlers
backend/app/utils/security.py   # JWT create/verify, password hashing
backend/app/utils/deps.py       # get_current_user dependency
src/pages/Auth/LoginPage.tsx
src/pages/Auth/RegisterPage.tsx
src/pages/Profile/ProfilePage.tsx
src/contexts/AuthContext.tsx     # Wire to real API
src/routes/index.tsx             # Add auth routes + protected wrapper
```

---

## Phase 3 — Real-time Communication

> **Goal:** Replace polling with Server-Sent Events for instant progress updates.

### 3.1 SSE (Server-Sent Events)
- [ ] Add `GET /api/battlecard/stream/{jobId}` endpoint using FastAPI `StreamingResponse`
- [ ] Stream events as pipeline progresses:
  ```
  event: stage_update
  data: {"stage": "research", "progress": 14, "message": "Researching competitor..."}

  event: stage_complete
  data: {"stage": "research", "progress": 14}

  event: pipeline_complete
  data: {"job_id": "bc_xxx", "progress": 100}

  event: pipeline_error
  data: {"error": "Agent failed", "stage": "swot_analysis"}
  ```
- [ ] Frontend: Replace `setInterval` polling with `EventSource` API
- [ ] Add automatic reconnection on connection drop
- [ ] Fallback to polling for browsers that don't support SSE

### 3.2 WebSocket (Optional, Phase 3b)
- [ ] Add WebSocket endpoint for bidirectional communication
- [ ] Allow user to cancel a running pipeline mid-execution
- [ ] Send live agent "thinking" text as it's being generated
- [ ] Use for real-time dashboard updates across multiple browser tabs

**Files to create/modify:**
```
backend/app/api/streaming.py     # SSE endpoint
src/hooks/useSSE.ts              # EventSource hook
src/pages/Pipeline/PipelinePage.tsx  # Replace polling with SSE
```

---

## Phase 4 — Enhanced Pipeline Features

> **Goal:** Smarter agents, better outputs, more flexibility.

### 4.1 Parallel Stage Execution
- [ ] Run stages 1-3 (Research, Features, Positioning) in parallel — they're independent
- [ ] Stage 4 (SWOT) waits for 1-3 to complete, then runs
- [ ] Stages 5-7 run sequentially as before
- [ ] Update progress tracking for parallel execution (weighted per-stage)
- [ ] Estimated speedup: **2-3x faster** pipeline completion

### 4.2 Multi-Competitor Batch Processing
- [ ] Accept multiple competitors in a single request
- [ ] Run parallel pipelines (one per competitor)
- [ ] Generate a combined "Competitive Landscape" report
- [ ] Dashboard shows batch jobs with individual competitor progress

### 4.3 Battle Card Templates
- [ ] Create 3-4 HTML template options:
  - **Sales Rep Card** — Quick reference for calls (current default)
  - **Executive Summary** — One-page strategic overview
  - **Detailed Analysis** — Full 10+ page deep dive
  - **Slide Deck** — Presentation-ready format
- [ ] User selects template in Setup Wizard
- [ ] Template selection passed to BattleCardGenerator agent

### 4.4 Custom Agent Instructions
- [ ] Allow users to provide custom context per pipeline:
  - "Focus on enterprise features"
  - "Our product is stronger in security"
  - "Target audience is CFOs"
- [ ] Inject custom context into agent prompts dynamically
- [ ] Save custom instructions per user for reuse

### 4.5 Industry-Specific Agents
- [ ] Add optional specialized agents:
  - **Pricing Analyst** — Deep pricing comparison with tier breakdowns
  - **Review Sentiment Agent** — Analyze G2/Capterra reviews for patterns
  - **Tech Stack Analyzer** — Compare architectures, APIs, SDKs
  - **Win/Loss Analyzer** — Historical deal outcome patterns
- [ ] User selects which optional agents to include in Setup Wizard

**Files to create/modify:**
```
backend/app/agents/parallel_pipeline.py  # Parallel execution
backend/app/agents/pricing_agent.py      # New optional agent
backend/app/agents/review_agent.py       # New optional agent
backend/app/tools/templates/             # HTML template variants
src/pages/Setup/SetupWizard.tsx          # Template selection UI
```

---

## Phase 5 — Export & Sharing

> **Goal:** Battle cards go everywhere — PDF, slides, email, Slack.

### 5.1 Export Formats
- [ ] **PDF Export** — Server-side PDF generation using WeasyPrint or Puppeteer
- [ ] **DOCX Export** — Word document using python-docx
- [ ] **Markdown Export** — Clean markdown version of battle card
- [ ] **PPTX Export** — PowerPoint slides using python-pptx
- [ ] **JSON Export** — Structured data for integration with other tools
- [ ] Add export format selection in the Download panel

### 5.2 Sharing & Collaboration
- [ ] Generate shareable public links (read-only, time-limited)
- [ ] Email battle card directly from the app
- [ ] Slack integration — Send battle card to a channel
- [ ] CRM integration hooks (Salesforce, HubSpot) — Push battle card to deal record
- [ ] Team workspace — Multiple users access the same battle cards

### 5.3 Version History
- [ ] Track battle card versions (re-run pipeline, keep old versions)
- [ ] Diff view — Compare two versions of the same competitor battle card
- [ ] "Last updated" timestamp with refresh button

**Files to create/modify:**
```
backend/app/api/export.py        # Export endpoints (PDF, DOCX, PPTX)
backend/app/tools/pdf_export.py
backend/app/tools/docx_export.py
backend/app/api/sharing.py       # Public link generation
src/pages/BattleCard/ShareModal.tsx
src/pages/BattleCard/VersionHistory.tsx
```

---

## Phase 6 — Analytics & Insights

> **Goal:** Understand usage patterns and competitive landscape trends.

### 6.1 Usage Analytics
- [ ] Track: pipelines run, competitors analyzed, time per pipeline, completion rate
- [ ] Analytics dashboard page (`/analytics`)
- [ ] Charts: Most analyzed competitors, pipeline success rate, average generation time
- [ ] Per-user usage stats on profile page

### 6.2 Competitive Intelligence Dashboard
- [ ] Aggregate insights across all battle cards:
  - "Top competitor strengths across your market"
  - "Common objections your team faces"
  - "Feature gaps vs. top 5 competitors"
- [ ] Trend tracking — How competitor positioning changes over time
- [ ] Alert system — Notify when competitor data changes significantly

### 6.3 AI-Powered Recommendations
- [ ] "You should update your Notion battle card — they launched a new feature"
- [ ] "3 of your top competitors improved their pricing page this month"
- [ ] Weekly competitive intelligence digest email

**Files to create/modify:**
```
src/pages/Analytics/AnalyticsPage.tsx
backend/app/api/analytics.py
backend/app/services/insights.py
```

---

## Phase 7 — Production Infrastructure

> **Goal:** Production-ready deployment with monitoring and scaling.

### 7.1 Logging & Monitoring
- [ ] Structured logging with Python `structlog`
- [ ] Log every agent execution: input, output, duration, tokens used
- [ ] Error tracking with Sentry
- [ ] API request/response logging with correlation IDs
- [ ] Health check endpoint with dependency status (DB, Gemini API)

### 7.2 Rate Limiting & Quotas
- [ ] Rate limit API endpoints (e.g., 10 pipelines/hour per user)
- [ ] Gemini API token budget tracking per user
- [ ] Queue system for pipeline jobs (Redis + Celery or similar)
- [ ] Priority queue for paid vs. free tier users

### 7.3 Caching
- [ ] Cache competitor research results (TTL: 24 hours)
- [ ] Cache discovered competitors per project (TTL: 7 days)
- [ ] Avoid re-running full pipeline if competitor data hasn't changed
- [ ] Redis for caching layer

### 7.4 Deployment
- [ ] Dockerize frontend and backend (`Dockerfile` for each)
- [ ] Docker Compose for local development (frontend + backend + db + redis)
- [ ] CI/CD pipeline (GitHub Actions)
  - Lint + type check + tests on PR
  - Build + deploy on merge to main
- [ ] Cloud deployment options:
  - **GCP** (Cloud Run + Cloud SQL) — Recommended for Google ADK
  - **AWS** (ECS + RDS)
  - **Vercel** (frontend) + **Railway** (backend)

### 7.5 Security Hardening
- [ ] Input sanitization on all endpoints
- [ ] CORS origin whitelist (production domains only)
- [ ] API key rotation mechanism
- [ ] Content Security Policy headers
- [ ] SQL injection protection (parameterized queries)
- [ ] XSS prevention in battle card HTML rendering
- [ ] Rate limiting per IP and per user

**Files to create/modify:**
```
Dockerfile.frontend
Dockerfile.backend
docker-compose.yml
.github/workflows/ci.yml
.github/workflows/deploy.yml
backend/app/utils/logging.py
backend/app/utils/rate_limit.py
backend/app/utils/cache.py
```

---

## Phase 8 — Advanced AI Features

> **Goal:** Push the boundaries of AI-powered competitive intelligence.

### 8.1 Continuous Monitoring
- [ ] Schedule automated pipeline re-runs (weekly/monthly)
- [ ] Detect changes in competitor data since last run
- [ ] Generate "What's Changed" diff reports
- [ ] Alert users via email/Slack when significant changes detected

### 8.2 Conversational Battle Card
- [ ] Chat interface on the battle card page
- [ ] "Ask me anything about this competitor" — RAG over the battle card data
- [ ] "How should I respond if they mention [specific feature]?"
- [ ] Context-aware follow-up questions

### 8.3 Voice Briefing
- [ ] Text-to-speech summary of key battle card points
- [ ] "60-second briefing" audio clip for sales reps before calls
- [ ] Integrate with Google Cloud TTS or ElevenLabs

### 8.4 CRM-Triggered Generation
- [ ] Salesforce/HubSpot webhook — Auto-generate battle card when a new competitor deal is logged
- [ ] Pre-populate with deal context from CRM
- [ ] Push completed battle card back to CRM record

### 8.5 Multi-Language Support
- [ ] Generate battle cards in multiple languages
- [ ] Translate objection scripts for regional sales teams
- [ ] Localized competitor research (market-specific sources)

---

## Priority Matrix

| Phase | Priority | Effort | Impact | Dependencies |
|-------|----------|--------|--------|-------------|
| **Phase 1** — Persistence & Reliability | Critical | Medium | High | None |
| **Phase 2** — Auth & Users | Critical | Medium | High | Phase 1 |
| **Phase 3** — Real-time (SSE) | High | Low | Medium | None |
| **Phase 4** — Enhanced Pipeline | High | High | High | Phase 1 |
| **Phase 5** — Export & Sharing | Medium | Medium | High | Phase 1, 2 |
| **Phase 6** — Analytics | Medium | Medium | Medium | Phase 1, 2 |
| **Phase 7** — Production Infra | High | High | Critical | Phase 1, 2 |
| **Phase 8** — Advanced AI | Low | High | High | Phase 1-7 |

---

## Suggested Implementation Order

```
Month 1:  Phase 1 (Database) + Phase 3 (SSE)
Month 2:  Phase 2 (Auth) + Phase 7.4 (Docker/CI)
Month 3:  Phase 4.1-4.3 (Parallel, Batch, Templates)
Month 4:  Phase 5 (Export/Sharing) + Phase 7.1-7.2 (Logging, Rate Limits)
Month 5:  Phase 6 (Analytics) + Phase 4.4-4.5 (Custom Instructions, New Agents)
Month 6+: Phase 8 (Advanced AI — Monitoring, Chat, Voice, CRM)
```

---

## Tech Stack Additions

| Need | Recommended |
|------|-------------|
| Database | PostgreSQL + SQLAlchemy |
| Migrations | Alembic |
| Auth | PyJWT + bcrypt |
| Job Queue | Redis + Celery |
| Caching | Redis |
| PDF Export | WeasyPrint |
| DOCX Export | python-docx |
| PPTX Export | python-pptx |
| Logging | structlog |
| Error Tracking | Sentry |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions |
| Cloud | GCP Cloud Run + Cloud SQL |
| TTS | Google Cloud TTS / ElevenLabs |
