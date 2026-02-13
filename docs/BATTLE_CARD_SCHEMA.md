# Battle Card Data Schema

Complete data structures for the battle card pipeline inputs, intermediate outputs, and final deliverables.

---

## Pipeline Input

```typescript
interface BattleCardRequest {
  competitor: string;              // e.g., "Gong.io"
  yourProduct: string;             // e.g., "AI Sales Agent"
  options?: {
    includeInfographic?: boolean;  // default: true
    detailLevel?: 'standard' | 'detailed';
    focusAreas?: FocusArea[];
  };
}

type FocusArea = 'pricing' | 'features' | 'security' | 'integrations' | 'support';
```

---

## Stage 1: Research Output

```typescript
interface ResearchOutput {
  company: {
    name: string;
    founded: string;
    hq: string;
    employeeCount: string;
    description: string;
    website: string;
    leadership: Array<{
      name: string;
      title: string;
    }>;
  };
  funding: {
    totalRaised: string;
    lastRound: string;
    lastRoundDate: string;
    valuation: string;
    investors: string[];
  };
  customers: Array<{
    name: string;
    industry: string;
    caseStudyUrl?: string;
  }>;
  reviewSummary: {
    platforms: Array<{
      name: string;           // "G2", "Capterra", etc.
      rating: number;
      totalReviews: number;
    }>;
    topPros: string[];
    topCons: string[];
    sentimentScore: number;   // 0-100
  };
  recentNews: Array<{
    title: string;
    date: string;
    source: string;
    summary: string;
  }>;
  marketCategory: string;
  sources: string[];
}
```

---

## Stage 2: Feature Analysis Output

```typescript
interface FeatureAnalysisOutput {
  features: Array<{
    category: string;           // "Core", "Analytics", "Integrations", etc.
    items: Array<{
      name: string;
      description: string;
      maturity: 'basic' | 'good' | 'advanced';
      isUnique: boolean;        // unique to competitor?
    }>;
  }>;
  integrations: Array<{
    name: string;
    category: string;           // "CRM", "Communication", "Data", etc.
    depth: 'native' | 'api' | 'third-party';
  }>;
  pricing: {
    model: string;              // "per seat", "usage-based", "flat rate"
    currency: string;
    tiers: Array<{
      name: string;
      price: string;
      billingCycle: string;
      features: string[];
      limits: string[];
    }>;
    freeTier: boolean;
    freeTrial: boolean;
    trialDays?: number;
  };
  technical: {
    deployment: string[];       // ["cloud", "on-prem", "hybrid"]
    apiAvailable: boolean;
    apiDocumentation: string;
    security: string[];         // ["SOC 2", "GDPR", "HIPAA"]
    uptime: string;
  };
}
```

---

## Stage 3: Positioning Intel Output

```typescript
interface PositioningIntelOutput {
  messaging: {
    tagline: string;
    valueProposition: string;
    keyMessages: string[];
    toneOfVoice: string;
  };
  targetPersonas: Array<{
    role: string;               // "VP Sales", "RevOps Manager", etc.
    seniority: string;
    painPoints: string[];
    buyingCriteria: string[];
    objections: string[];
  }>;
  analystCoverage: Array<{
    firm: string;               // "Gartner", "Forrester"
    report: string;
    position: string;           // "Leader", "Challenger", etc.
    year: string;
  }>;
  competitivePositioning: Array<{
    againstCompetitor: string;
    theirClaim: string;
    reality: string;
  }>;
  differentiators: Array<{
    claim: string;
    evidence: string;
    isValid: boolean;
  }>;
  contentThemes: string[];
}
```

---

## Stage 4: SWOT Analysis Output

```typescript
interface SwotAnalysisOutput {
  strengths: Array<{
    point: string;
    impact: 'high' | 'medium' | 'low';
    detail: string;
    evidence: string;
  }>;
  weaknesses: Array<{
    point: string;
    impact: 'high' | 'medium' | 'low';
    detail: string;
    howToExploit: string;
  }>;
  opportunities: Array<{
    point: string;
    detail: string;
    actionItem: string;
  }>;
  threats: Array<{
    point: string;
    detail: string;
    mitigation: string;
  }>;
  headToHead: Array<{
    dimension: string;          // "Pricing", "Ease of Use", etc.
    yourScore: number;          // 1-5
    theirScore: number;         // 1-5
    verdict: 'win' | 'lose' | 'tie';
    detail: string;
  }>;
  winScenarios: Array<{
    scenario: string;
    whyYouWin: string;
    talkingPoints: string[];
  }>;
  lossScenarios: Array<{
    scenario: string;
    whyYouLose: string;
    counterStrategy: string;
  }>;
}
```

---

## Stage 5: Objection Scripts Output

```typescript
interface ObjectionScriptsOutput {
  objections: Array<{
    rank: number;                // 1-10 (most likely first)
    category: ObjectionCategory;
    objection: string;           // what the prospect says
    context: string;             // when this comes up
    response: string;            // scripted sales response
    proofPoints: string[];       // data/evidence to cite
    bridgePhrase: string;        // phrase to pivot the conversation
    customerReference?: string;  // reference customer to name-drop
  }>;
}

type ObjectionCategory =
  | 'price'
  | 'feature_gap'
  | 'trust'
  | 'switching_cost'
  | 'integration'
  | 'competitor_preference'
  | 'timing'
  | 'internal_resistance';
```

---

## Stage 6: Battle Card HTML Output

```typescript
interface BattleCardOutput {
  html: string;                 // complete self-contained HTML
  metadata: {
    competitor: string;
    yourProduct: string;
    generatedAt: string;
    version: string;
    agentVersions: Record<string, string>;
  };
}
```

**HTML Battle Card Sections:**

| # | Section | Purpose |
|---|---------|---------|
| 1 | Executive Summary | 2-3 sentence overview for quick scan |
| 2 | Competitor Snapshot | Company info, funding, customer logos |
| 3 | Feature Comparison | Side-by-side table (you vs. them) |
| 4 | Where We Win | Green-highlighted advantages |
| 5 | Where They Win | Red-highlighted areas to be careful |
| 6 | SWOT Grid | 2x2 visual SWOT matrix |
| 7 | Objection Handling | Quick-reference Q&A format |
| 8 | Key Talking Points | Bullet-point cheat sheet |
| 9 | Landmines to Set | Discovery questions that expose competitor weaknesses |
| 10 | Pricing Comparison | Side-by-side pricing table |

---

## Stage 7: Comparison Infographic Output

```typescript
interface ComparisonInfographicOutput {
  imageBase64: string;          // base64-encoded PNG
  mimeType: 'image/png';
  dimensions: {
    width: number;
    height: number;
  };
  altText: string;
}
```

---

## Complete Battle Card (Final Assembled Output)

```typescript
interface CompleteBattleCard {
  id: string;
  competitor: string;
  yourProduct: string;
  createdAt: string;
  status: 'completed';
  battleCardHtml: string;
  infographic: {
    imageBase64: string;
    mimeType: string;
  };
  rawData: {
    research: ResearchOutput;
    features: FeatureAnalysisOutput;
    positioning: PositioningIntelOutput;
    swot: SwotAnalysisOutput;
    objections: ObjectionScriptsOutput;
  };
  metadata: {
    totalDuration: number;      // seconds
    stageDurations: Record<string, number>;
    sourcesUsed: number;
    dataPointsCollected: number;
  };
}
```

---

## Pipeline Progress Event

Used for real-time progress tracking on the frontend.

```typescript
interface PipelineProgressEvent {
  jobId: string;
  status: 'processing' | 'completed' | 'failed';
  progress: number;             // 0-100
  currentStage: StageName | null;
  completedStages: Array<{
    stage: StageName;
    completedAt: string;
    duration: number;           // seconds
    summary: string;
  }>;
  pendingStages: StageName[];
  error?: {
    stage: StageName;
    message: string;
    retryable: boolean;
  };
}

type StageName =
  | 'research'
  | 'feature_analysis'
  | 'positioning_intel'
  | 'swot_analysis'
  | 'objection_scripts'
  | 'battle_card'
  | 'comparison_infographic';
```
