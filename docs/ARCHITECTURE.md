# Architecture

## System Overview

AI Sales Agent is a **multi-agent AI pipeline** that takes two inputs — a **competitor name** and **your product name** — and produces a complete, professional sales battle card in real-time.

The system is split into two layers:

```
┌──────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                     │
│  User Input → Progress Tracking → Battle Card Display    │
└──────────────────────┬───────────────────────────────────┘
                       │ REST API (Axios)
┌──────────────────────▼───────────────────────────────────┐
│              BACKEND (Google ADK + Gemini 3)             │
│  Orchestrator Agent → 7 Specialist Agents → Output       │
└──────────────────────────────────────────────────────────┘
```

---

## Agent Pipeline Architecture

The backend uses **Google ADK** to orchestrate a pipeline of 7 specialist agents, each powered by **Gemini 3**. The orchestrator coordinates them in a defined sequence with data flowing downstream.

```
                         ┌─────────────────┐
                    ┌───►│  1. Research     │
                    │    │     Agent        │
                    │    └────────┬─────────┘
                    │             │
                    │    ┌────────▼─────────┐
                    │    │  2. Feature      │
 ┌──────────┐      │    │     Analysis     │
 │ Orchest- │──────┤    └────────┬─────────┘
 │  rator   │      │             │
 │  Agent   │      │    ┌────────▼─────────┐
 └──────────┘      │    │  3. Positioning  │
                    │    │     Intel        │
                    │    └────────┬─────────┘
                    │             │
                    │    ┌────────▼─────────┐
                    │    │  4. SWOT         │
                    │    │     Analysis     │
                    │    └────────┬─────────┘
                    │             │
                    │    ┌────────▼─────────┐
                    │    │  5. Objection    │
                    │    │     Scripts      │
                    │    └────────┬─────────┘
                    │             │
                    │    ┌────────▼─────────┐
                    │    │  6. Battle Card  │
                    │    │     Builder      │
                    │    └────────┬─────────┘
                    │             │
                    │    ┌────────▼─────────┐
                    └───►│  7. Comparison   │
                         │     Infographic  │
                         └─────────────────┘
```

---

## Data Flow

### Input
```json
{
  "competitor": "Competitor Product Name",
  "your_product": "Your Product Name"
}
```

### Pipeline Stages

| Stage | Agent | Input | Output | Tools Used |
|-------|-------|-------|--------|------------|
| 1 | Research Agent | Competitor name | Company profile, funding, customers, reviews | Google Search (Grounding) |
| 2 | Feature Analysis Agent | Research data + competitor name | Feature matrix, integrations, pricing tiers | Google Search, Gemini analysis |
| 3 | Positioning Intel Agent | Research + features data | Messaging strategy, target personas, analyst coverage | Google Search, Gemini analysis |
| 4 | SWOT Analysis Agent | All prior data + your product | Strengths, Weaknesses, Opportunities, Threats grid | Gemini analysis |
| 5 | Objection Scripts Agent | SWOT + positioning data | Top 10 objections with scripted responses | Gemini generation |
| 6 | Battle Card Builder | All prior outputs | Professional HTML battle card document | Gemini generation |
| 7 | Comparison Infographic Agent | Feature + SWOT data | AI-generated visual comparison image | Gemini image generation |

### Final Output
- **Battle Card** - Full HTML document ready for sales reps
- **Comparison Infographic** - Visual PNG/SVG comparison chart
- **Raw Data** - Structured JSON of all intermediate agent outputs

---

## Technology Decisions

### Why Google ADK?
- Native multi-agent orchestration with defined pipelines
- Built-in tool integration (Google Search grounding)
- Session and state management across agents
- First-class Gemini integration

### Why Gemini 3?
- Strong analytical and reasoning capabilities for competitive analysis
- Native image generation for comparison infographics
- Google Search grounding for real-time web research
- Large context window for processing multiple data sources

### Why React + Vite Frontend?
- Fast development with HMR
- TypeScript for type safety across battle card data structures
- Tailwind CSS for rapid UI development
- Axios for streaming/polling agent pipeline progress

---

## Execution Modes

### Sequential (Default)
Agents execute in order 1 → 2 → 3 → 4 → 5 → 6 → 7. Each agent receives the accumulated context from all prior agents.

### Parallel (Optimized)
Stages 1, 2, and 3 can run in parallel since they primarily depend on the input (competitor name) rather than each other. Stages 4-7 run sequentially since they depend on combined outputs.

```
Parallel Phase:   [1. Research] [2. Features] [3. Positioning]
                         │            │              │
                         └────────────┼──────────────┘
                                      │
Sequential Phase:              [4. SWOT Analysis]
                                      │
                              [5. Objection Scripts]
                                      │
                              [6. Battle Card Builder]
                                      │
                              [7. Comparison Infographic]
```

---

## Frontend-Backend Communication

### Option A: Polling
1. Frontend sends `POST /api/battlecard/generate`
2. Backend returns `{ jobId: "abc123" }`
3. Frontend polls `GET /api/battlecard/status/:jobId` every 2-3 seconds
4. Each poll returns current stage, progress %, and partial results
5. Final poll returns completed battle card

### Option B: Server-Sent Events (SSE)
1. Frontend sends `POST /api/battlecard/generate`
2. Backend opens SSE stream
3. Each agent completion pushes an event with stage data
4. Final event contains the complete battle card

### Option C: WebSocket
1. Persistent connection for real-time bidirectional communication
2. Backend pushes agent progress, partial results, and final output
3. Frontend can send cancellation or parameter updates mid-pipeline
