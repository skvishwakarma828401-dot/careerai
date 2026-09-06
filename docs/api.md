# CareerAI REST & WebSocket API Specification

## 1. Authentication & Security Headers

All protected endpoints require an authenticated session via an HTTP-Only cookie named `token` containing a signed JWT.

### Standard Response Format
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional status message"
}
```

### Standard Error Response Format
```json
{
  "success": false,
  "message": "Human-readable error description",
  "errors": [ ... ]
}
```

---

## 2. Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Register new user account with bcrypt password hashing |
| `POST` | `/api/auth/login` | Public | Authenticate user, issue HTTP-only JWT cookie |
| `POST` | `/api/auth/logout` | Protected | Clear session cookie |
| `GET` | `/api/auth/me` | Protected | Retrieve authenticated user profile |

---

## 3. Resume Intelligence Endpoints (`/api/resumes`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/resumes/upload` | Protected | Upload `.pdf` or `.docx` resume file via multipart/form-data |
| `POST` | `/api/resumes/upload?async=true` | Protected | Enqueue asynchronous BullMQ background extraction & embedding |
| `POST` | `/api/resumes/:id/analyze` | Protected | Trigger AI ATS scoring and technical skill extraction |
| `GET` | `/api/resumes` | Protected | List all resumes belonging to authenticated user |
| `GET` | `/api/resumes/:id` | Protected | Retrieve single parsed resume by ID |
| `DELETE` | `/api/resumes/:id` | Protected | Delete resume and cascade delete associated vector embeddings |

---

## 4. Job Description Intelligence (`/api/jobs`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/jobs` | Protected | Create and parse job posting description with AI skill extraction |
| `GET` | `/api/jobs` | Protected | List all saved job descriptions for user |
| `GET` | `/api/jobs/:id` | Protected | Retrieve single job description by ID |
| `DELETE` | `/api/jobs/:id` | Protected | Delete job description record |
| `GET` | `/api/jobs/status/:jobId` | Protected | Poll status of asynchronous BullMQ background job (`queued`, `active`, `completed`, `failed`) |

---

## 5. Resume-to-Job Semantic Matcher (`/api/jobs/:id/match-resume/:resumeId`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/jobs/:id/match-resume/:resumeId` | Protected | Run deterministic 3-tier matching engine between resume and job |

### Sample Response:
```json
{
  "success": true,
  "data": {
    "matchScore": 84,
    "matchingSkills": ["React", "Node.js", "MongoDB", "Express", "REST APIs"],
    "missingSkills": ["Redis", "BullMQ", "Docker", "Kubernetes"],
    "strongMatches": ["React", "Node.js", "MongoDB"],
    "weakMatches": ["System Design"],
    "priorityGaps": [
      { "skill": "Redis", "importance": "high", "recommendation": "Implement caching layer on API endpoints." }
    ],
    "breakdown": {
      "skillScore": 88,
      "semanticScore": 82,
      "experienceScore": 80
    }
  }
}
```

---

## 6. Grounded RAG Career Assistant (`/api/ai/rag/query`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/rag/query` | Protected | Query user career knowledge base using dense vector search & LLM grounding |

### Request Payload:
```json
{
  "question": "What are my biggest skill gaps for the Senior Full Stack role?",
  "topK": 5
}
```

---

## 7. AI Mock Interview System (`/api/interviews`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/interviews` | Protected | Generate personalized interview questions based on resume & job |
| `GET` | `/api/interviews` | Protected | List all mock interview sessions |
| `GET` | `/api/interviews/:id` | Protected | Retrieve interview details and questions |
| `POST` | `/api/interviews/:id/start` | Protected | Initialize interview session timer and set state to active |
| `POST` | `/api/interviews/:id/answer` | Protected | Submit candidate answer; AI evaluates 6 technical/communication metrics |
| `POST` | `/api/interviews/:id/next-question` | Protected | Retrieve next question with adaptive difficulty adjustment |
| `POST` | `/api/interviews/:id/complete` | Protected | Finalize interview and generate comprehensive hiring scorecard |
| `GET` | `/api/interviews/:id/report` | Protected | Retrieve final interview diagnostic report |

---

## 8. AI Career Mentor with Persistent Memory (`/api/ai/mentor`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/ai/mentor/chat` | Protected | Conversational career mentoring with autonomous tool invocation |
| `GET` | `/api/ai/mentor/memories` | Protected | List long-term persistent memory items for user |
| `POST` | `/api/ai/mentor/memories` | Protected | Manually create or update career memory record |
| `DELETE` | `/api/ai/mentor/memories/:id` | Protected | Delete career memory entry |

---

## 9. Learning Roadmaps & Career Analytics

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/roadmaps/generate` | Protected | Generate 4-week structured milestone roadmap based on skill gaps |
| `GET` | `/api/roadmaps` | Protected | List user career roadmaps |
| `PATCH` | `/api/roadmaps/:id/progress` | Protected | Mark topic complete / toggle progress and recalculate percentage |
| `GET` | `/api/analytics` | Protected | Get aggregated metrics across resumes, job matches, interviews, and roadmaps |

---

## 10. Real-Time Socket.IO WebSocket Specification

### Connection URL: `ws://localhost:5000` (or reverse proxied via `/socket.io/`)

### Handshake Authentication:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: 'jwt_token_here' },
  withCredentials: true
});
```

### Client-to-Server Events
* `startInterview` — `{ interviewId }`
* `submitAnswer` — `{ interviewId, questionIndex, answerText, speechSignals }`
* `pauseInterview` — `{ interviewId }`
* `resumeInterview` — `{ interviewId }`
* `endInterview` — `{ interviewId }`

### Server-to-Client Events
* `interviewStarted` — `{ interviewId, startedAt, firstQuestion }`
* `aiThinking` — `{ status: true, message: "AI is evaluating your technical answer..." }`
* `aiResponseChunk` — `{ chunk: "..." }`
* `questionReady` — `{ nextQuestion, questionIndex, currentDifficulty }`
* `answerEvaluated` — `{ evaluation: { technicalAccuracy, problemSolving, communication } }`
* `scoreUpdated` — `{ currentOverallScore, completedCount }`
* `interviewCompleted` — `{ overallScore, reportId }`
* `error` — `{ message: "Unauthorized or invalid session" }`
