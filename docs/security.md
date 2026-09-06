# Production Security Hardening & Threat Defense Architecture

## 1. Security Architecture Overview

CareerAI implements a **Defense-in-Depth** security model across the entire application lifecycle, protecting user data, API endpoints, WebSocket rooms, background queues, and AI model interactions.

```
[Incoming Request] ──► [Helmet Security Headers (CSP, HSTS, X-Frame-Options)]
                                   │
                                   ▼
                       [CORS Origin Whitelist]
                                   │
                                   ▼
                        [Rate Limiting Defense]
                  (authLimiter, aiLimiter, apiLimiter)
                                   │
                                   ▼
                     [NoSQL Injection Sanitizer]
                    (Recursively strips $ operators)
                                   │
                                   ▼
                    [JWT & HTTP-Only Cookie Guard]
                                   │
                                   ▼
                  [Multi-Tenant User Isolation Guard]
                    (Strict req.user._id scoping)
                                   │
                                   ▼
                         [AI Security Sandbox]
           ├─ 1. Untrusted Context Framing (XML delimiters)
           ├─ 2. Anti-Instruction Override Directives
           └─ 3. Prototype-Free Tool Sandbox (Object.create(null))
```

---

## 2. Authentication & Session Security

1. **HTTP-Only & Secure Cookies**:
   - `httpOnly: true` (prevents client-side JavaScript access and XSS token theft).
   - `secure: true` in production (enforces HTTPS transmission).
   - `sameSite: 'lax'` in development / `'none'` in cross-site production.
   - Root scoped (`path: '/'`) with 30-day expiration.
2. **Password Cryptography**:
   - Passwords hashed using `bcryptjs` with $10$ salt rounds.
   - Password hashes are never stored in plaintext and are omitted from all Mongoose query projections by default (`select: false`).
3. **JWT Guardrails**:
   - Tokens signed with cryptographically strong secret keys.
   - Tampered, forged, or expired tokens are rejected with `401 Unauthorized`.

---

## 3. Network & Transport Security

1. **Helmet HTTP Headers**:
   - `X-Content-Type-Options: nosniff` (blocks MIME-type sniffing).
   - `X-Frame-Options: SAMEORIGIN` (prevents clickjacking attacks).
   - `Content-Security-Policy (CSP)` (restricts unauthorized script execution).
2. **CORS Restrictions**:
   - Cross-Origin Resource Sharing is locked to whitelisted client domains (`http://localhost:5173`) with credentials enabled.
3. **Tiered Rate Limiting**:
   - `authLimiter`: 250 requests/15m on login and register endpoints to prevent brute-force attacks.
   - `aiLimiter`: 300 requests/10m on computationally expensive LLM endpoints.
   - `apiLimiter`: 1000 requests/15m on general REST routes.

---

## 4. Input Sanitization & NoSQL Query Safety

* **Recursive Query Sanitizer (`sanitizationMiddleware.js`)**:
  - Traverses incoming `req.body`, `req.query`, and `req.params`.
  - Strips MongoDB query operators (`$gt`, `$where`, `$ne`, `$regex`, `$or`, `$exists`) and dot notation to block NoSQL injection vectors.
* **Strict Type Checking (`authController.js`)**:
  - Validates that `email` and `password` are non-empty primitive strings before passing to database queries.

---

## 5. Multi-Tenant Data Isolation

Every resource collection (`resumes`, `jobs`, `interviews`, `roadmaps`, `memories`, `vectorchunks`) enforces strict multi-tenant scoping:
* All `find`, `findById`, `updateOne`, and `deleteOne` operations include `userId: req.user._id`.
* Unauthorized attempts to access, modify, or delete another user's records result in `404 Not Found` or `403 Forbidden`.

---

## 6. Real-Time Socket.IO Security

1. **Handshake Authentication**:
   - Socket connection rejects unauthenticated clients during the initial handshake with `Authentication error`.
2. **Room Authorization**:
   - When joining room `interview:${id}`, the socket handler validates that `socket.userId === interview.userId.toString()`.
   - Unauthorized candidates are immediately blocked from eavesdropping or submitting answers to other users' interview sessions.

---

## 7. AI Prompt Injection & Tool Sandboxing

1. **Untrusted Data Framing**:
   - Candidate resumes, job postings, GitHub READMEs, and retrieved chunks are wrapped inside explicit `<untrusted_input>` blocks.
   - System prompts enforce that retrieved documents are **data, not instructions**.
2. **Tool Calling Sandboxing**:
   - The mentor tool registry (`TOOLS_REGISTRY`) is created using `Object.create(null)` and frozen with `Object.freeze()`.
   - This eliminates `__proto__` injection or object prototype traversal.
   - Dynamic code evaluation (`eval()`, `Function()`, `child_process.exec()`) is strictly prohibited.
3. **Frontend Secret Protection**:
   - Automated scans confirm zero API keys (`GEMINI_API_KEY`, `JWT_SECRET`) are bundled into client-side code.

---

## 8. Error Sanitization in Production

* In production mode (`NODE_ENV === 'production'`), internal server errors return generic messages (`"Internal server error"`) and suppress database schema specifics, stack traces, and local file paths.
