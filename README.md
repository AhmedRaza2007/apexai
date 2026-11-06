# ApexAI — Production AI Business Suite & Model Training Engine

> An enterprise AI web application designed to help businesses, founders, and operators streamline communications, generate high-converting marketing collateral, synthesize briefings, execute safeguarded automations, and **fine-tune their own custom AI model** with zero mandatory third-party API dependencies.

---

## 🌟 Key Capabilities & Upgrades

### 1. Autonomous Native Model & Free AI Inference Engine
- **Zero Third-Party Dependency**: Comes with a built-in **Native ApexAI Enterprise Model** pre-trained on executive business heuristics, strategic frameworks, and marketing copywriting formulas (AIDA, PAS).
- **100% Free & Always Online**: Works immediately out of the box with zero API keys required, zero billing, and sub-second token streaming.
- **Multi-Provider Fallback**: Automatically connects to OpenAI or compatible providers if an `OPENAI_API_KEY` is supplied, and falls back to your internal native engine without breaking the application.

### 2. Custom Model Training Studio & Fine-Tuning API (`/train`)
- **Interactive Training Studio**: Navigate to **Model Training Studio** from the sidebar to fine-tune your model on custom company guidelines, product specs, and preferred voice.
- **Training API Endpoint (`/api/ai/train`)**:
  - `GET /api/ai/train`: Fetch current model version, alignment scores, active heuristic rules, and training dataset.
  - `POST /api/ai/train`: Inject new training pairs or behavioral rules directly into the model's retrieval and synthesis weights.
  - `DELETE /api/ai/train`: Prune obsolete training examples.
- **Live Model Playground**: Test queries against your fine-tuned model directly inside the studio.

### 3. Frictionless Autonomous Account Creation
- **Instant Signup**: Enter any email and password on the **Create Account** tab. Accounts are registered immediately, encrypted into local storage/session cookies, and users are logged into their personalized workspace.
- **Dual Auth Engine**: Works autonomously out-of-the-box in local mode, and automatically upgrades to Supabase Auth & PostgreSQL Row Level Security (RLS) whenever database keys are provided.

### 4. AI Business Tools Suite
- **Executive Email Drafter**: High-stakes proposals, follow-ups, and negotiation drafts with tone and length adjustment.
- **Social Media Captions**: Thought leadership and promotional posts with viral hooks and hashtags for LinkedIn, Twitter/X, and Instagram.
- **Product Description Copywriter**: Benefit-driven copy for E-commerce & SaaS.
- **Executive Document & Text Summarizer**: Extracts 1-sentence summaries, key takeaways, and action item ownership matrices.
- **Strategic Brainstorming & Growth Engine**: Structured matrices for market expansion and GTM campaigns.

### 5. Content Library & Management
- One-click **"Save to Library"** from any business tool.
- Supports search, tool filtering, `.txt` file export, modal viewing, and deletion.
- Operates seamlessly across local client storage and Supabase PostgreSQL.

### 6. Safeguarded Automations
- Modular workflow queue for scheduled business tasks (weekly digests, content queues).
- **Human-in-the-Loop Confirmation**: Consequential actions require explicit human review prior to execution.
- External dispatches (e.g. SMTP email delivery) are honestly designated with an `Integration Pending` state.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Server Components & Route Handlers)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict mode, zero compilation warnings)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (Dark Navy `#0B0F19`, Slate `#111827`, Electric Blue `#2563EB`)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Native AI Engine**: Self-contained executive synthesis & fine-tuning engine (`lib/ai/native-engine.ts`)
- **External AI Integration**: [OpenAI Node SDK](https://github.com/openai/openai-node) (optional; supports OpenAI, Groq, OpenRouter, and Ollama)
- **Database & Auth**: Autonomous local account engine + [Supabase](https://supabase.com/) SSR adapter
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+ (Node v24 recommended)
- `pnpm` (or `npm`)

---

### Step 1: Install Dependencies

```bash
pnpm install
# or: npm install
```

---

### Step 2: Run Locally (Zero Setup Required)

You do **not** need to configure external API keys or cloud databases to use ApexAI. The native trained model and autonomous user registry work immediately:

```bash
pnpm dev
# or: npm run dev
```

1. Open [http://localhost:3000](http://localhost:3000) in your browser.
2. Click **Create Account** to register your email and password.
3. Access the **AI Chat Assistant**, **Business Tools**, **Saved Library**, and **Model Training Studio**!

---

### Step 3: (Optional) Connect OpenAI or Supabase

To optionally connect an external OpenAI API key or Supabase PostgreSQL database, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your optional credentials:

```env
# Optional: External AI Provider (OpenAI, Groq, or compatible)
OPENAI_API_KEY=sk-proj-your-actual-key-here
OPENAI_MODEL=gpt-4o-mini

# Optional: Supabase PostgreSQL Database (Project Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 📦 Production Build & Type Checking

To verify the production build locally:

```bash
pnpm exec tsc --noEmit
pnpm build
```

---

## 🚢 Deploying to Vercel

1. Push your repository to GitHub or GitLab.
2. In the [Vercel Dashboard](https://vercel.com/), click **Add New Project** and select this repository.
3. Framework Preset: **Next.js**.
4. Build Command: `pnpm build` (configured as `next build --webpack`).
5. (Optional) Set `OPENAI_API_KEY` and `NEXT_PUBLIC_SUPABASE_URL` under Environment Variables if you want third-party synchronization.
6. Click **Deploy**. The app will deploy with 100% functionality even with zero environment variables provided!
