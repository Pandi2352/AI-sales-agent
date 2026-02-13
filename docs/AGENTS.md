# Agent Specifications

Detailed specification for each agent in the multi-agent pipeline.

---

## Orchestrator Agent

**Role:** Pipeline coordinator that manages execution order, passes context between agents, handles errors, and assembles the final output.

**Responsibilities:**
- Accept user input (competitor + your product)
- Dispatch agents in the correct order
- Accumulate context and pass downstream
- Handle agent failures with retries or fallbacks
- Assemble final battle card from all agent outputs
- Report progress to the frontend

---

## Agent 1: Research Agent

**Role:** Gather comprehensive competitor intelligence from the web.

**Model:** Gemini 3 with Google Search grounding

**Input:**
```
Competitor name: "{competitor}"
```

**Tasks:**
- Company overview (founded, HQ, employee count, leadership)
- Funding history and valuation
- Key customers and case studies
- G2/Capterra/TrustRadius review summaries
- Recent news and press releases
- Market category and positioning

**Output Schema:**
```json
{
  "company": {
    "name": "",
    "founded": "",
    "hq": "",
    "employees": "",
    "funding": "",
    "valuation": "",
    "leadership": []
  },
  "customers": [],
  "reviewSummary": {
    "avgRating": 0,
    "totalReviews": 0,
    "topPros": [],
    "topCons": []
  },
  "recentNews": [],
  "marketCategory": ""
}
```

---

## Agent 2: Feature Analysis Agent

**Role:** Deep dive into competitor product capabilities, pricing, and integrations.

**Model:** Gemini 3 with Google Search grounding

**Input:** Research Agent output + competitor name

**Tasks:**
- Core feature breakdown by category
- Integration ecosystem
- Pricing tiers and model (per seat, usage-based, etc.)
- Technical architecture (cloud, on-prem, hybrid)
- API availability and developer experience
- Security and compliance certifications

**Output Schema:**
```json
{
  "features": [
    {
      "category": "",
      "items": [
        { "name": "", "description": "", "maturity": "basic|good|advanced" }
      ]
    }
  ],
  "integrations": [],
  "pricing": {
    "model": "",
    "tiers": [
      { "name": "", "price": "", "features": [] }
    ],
    "freeTrial": false
  },
  "technical": {
    "deployment": "",
    "api": "",
    "security": []
  }
}
```

---

## Agent 3: Positioning Intel Agent

**Role:** Uncover how the competitor positions themselves in the market.

**Model:** Gemini 3 with Google Search grounding

**Input:** Research + Feature Analysis outputs

**Tasks:**
- Core messaging and taglines
- Target buyer personas
- Analyst coverage (Gartner, Forrester, etc.)
- How they position against specific competitors
- Key differentiators they emphasize
- Content marketing themes and thought leadership

**Output Schema:**
```json
{
  "messaging": {
    "tagline": "",
    "valueProposition": "",
    "keyMessages": []
  },
  "targetPersonas": [
    { "role": "", "painPoints": [], "buyingCriteria": [] }
  ],
  "analystCoverage": [],
  "competitivePositioning": [],
  "differentiators": [],
  "contentThemes": []
}
```

---

## Agent 4: SWOT Analysis Agent

**Role:** Create an honest strengths/weaknesses comparison between the competitor and your product.

**Model:** Gemini 3 (analysis mode, no search)

**Input:** All prior agent outputs + your product name

**Tasks:**
- Identify competitor strengths (where they beat you)
- Identify competitor weaknesses (where you beat them)
- Market opportunities you can exploit
- Threats they pose to your business
- Head-to-head comparison on key dimensions
- Win/loss scenario analysis

**Output Schema:**
```json
{
  "strengths": [
    { "point": "", "impact": "high|medium|low", "detail": "" }
  ],
  "weaknesses": [
    { "point": "", "impact": "high|medium|low", "detail": "" }
  ],
  "opportunities": [
    { "point": "", "detail": "" }
  ],
  "threats": [
    { "point": "", "detail": "" }
  ],
  "headToHead": [
    { "dimension": "", "you": "win|lose|tie", "detail": "" }
  ],
  "winScenarios": [],
  "lossScenarios": []
}
```

---

## Agent 5: Objection Scripts Agent

**Role:** Generate ready-to-use objection handling scripts for sales calls.

**Model:** Gemini 3 (generation mode)

**Input:** SWOT + Positioning Intel outputs

**Tasks:**
- Identify top 10 likely objections a prospect would raise
- Write scripted responses for each objection
- Include proof points, data, and customer references
- Provide "bridge" phrases to redirect conversations
- Tag each objection by category (price, feature, trust, etc.)

**Output Schema:**
```json
{
  "objections": [
    {
      "rank": 1,
      "category": "price|feature|trust|switching|integration",
      "objection": "What the prospect says",
      "response": "Scripted response",
      "proofPoints": [],
      "bridgePhrase": ""
    }
  ]
}
```

---

## Agent 6: Battle Card Builder Agent

**Role:** Assemble all data into a professional, print-ready HTML battle card.

**Model:** Gemini 3 (generation mode)

**Input:** All prior agent outputs

**Tasks:**
- Generate professional HTML battle card document
- Include quick-reference sections for sales calls
- Add visual formatting (color-coded win/lose indicators)
- Create executive summary at the top
- Include "cheat sheet" sidebar with key talking points
- Make it scannable (bullet points, tables, icons)

**Output:**
- Complete HTML document (self-contained, inline CSS)
- Battle card structured for quick reference during sales calls

**Sections in Battle Card:**
1. Executive Summary (2-3 sentences)
2. Competitor Snapshot (company info, funding, customers)
3. Feature Comparison Table (you vs. them)
4. Where We Win / Where They Win
5. SWOT Grid
6. Top Objections & Responses (quick-reference format)
7. Key Talking Points
8. Landmines to Set (questions to ask prospects that expose competitor weaknesses)

---

## Agent 7: Comparison Infographic Agent

**Role:** Create an AI-generated visual comparison chart.

**Model:** Gemini 3 (image generation mode)

**Input:** Feature Analysis + SWOT data

**Tasks:**
- Generate a visual feature-by-feature comparison
- Use clear iconography (checkmarks, X marks, partial fills)
- Color-coded scoring (green = you win, red = they win, yellow = tie)
- Clean, professional design suitable for slide decks
- Include overall scores or ratings

**Output:**
- PNG or SVG comparison infographic
- Base64 encoded for frontend display
