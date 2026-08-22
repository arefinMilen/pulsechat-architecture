# **Architectural Blueprint and Strategic Execution Framework for Enterprise Real-Time Chat Applications in Next.js 15**

## **Executive Architecture and Technological Foundations**

To achieve technical distinction in a competitive technical evaluation, a web application must be engineered not as a basic prototype, but as an enterprise-grade, production-ready system1. Evaluation criteria for modern senior frontend roles strictly evaluate code organization, architectural maintainability, user experience polish, real-time message handling resilience, responsive layout adaptability, search engine optimization (SEO), and structured documentation1.  
The optimal stack leverages Next.js 15 (App Router) with React 19, TypeScript 5.x in strict mode, Tailwind CSS v4, Zustand for localized client state management, and TanStack Query v5 (React Query) for server state orchestration2. This combination maximizes server-side rendering (SSR) efficiency, minimizes JavaScript bundle sizes delivered to the client, and enforces clear separation between interactive client user interfaces and server-side operations3.

| Subsystem Layer | Selected Technology | Evaluated Alternative | Architectural Rationale |
| :---- | :---- | :---- | :---- |
| **Core Framework** | Next.js 15 (App Router) | Vite React SPA | Delivers native React Server Components (RSC), hybrid SSR/SSG capabilities, route group segmentations, and built-in metadata rendering engines3. |
| **Language Runtime** | TypeScript 5.x (Strict) | JavaScript (ES6+) | Guarantees end-to-end static typing, compile-time contract enforcement, and self-documenting codebases across API networks1. |
| **UI & Styling Layer** | Tailwind CSS v4 \+ Shadcn UI | Material UI / CSS Modules | Eliminates runtime CSS-in-JS performance overhead, supports container queries natively, and provides customizable headless primitive components2. |
| **Server State Manager** | TanStack Query v5 | Native Fetch / SWR | Manages background refetching, request deduplication, cache invalidation, parallel querying, and optimistic mutation states4. |
| **Client State Engine** | Zustand | Redux Toolkit / Context API | Implements a lightweight (1KB) state store without template boilerplate, avoiding the component re-rendering cascades common to React Context2. |
| **Real-Time Data Engine** | WebSockets \+ SSE Fallback | Standard Long Polling | Delivers sub-50ms bidirectional frame transport while maintaining dynamic fallback options for serverless runtimes1. |
| **Data Validation** | Zod | Yup / Joi | Provides native TypeScript type inference and integration with forms, API payload handlers, and environment variables3. |

React Server Components serve as orchestration wrappers, fetching static assets and delegating business domain execution to modular feature slices3. Interactive elements—such as the real-time message stream, contact lookup panels, and input elements—are isolated within client components using the 'use client' directive to maintain localized state boundaries3.

## **Feature-Sliced Directory Design and System Modularization**

A maintainable codebase requires a structured folder hierarchy that isolates application logic from routing configurations, preventing technical debt as feature scope expands2. Following Feature-Sliced Design (FSD) methodologies, the application isolates routing configurations inside the app/ directory while keeping all core domain logic inside a dedicated src/ directory2.

### **System Layout Hierarchy**

The application source tree separates infrastructure, features, and generic UI elements into distinct layers:

* app/: Routing layer containing exclusively root layout configurations, segment routes, loading skeletons, error boundaries, and metadata tags2.  
  * (auth)/login/: Authenticated user session routing1.  
  * (chat)/conversations/: Main real-time application routes1.  
  * og/: Dynamic OpenGraph visual card generator route7.  
* src/: Primary application source directory2.  
  * src/components/ui/: Primitive, domain-agnostic UI elements (e.g., buttons, inputs, dialog overlays, tooltips)3.  
  * src/features/: Feature modules encapsulating cohesive domain entities2.  
    * src/features/auth/: Components, stores, services, and types for user registration and session management1.  
    * src/features/chat/: Real-time streaming interface, message history list, contact search, group setup, and auto-scroll hooks1.  
    * src/features/landing/: High-converting feature showcase, animated product teasers, and real-time simulator widgets1.  
  * src/lib/: Application-wide singleton utilities, API client instances, HTTP interceptors, and cache key definitions2.  
  * src/hooks/: Reusable custom hooks (e.g., viewport measurement, scroll locking, network monitoring)2.  
  * src/types/: Global TypeScript domain interface specifications2.  
* public/: Static assets including vector icons, brand assets, and manifest files2.

### **Architectural Module Boundaries and Import Rules**

Module dependencies strictly follow a unidirectional hierarchy5. Features inside src/features/ remain decoupled; one feature module cannot directly import internal implementations from a parallel feature module3. Cross-feature communication is facilitated through shared global stores or top-level page orchestration3.  
Each feature exports its public interface through an index.ts barrier file, preventing external modules from reaching into private feature internals5. Furthermore, App Router route handler files in app/ are restricted to serving as lightweight composition roots, delegating all domain logic execution, form validations, and state updates to feature modules3.

## **API Architecture, Resilient Data Transport, and Real-Time Synchronization**

### **Standalone API Documentation Protocol**

Before writing interface code, comprehensive, standalone API documentation must be established1. Because third-party hosted mock endpoints on platforms like Render frequently undergo cold starts or experience intermittent downtime8, the engineering process maintains two documentation formats:

> 1. **OpenAPI 3.1 Specification (/docs/openapi.yaml)**: A machine-readable REST and WebSocket definition detailing schemas, payload shapes, authentication headers, error responses, and parameters1.  
> 2. **Interactive Developer Reference (/docs/API\_DOCUMENTATION.md)**: A human-readable architectural specification covering token management, payload validation rules, socket event specs, and error handling mechanisms1.

| Endpoint Route | HTTP Method | Request Payload Contract | Response Model | Description & Resiliency Specification |
| :---- | :---- | :---- | :---- | :---- |
| /api/v1/auth/login | POST | { phone: string, name: string } | { user: User, token: string } | Authenticates existing accounts or auto-registers new phone entries without a separate signup flow1. Validates inputs against E.164 phone formats1. |
| /api/v1/users/search | GET | Query ?q=string | { users: User\[\] } | Queries contact directories by name or telephone digits1. Handles debounced client inputs and empty state responses gracefully1. |
| /api/v1/conversations | POST | { type: 'direct' | 'group', participants: string\[\], name?: string } | { conversation: Conversation } | Instantiates direct 1-on-1 chats or multi-participant group threads1. Returns pre-existing direct chat entities if previously established1. |
| /api/v1/conversations/:id/messages | GET | Query ?cursor=string\&limit=number | { messages: Message\[\], nextCursor: string } | Fetches historical message lists via cursor-based pagination1. Re-orders arrays chronologically for client rendering1. |
| /api/v1/conversations/:id/messages | POST | { content: string, clientTempId: string } | { message: Message } | Transmits text content1. Rejects empty or whitespace-only messages; returns full timestamped objects1. |

### **Resilient Data Handling and Cold-Start Mitigation**

To insulate the client application from backend cold starts, network latency, or service interruptions on public API infrastructure1:

* **Adaptive HTTP Interceptor**: Integrates an Axios/Fetch proxy wrapper configured with automated exponential backoff retries (up to 3 attempts with dynamic jitter) specifically targeting HTTP 502, 503, and 504 gateway failures1.  
* **In-Memory Offline Engine**: If backend endpoints fail to respond within a 5-second timeout, the application layer seamlessly transitions to an internal Mock Service Worker (MSW) database, displaying a non-intrusive status toast while keeping the user interface usable1.  
* **Response Normalization Layer**: Incoming payload objects pass through parsing schemas prior to state store insertion, harmonizing timestamp formatting, null properties, and collection wrappers1.

### **Real-Time Synchronization Architecture**

Real-time message transport uses a dynamic fallback strategy to ensure operational resilience across network conditions1. The primary connection attempts to establish a bidirectional WebSocket channel for sub-50ms message delivery1. If corporate proxy configurations or network environments block persistent WebSockets, the data engine automatically degrades to Server-Sent Events (SSE) or a dynamic 3-second adaptive auto-polling loop1.

\+-----------------------------------------------------------------------------------+  
|                        Real-Time Data Transport Layer                             |  
|                                                                                   |  
|  \+---------------------------+       (Fail)       \+----------------------------+  |  
|  |  WebSocket Stream Engine  | \-----------------\> |  Server-Sent Events (SSE)  |  |  
|  |  (Sub-50ms Bidirectional) |                    |  / Dynamic Auto-Polling    |  |  
|  \+---------------------------+                    \+----------------------------+  |  
|                |                                                |                 |  
|                \+-----------------------+------------------------+                 |  
|                                        |                                          |  
|                                        v                                          |  
|                 \+----------------------------------------------+                  |  
|                 | Optimistic Store & Event Reconciliation Loop |                  |  
|                 \+----------------------------------------------+                  |  
\+-----------------------------------------------------------------------------------+

When a user transmits a message, the system instantly appends an optimistic representation into the active Zustand state array1. This optimistic item renders with a pending indicator (status: 'sending') and a local temporary identifier1. Upon server confirmation via socket event or REST response, the temporary item reconciles with the finalized server payload (status: 'sent', permanent ID, server timestamp)1. If network transmission fails, the UI flags the message with an error state and an inline retry action1.

## **Micro-Interactions, State Matrix, and Precision Scroll Locking**

### **Chat Viewport Precision Auto-Scrolling Engine**

A critical challenge in chat interface engineering is managing viewport positioning during live message ingestion1. Forcing the viewport downward whenever a message arrives disrupts the user experience if they have scrolled up to review past message history1. The system resolves this using dynamic viewport calculation metrics10.

                          \+-----------------------------------+  
                          |     Historical Chat Messages      |  
                          |                                   |  
                          |  \[ User Scrolled Up to Read \]     |  
   Viewport Container     \+-----------------------------------+  
\=========================\>|                                   |  \<--- Viewport Top  
                          |   Visible Active Chat Viewport    |  
                          |                                   |  
\=========================\>|                                   |  \<--- Viewport Bottom  
                          \+-----------------------------------+  
                          |  \[ THRESHOLD Detection (80px) \]   |  
                          \+-----------------------------------+  \<--- Total Scroll Height

The auto-scroll system calculates proximity using the equation:  
![][image1]

> 1. **Proximity Tracking**: A custom hook attaches a passive listener to the scrolling message container9. It continuously checks if the user is within a defined bottom threshold distance (e.g., 80 pixels)9.  
> 2. **Conditional Scroll Dispatch**: When a new message enters the state array:  
   * If the viewport position is within the bottom threshold zone (isAtBottom \= true), the system triggers a smooth programmatic scroll to the bottom (scrollTop \= scrollHeight)1.  
   * If the user has scrolled above the threshold zone (isAtBottom \= false), automatic scrolling is suppressed, maintaining the user's current scroll offset1.  
> 3. **Unread Indicator Floating Pill**: When scroll updates are suppressed due to an active user scroll lock, a floating action button renders at the bottom of the chat interface (e.g., "⬇ 3 New Messages")1. Selecting this element clears the lock and smoothly animates the view back to the newest message9.

### **UI State Matrix Specification**

To prevent Cumulative Layout Shifts (CLS) and present clear status feedback, UI views implement standardized visual boundaries across state transitions1.

| Operational State | Visual Presentation & UX Behavior | Edge Case Mitigations |
| :---- | :---- | :---- |
| **Initial Loading** | Animated skeleton pulse blocks matching message bubble dimensions and contact rows1. | Preserves layout dimensions; prevents reflow shift during initial hydration1. |
| **Empty Conversation** | Vector graphic with actionable messaging ("No messages yet. Send a message to start")1. | Center-aligned; disables empty input form submissions1. |
| **Empty Search Result** | Explanatory message ("No contacts matching search query")1. | Debounced input processing prevents rapid flashing during typing1. |
| **Network Interruption** | Persistent warning bar displaying re-connection status1. | Retains local message cache; queues outbound actions in local storage1. |
| **Optimistic Sending** | Slightly transparent message bubble displaying a pending clock icon1. | Clears input field immediately; restores text content if transmission fails1. |

## **Strategic Differentiation and Extra-Credit Innovations**

### **Part 1 Differentiation: Offline Mutation Queue & Client Full-Text Search**

To stand out in candidate evaluations, bonus features must provide genuine operational utility rather than decorative components1.

> 1. **IndexedDB Offline Queue and Sync Engine**: When the browser detects offline status (navigator.onLine \= false), outgoing messages are saved into an IndexedDB store flagged with a pending sync status1. Upon network reconnection, a background sync service processes queued messages sequentially, updating server states without losing user input1.  
> 2. **Client-Side Message Search Engine**: Incorporates an in-memory full-text search index across active conversation history using client-side indexing. Users can filter conversation logs with real-time string highlighting, auto-focusing on matching message nodes upon selection.

### **Part 2 Differentiation: Embedded Architecture & Latency Simulator**

To showcase technical depth on the creative landing page, the showcase incorporates an **Interactive Real-Time Architecture & Network Simulator**1:

\+---------------------------------------------------------------------------------+  
|                   Landing Page Architecture & Network Simulator                 |  
\+---------------------------------------------------------------------------------+  
|                                                                                 |  
|  \[ Network Controls \]                                                           |  
|  Latency Target: \[ 20ms | 300ms | 1500ms \] | Network Mode: \[ Online | Offline \] |  
|  Transport Protocol: \[ WebSocket (Active) | SSE | Auto-Polling \]                |  
|                                                                                 |  
|  \+-----------------------------------+   \+-----------------------------------+  |  
|  | Simulated User A (Sender View)    |   | Simulated User B (Receiver View)  |  |  
|  | \[Type message...\] \[Send Action\]   |   | "Optimistic sync verified\!"       |  |  
|  \+-----------------------------------+   \+-----------------------------------+  |  
|                                                                                 |  
|  \[ Real-Time Network Telemetry \]                                                |  
|  Packet RTT: 28ms | Optimistic Render: 1.1ms | Sync Status: Synchronized         |  
|                                                                                 |  
\+---------------------------------------------------------------------------------+

> 1. **Interactive Dual-Viewport Widget**: Embedded directly on the landing page, allowing evaluators to test real-time chat mechanics through two side-by-side simulated user clients1.  
> 2. **Network Latency & Drop Simulator**: Interactive controls allow evaluators to inject artificial latency (20ms, 300ms, 1500ms) or force offline modes1. This demonstrates optimistic rendering, message queueing, and connection recovery in real time1.  
> 3. **Live Telemetry Metrics**: Displays performance metrics alongside the interactive widget, tracking round-trip time (RTT), optimistic render duration, and packet delivery status.

## **Landing Page Engineering, Responsive Design System, and SEO Optimization**

### **Design System and Visual Architecture**

The creative landing page highlights the chat application through a modern dark-mode visual design1. Built with Tailwind CSS v4, the visual presentation follows specific design principles:

* **Color Palette**: Charcoal slate base surfaces (\#090D16), deep panel containers (\#111827), electric indigo primary accents (\#6366F1), and high-contrast typography (\#F9FAFB).  
* **Glassmorphic Interfaces**: Translucent container cards utilizing backdrop blur overlays (backdrop-blur-md), ambient background gradients, and subtle micro-interactions powered by Framer Motion1.  
* **Fluid Responsive Layout System**: Constructed mobile-first using CSS Grid and Flexbox layouts. Uses container queries (@container) inside chat UI widgets, allowing components to adapt based on parent container dimensions rather than viewport width alone1.

| Viewport Target | Screen Width Range | Responsive Adaptation Strategy |
| :---- | :---- | :---- |
| **Mobile** | \< 640px | Single-column view. Contact lists fold into an off-canvas slide-out menu; active chats and search views toggle dynamically1. |
| **Tablet** | 640px \- 1024px | Dual-column view. Fixed 280px contact sidebar positioned alongside a flexible main chat window1. |
| **Desktop** | \> 1024px | Multi-column view. 320px persistent conversation sidebar, fluid chat viewport, and collapsible contact details panel1. |

### **SEO Engineering and Structured Metadata Architecture**

The application implements Next.js Metadata APIs to optimize search indexing and social sharing displays3:

TypeScript  
// app/layout.tsx \- Metadata System Architecture  
import type { Metadata } from 'next';

export const metadata: Metadata \= {  
  title: {  
    default: 'PulseChat | Real-Time Messaging Architecture',  
    template: '%s | PulseChat',  
  },  
  description: 'Production-ready real-time chat application featuring optimistic updates, scroll locking, and offline synchronization.',  
  keywords: \['Real-Time Chat', 'Next.js 15', 'WebSockets', 'React 19', 'TypeScript', 'Tailwind CSS'\],  
  authors: \[{ name: 'Senior Frontend Engineer Candidate' }\],  
  openGraph: {  
    type: 'website',  
    locale: 'en\_US',  
    url: 'https://pulsechat-demo.vercel.app',  
    title: 'PulseChat | Real-Time Messaging Architecture',  
    description: 'High-performance messaging architecture featuring sub-50ms message latency and resilient offline sync.',  
    siteName: 'PulseChat',  
    images: \[{  
      url: 'https://pulsechat-demo.vercel.app/og/default.png',  
      width: 1200,  
      height: 630,  
      alt: 'PulseChat Application Preview',  
    }\],  
  },  
  twitter: {  
    card: 'summary\_large\_image',  
    title: 'PulseChat Architecture Showcase',  
    description: 'Real-time chat implementation built with Next.js 15 and React 19.',  
    images: \['https://pulsechat-demo.vercel.app/og/default.png'\],  
  },  
  robots: {  
    index: true,  
    follow: true,  
  },  
};

> 1. **JSON-LD Structured Data**: Injects a SoftwareApplication JSON-LD schema into the server-rendered HTML \<head\>, providing search engines with structured application details, software categories, and feature specifications.  
> 2. **Dynamic OpenGraph Generation**: Uses @vercel/og (ImageResponse) inside app/og/route.tsx to programmatically render customized social preview images at build and request time.  
> 3. **Performance Optimization**: Employs next/font for zero-CLS font rendering (Inter/Geist) and next/image for WebP/AVIF image compression, maintaining high Core Web Vitals scores across performance audits.

## **Version Control Hygiene, AI Tooling Framework, and Documentation**

### **Version Control Conventions**

The git commit history adheres to the Conventional Commits standard, providing clear change tracking across feature iterations1.

* feat(auth): add phone validation and user registration flow  
  \[cite: 1\]  
* feat(chat): implement real-time message list with status tracking  
  \[cite: 1\]  
* feat(chat): implement precision scroll lock and unread message indicator  
  \[cite: 1, 10\]  
* fix(api): add exponential backoff retry handling for gateway timeouts  
  \[cite: 1\]  
* docs(api): publish standalone OpenAPI 3.1 specification  
  \[cite: 1\]

### **AI Collaboration Framework (Part 3 Requirements)**

The application development process utilized AI development tooling—specifically **Claude Code** (CLI agent) and **Antigravity / Cursor** (IDE agent)—while applying human engineering oversight to review, refine, or reject generated code outputs1.

| AI Development Tool | Applied Development Domain | Generated AI Output | Engineering Refinement & Rejection Rationale |
| :---- | :---- | :---- | :---- |
| **Claude Code (CLI)** | OpenAPI schema drafting & interface generation1. | Initial Swagger YAML specifications and TypeScript interface definitions1. | **Modified**: Expanded schemas to include offline sync status fields, temporary message IDs, and WebSocket event payload types1. |
| **Antigravity (Cursor)** | UI component layouts & Tailwind styling1. | Base layout components with inline state hooks and generic styles1. | **Rejected**: Replaced a naive useEffect scroll implementation with a custom proximity threshold calculation hook (useChatScroll)1. |
| **Claude Code (CLI)** | Mock data suites & test case generation1. | Standard JSON datasets and base unit test assertions1. | **Modified**: Added test scenarios for API cold starts, dynamic socket drops, and phone number validation edge cases1. |

### **Architectural Trade-offs and API Challenges**

> 1. **State Management Selection**: The system uses TanStack Query for server state management alongside Zustand for client-side UI states2. This separation isolates cached network responses from interaction states (e.g., active input values, scroll proximity), preventing unnecessary network refetches2.  
> 2. **DOM Rendering Strategy**: For message threads under 1,000 items, standard DOM rendering combined with CSS contain: content delivers smooth scrolling animations without the scrollbar jitter associated with virtualized list engines during live streaming updates1.  
> 3. **API Inconsistencies and Mitigations**: Third-party hosted free-tier API endpoints introduced initial gateway latency8. This was mitigated by adding client-side retry handling, fallback response stores, and normalized data mappers to process incoming payload timestamps consistently1.

## **Tactical Execution Plan for the 24-Hour Timeline**

To complete all project deliverables within the 24-hour timeline, development activities are structured across three distinct execution phases1:

| Execution Phase & Hours | Phase Focus | Key Deliverables & Engineering Targets |
| :---- | :---- | :---- |
| **Phase 1: Setup & API Specs** *(Hours 01 – 04\)* | Infrastructure, Documentation & Auth | • Initialize Next.js 15 App Router project with TypeScript and Tailwind CSS v42. • Publish OpenAPI 3.1 YAML and standalone API\_DOCUMENTATION.md specifications1. • Build authentication flow with phone validation and store session persistence1. |
| **Phase 2: Core Engine** *(Hours 05 – 14\)* | Feature Implementation & Scroll Logic | • Build conversation sidebar, contact search, and group setup views1. • Implement message list view with clear visual separation for sender/receiver messages1. • Connect real-time WebSocket messaging layer with optimistic UI rendering1. • Implement useChatScroll hook for threshold auto-scrolling, scroll lock override, and unread notification UI1. |
| **Phase 3: Landing Page & Polish** *(Hours 15 – 24\)* | Showcase Page, Simulator & Submission | • Construct responsive creative landing page using Framer Motion animations1. • Build interactive network latency and transport protocol simulator widget1. • Configure Next.js Metadata API, dynamic OpenGraph route, and JSON-LD structured data3. • Complete Part 3 architectural write-up in project README.md1. • Deploy production builds to Vercel/Netlify and submit repository and live application URLs1. |

This execution framework ensures a complete, production-ready submission that meets all technical criteria, edge case handling requirements, and architectural standards1.

#### **Works cited**

> 1. Senior\_Frontend\_Engineer\_Task\_Instructions.pdf.pdf  
> 2. Best next.js folder structure 2025 | by Albert Barsegyan \- Medium, [https://medium.com/@albert\_barsegyan/best-next-js-folder-structure-2025-da809c0cb68c](https://medium.com/@albert_barsegyan/best-next-js-folder-structure-2025-da809c0cb68c)  
> 3. Next.js Folder Structure: Best Practices for 2026 \- Groovy Web, [https://www.groovyweb.co/blog/nextjs-project-structure-full-stack](https://www.groovyweb.co/blog/nextjs-project-structure-full-stack)  
> 4. Next.js Docs: App Router, [https://nextjs.org/docs/app](https://nextjs.org/docs/app)  
> 5. The Ultimate Next.js App Router Architecture \- Feature-Sliced Design, [https://feature-sliced.design/blog/nextjs-app-router-guide](https://feature-sliced.design/blog/nextjs-app-router-guide)  
> 6. Best Practices for Organizing Your Next.js 15 2025 \- DEV Community, [https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji](https://dev.to/bajrayejoon/best-practices-for-organizing-your-nextjs-15-2025-53ji)  
> 7. Getting Started: Project Structure | Next.js, [https://nextjs.org/docs/app/getting-started/project-structure](https://nextjs.org/docs/app/getting-started/project-structure)  
> 8. [https://frontend-task-chatapp.onrender.com/docs/](https://frontend-task-chatapp.onrender.com/docs/)  
> 9. vytenisu/use-chat-scroll: React hook for chat-like scroll behavior, [https://github.com/vytenisu/use-chat-scroll](https://github.com/vytenisu/use-chat-scroll)  
> 10. useScrollLock | usehooks-ts, [https://usehooks-ts.com/react-hook/use-scroll-lock](https://usehooks-ts.com/react-hook/use-scroll-lock)  
> 11. Create an advanced scroll lock React Hook \- LogRocket Blog, [https://blog.logrocket.com/create-advanced-scroll-lock-react-hook/](https://blog.logrocket.com/create-advanced-scroll-lock-react-hook/)  
> 12. React useScrollLock Hook \- shadcn.io, [https://www.shadcn.io/hooks/use-scroll-lock](https://www.shadcn.io/hooks/use-scroll-lock)

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlIAAABNCAYAAABtwIoUAAARS0lEQVR4Xu2dCcxsSVWADy6JigMuxCVKhmcAgzJuBMgA6sPRKAGBiEMEB6ISohIJQQQdooIGknHDBYRAlAESFEVZgogaYjpIcI0IYdS4xMHoEDQjgShh3O831ceuPl23/+7+t/ee35dU/u66t+pW1Vnq3Krq9yJERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERERErkguTulpU3rFlG5a5n3elL5lSj8+pUcs8+ATp/S5e6RPbcWuSD452tg8Z0rPntInrV8+F7JN31wS8oQHD66RTptvndLPRdOxLyvXZJ6UJ+PW61gdzzm5p+zn5E7+aXK/aG293OXe23rK4jz4hFj5a3z1p61d3Z996rsYm/OEiCx53ZT+dUr/M6X3L/O+dkq3LfO+f5kHD1zmkbj+9933fy/fSc9txa5IPmtKvxet34tYDxr/bUp/N6X7dnlnQbbpv2Ilg3+KJk94UazLCLnzfReYTF4TrdxdyrWjoA35zG8s106Cq2rGFULKk3FbxErH6njmff8QK9lzD7JF9in3tPOUO/m78CPRyiF/9GBXvitWbT0NuZ8Vva2nLM6Du8bKX+OreVk9DvvUx33/Eq3/OU+ISMcXTOkDsWkgL4z1QApn+AOx7kwJGjCuvI9J9rpogdar86YrmIfFZiB1mkFDwiSYAVKFcU+HN3KOh7SPeqiPcvuuNPLm+2ux+zN5672mZm7hj6b0O9FWWPYN8i4H/iPWdWzbeCL7Oblz76jMUSxiuz5tg7bu88xdg7vTZK4N2HrK4jzBXx8iizl2re/zowXrdZ4QkVhNktVACI76QKr/nNweY0eJ0/nNknfWPGBKb6qZJwzPWMT+wcVxuMeUbonNMU8ykFrEuF2HBFLHJdu0yzP/Otq47gtB1JdM6dZoW9NsRV8J8LKyiHVZzo0n+YsYy/3QQOq47PrM1OvzhjEcgU6mLM6T9NdHBT67smt9c/OEiMS8gdRAarRVR5mRo/zSKb2x5J01V2ogdUOMxzy5nAMpgiEmq0MCqeQLp/SGaKui31GuXY78fwmkUq/Pk3uHgdQcc/OEyLnzmVN6xpT+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4XeLtsyPw/5gNKf1tGhK3E+KmR7Qiv0f1MWK1kejleXXOM+OVaC2iPXyfL++5JH6N0reVOr1vnx9C6OtbLPgoGgDzpfP5PXQdoz0R6NtG7w62pkxHMK+QRRQ33ECKWD8cEa3RttyZTIBxh5H0/ed9tax4R7ox4CVDFYd3xbtF4C1DGPAeNf6F9HGFsfK2R3adVusztSN2kRK2dG+eo2UpK7l5Ii+PSnG9ebbKhNKrY+EvhIM0e96bVvf4F3RyjPWTDDnAW357WgrRvxTFYwdY90HwilT2vqH0d70sV+oMiVRRw8T2xNi9U89YJuc60pG4z6SIQFQvS9TrrDU/KwLeh+D7FPu9I9xqOUAuefEWlPKvY5B6nW9P+Wees04/3ls/jtsZwHtZruScUD/6MucHGr/SASp9V76XcEnY7/IHn+QvjD1Dn3o9S6D80Ws1833J5Y8EqR+zvndufrIxy+xwvuf0drBr3pviNU/T5L3iVwS4ExReCJ8DHYO3uS4fkhAAVn+JM6MHAfa0L+Z92QghYFme+vb3D6cRCAFtIe28KZ53PFD1tvGYB+o4zjjM0eO+1G6hnNnNYNx6fnqaG/cON0L5doupD2cxHgfCm24avmXdjAm/apsT9ruoTLN8uc9Me3qY1LuBFK97CmH7A+Ve7KL7p0mOQ6nLY/erySpd7kKtk3v9uFQ/aQMZWlXtuk0fI6InBB9ICWXPikvnGwP32+MzX8P6bT4qWhbv7smOR4pd2Q8kv1ZyV1ERJawzfiIaGdGWO7+4Rj/VxlyacGkydbH82L9LfXF0baJ2JKtE+1pcF1s/pR8Lj12WUYOJ+VOMIXsE3QA2Z+V3EVEZAnLxzfF+qrBU9bukEuZF0T7RSLBE4nv91y7Q65EkDGyTrmjA3wXEREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREREZHLiP8Fi4Zvz3Mkp3MAAAAASUVORK5CYII=>