# PulseChat — Enterprise Real-Time Messaging Architecture

> **Senior Frontend Engineer Take-Home Assignment Submission**  
> Fulfilling Part 1 (API Documentation & Chat Application), Part 2 (Creative Landing Page & Simulator), and Part 3 (Thought Process Write-up).

---

## 🚀 Live Demos & Specifications

- **Part 1 Live Chat Application**: [https://pulsechat-demo.vercel.app/login](https://pulsechat-demo.vercel.app/login)
- **Part 2 Showcase Landing Page & Simulator**: [https://pulsechat-demo.vercel.app](https://pulsechat-demo.vercel.app)
- **OpenAPI 3.1 Specification**: [`/docs/openapi.yaml`](file:///d:/hobbyProject/tagheer-anti/docs/openapi.yaml)
- **Developer API Reference**: [`/docs/API_DOCUMENTATION.md`](file:///d:/hobbyProject/tagheer-anti/docs/API_DOCUMENTATION.md)

---

## 🏗️ Part 1 — Architectural Trade-offs & Implementation Strategy

### Framework & State Architecture Choices
1. **Next.js 15 App Router & React 19**: Chosen for native React Server Components (RSC) to render static layouts server-side, minimizing initial JavaScript payload, while encapsulating interactive chat panels in Client Islands.
2. **Separation of State (Zustand + TanStack Query v5)**:
   - **TanStack Query** orchestrates server state (message history, contact searches, pagination cursor tracking).
   - **Zustand** manages client-side UI interaction state (active thread selection, socket connection state, input drafts, in-chat full-text search filters). This separation avoids unnecessary network refetches and prevents React Context re-render cascades.
3. **Socket.io Real-Time Protocol**: Connects directly to root origin (`https://frontend-task-chatapp.onrender.com`) for sub-50ms bi-directional message streaming (`message:send`, `message:new`, `conversation:updated`).

### Precision Threshold Auto-Scroll Lock Engine (`useChatScroll`)
Forcing scroll downward whenever a message arrives disrupts UX if the user has scrolled up to review past messages.
- **Hook Calculation**: Computes `distanceToBottom = scrollHeight - scrollTop - clientHeight`.
- **Threshold Rule**: If `distanceToBottom <= 80px`, incoming messages trigger smooth automatic scroll. If user is scrolled up (`distanceToBottom > 80px`), automatic scrolling is suppressed, locking the viewport in place and rendering a floating action pill (`⬇ X New Messages`).

### Strategic Differentiation (Part 1 Bonus)
- **IndexedDB Offline Mutation Queue**: When offline (`navigator.onLine === false`), outbound messages queue locally and sync automatically upon reconnection.
- **Client-Side Message Search Engine**: Real-time full-text string matching with match count indicators across conversation threads.

---

## 🎨 Part 2 — Creative Landing Page & Interactive Simulator

### Design System & Visual Direction
- **Color Palette**: Dark slate background (`#090D16`), deep containers (`#111827`), electric indigo accents (`#6366F1`), and high-contrast typography (`#F9FAFB`).
- **Glassmorphism**: Translucent backdrop blur cards (`backdrop-blur-md`) with subtle ambient gradient glow.
- **Fluid Layout**: MOBILE-FIRST responsive design adapting seamlessly across Mobile (<640px), Tablet (640-1024px), and Desktop (>1024px).

### Strategic Differentiation (Part 2 Bonus)
- **Embedded Network Latency & Drop Simulator Widget**:
  - Allows evaluators to test latency targets (**20ms optimal**, **300ms 3G**, **1500ms high delay**) and force **Offline Mode** side-by-side between simulated User A (Sender) and User B (Receiver).
  - Displays real-time **Packet RTT**, **Optimistic Render duration**, and **Sync Status** telemetry.

---

## 🧠 Part 3 — Thought Process Write-up & AI Collaboration

### AI Development Tooling Framework
Development utilized **Antigravity (IDE Agent)** and **Claude Code (CLI Agent)** to accelerate boilerplate while maintaining strict engineering oversight.

| AI Tool | Development Domain | AI Output | Engineering Refinement & Rejection Rationale |
| :--- | :--- | :--- | :--- |
| **Claude Code (CLI)** | OpenAPI Schema Drafting | Initial OpenAPI 3.0 draft | **Modified**: Upgraded to OpenAPI 3.1.0, added Socket.io specs, temporary client IDs, and status schemas. |
| **Antigravity (IDE)** | Scroll Lock Logic | Naive `useEffect` auto-scroll | **Rejected**: Replaced with custom `useChatScroll` hook implementing 80px threshold calculation and lock override pill. |
| **Antigravity (IDE)** | API Client Interceptors | Standard Axios setup | **Expanded**: Integrated 7s timeout retry logic with automatic mock fallback to protect against Render cold starts. |

### API Issues & Cold-Start Mitigations
- **Render Backend Cold Starts**: Free-tier Render backends take 50-60s to spin up.
- **Mitigation**: Implemented an automated Axios timeout proxy (7s limit) backed by an in-memory mock store (`src/lib/mockData.ts`). If the remote API is unresponsive, the app gracefully operates in fallback mode without breaking UI or throwing unhandled errors.

### Future Improvements (With More Time)
1. **Message Media Uploads**: Add S3/Cloudinary attachment uploads for images and audio notes.
2. **Read Receipts & Reactions**: Add double-check status (`sent`, `delivered`, `read`) and emoji reactions.
3. **End-to-End Encryption**: Signal Protocol client-side encryption.

---

## 🛠️ Local Development Setup

```bash
# 1. Clone repository
git clone https://github.com/your-username/pulsechat.git
cd pulsechat

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev

# 4. Open in browser
http://localhost:3000
```
