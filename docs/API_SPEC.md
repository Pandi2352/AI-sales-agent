# API Specification

REST API endpoints for the AI Sales Agent backend.

**Base URL:** `http://localhost:8000/api`

---

## Battle Card Generation

### Generate Battle Card

Start the multi-agent pipeline to generate a competitive battle card.

```
POST /api/battlecard/generate
```

**Request Body:**
```json
{
  "competitor": "Competitor Product Name",
  "yourProduct": "Your Product Name",
  "options": {
    "includeInfographic": true,
    "detailLevel": "standard|detailed",
    "focusAreas": ["pricing", "features", "security"]
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "bc_a1b2c3d4e5f6",
    "status": "processing",
    "estimatedTime": 120
  }
}
```

---

### Get Job Status

Poll for pipeline progress and partial results.

```
GET /api/battlecard/status/:jobId
```

**Response (in progress):**
```json
{
  "success": true,
  "data": {
    "jobId": "bc_a1b2c3d4e5f6",
    "status": "processing",
    "progress": 42,
    "currentStage": "feature_analysis",
    "completedStages": [
      {
        "stage": "research",
        "completedAt": "2025-01-15T10:30:15Z",
        "summary": "Found 45 data points across 12 sources"
      }
    ],
    "pendingStages": [
      "positioning_intel",
      "swot_analysis",
      "objection_scripts",
      "battle_card",
      "comparison_infographic"
    ]
  }
}
```

**Response (completed):**
```json
{
  "success": true,
  "data": {
    "jobId": "bc_a1b2c3d4e5f6",
    "status": "completed",
    "progress": 100,
    "completedAt": "2025-01-15T10:32:45Z",
    "result": {
      "battleCardId": "card_x1y2z3",
      "battleCardHtml": "<html>...</html>",
      "infographicUrl": "/api/battlecard/card_x1y2z3/infographic",
      "rawData": { ... }
    }
  }
}
```

---

### Get Battle Card

Retrieve a previously generated battle card.

```
GET /api/battlecard/:battleCardId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "card_x1y2z3",
    "competitor": "Competitor Name",
    "yourProduct": "Your Product",
    "createdAt": "2025-01-15T10:32:45Z",
    "html": "<html>...</html>",
    "sections": {
      "research": { ... },
      "features": { ... },
      "positioning": { ... },
      "swot": { ... },
      "objections": { ... }
    }
  }
}
```

---

### Get Infographic

Retrieve the AI-generated comparison infographic.

```
GET /api/battlecard/:battleCardId/infographic
```

**Response:** Binary image (PNG) with `Content-Type: image/png`

---

### List Battle Cards

Retrieve all previously generated battle cards.

```
GET /api/battlecard/list
```

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 10 | Items per page |
| `search` | string | - | Search by competitor name |

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "card_x1y2z3",
        "competitor": "Competitor Name",
        "yourProduct": "Your Product",
        "createdAt": "2025-01-15T10:32:45Z",
        "status": "completed"
      }
    ],
    "total": 25,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

---

### Delete Battle Card

```
DELETE /api/battlecard/:battleCardId
```

**Response:**
```json
{
  "success": true,
  "message": "Battle card deleted successfully"
}
```

---

## Server-Sent Events (SSE) - Real-time Progress

For real-time progress updates instead of polling.

```
GET /api/battlecard/stream/:jobId
```

**Event Stream:**
```
event: stage_start
data: {"stage": "research", "message": "Researching competitor..."}

event: stage_complete
data: {"stage": "research", "progress": 14, "summary": "Found 45 data points"}

event: stage_start
data: {"stage": "feature_analysis", "message": "Analyzing features..."}

event: stage_complete
data: {"stage": "feature_analysis", "progress": 28, "summary": "Identified 32 features"}

...

event: complete
data: {"battleCardId": "card_x1y2z3", "progress": 100}
```

---

## Authentication

### Login

```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG...",
    "user": {
      "id": "usr_abc123",
      "name": "John Doe",
      "email": "user@example.com"
    }
  }
}
```

### Refresh Token

```
POST /api/auth/refresh
```

### Logout

```
POST /api/auth/logout
```

---

## Error Responses

All errors follow a consistent format:

```json
{
  "success": false,
  "message": "Human-readable error description",
  "error": {
    "code": "VALIDATION_ERROR",
    "details": []
  }
}
```

**Error Codes:**
| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `VALIDATION_ERROR` | Invalid request body |
| 401 | `UNAUTHORIZED` | Missing or invalid auth token |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `PIPELINE_ERROR` | Agent pipeline failure |
| 503 | `SERVICE_UNAVAILABLE` | Gemini API unavailable |
