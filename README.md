# 📦 OmniSupport AI

> Autonomous E-Commerce & Logistics Support Agent with Deterministic Tool Calling

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-3.6%20Flash-4285F4?style=flat-square&logo=google)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

OmniSupport AI is a production-grade autonomous customer support platform engineered for e-commerce and logistics workflows. Rather than functioning as a standard conversational wrapper, it uses **Google Gemini Flash Tool Calling (Function Calling)** to execute deterministic, schema-enforced transactions against a PostgreSQL database.

---

## ⚡ Key Highlights & Architecture

* **Deterministic Tool Calling Engine:** Structured function declarations (`getOrderDetails`, `getCourierStatus`, `updateDeliveryAddress`, `cancelOrder`) running multi-turn server execution loops without conversational hallucination.
* **Business Rule & Guardrail Layer:** Strict domain validations enforcing real-world constraints (e.g., rejecting destination address updates or cancellations on orders that have already reached `SHIPPED` or `DELIVERED` status).
* **Live Database Sandbox (Split-Screen UI):** Interactive customer concierge running alongside a real-time reactive PostgreSQL inspector that mirrors database mutations instantly.
* **Comprehensive Audit Trail:** All tool calls, runtime parameters, and model responses are logged for compliance and observability.
* **Resilient Architecture:** High-throughput performance powered by Next.js 16 App Router, Turbopack, and Prisma ORM backed by Supabase PostgreSQL.

---

## 🛠 Tech Stack

* **Framework:** Next.js 16 (App Router)
* **Language:** TypeScript
* **AI Orchestration:** Google Gemini Flash API (`@google/genai` Tool / Function Calling)
* **Database & ORM:** Supabase (PostgreSQL), Prisma ORM
* **State Management & Data Fetching:** Zustand, TanStack Query
* **Styling & UI:** Tailwind CSS, Lucide Icons, clsx, tailwind-merge
* **Validation:** Zod

---

## 📂 Project Structure

```bash
├── app/
│   ├── api/
│   │   ├── chat/              # Multi-turn chat & tool calling loop
│   │   └── orders/            # Real-time order synchronization & reset sandbox
│   ├── layout.tsx
│   └── page.tsx               # Dual-pane split-screen interface
├── components/
│   ├── ChatInterface.tsx      # Concierge chat with markdown & action chips
│   ├── OrderCard.tsx          # Order details with status badges
│   ├── OrdersSandboxPanel.tsx # Live PostgreSQL database observer
│   ├── ToolActivityBadge.tsx  # Expandable tool execution inspector
│   └── TrackingTimeline.tsx   # Courier progress tracker
├── lib/
│   ├── agent/
│   │   ├── executor.ts        # Gemini tool calling executor & business rules
│   │   └── tools.ts           # Tool schemas & parameter definitions
│   └── prisma.ts              # Prisma client singleton
└── prisma/
    ├── schema.prisma          # Database schema (Customer, Order, Courier, Audit)
    └── seed.ts                # Realistic demo order state generator
```

---

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone [https://github.com/Temurprogram77/OmniSupport-AI.git](https://github.com/Temurprogram77/OmniSupport-AI.git)
cd OmniSupport-AI
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="your-supabase-pooled-connection-string"
DIRECT_URL="your-supabase-direct-connection-string"
GEMINI_API_KEY="your-google-gemini-api-key"
```

### 4. Setup the Database
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run automated tool calling verification tests:
```bash
npm run test:tools
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.