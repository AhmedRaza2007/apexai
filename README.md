# ApexAI — Enterprise AI Platform & Video Studio

> A modern, ChatGPT-style AI platform featuring multi-model inference (Google Gemini, OpenRouter Free, OpenAI, and ApexAI Native), subscription tiers, custom document Knowledge Studio (RAG), and an AI Video Studio.

---

## 🌟 Key Capabilities & Upgraded Architecture

### 1. Conversational Chat & Intent Detection
- **Intent-Aware Chat**: Simple greetings ("Hi", "Hello") receive warm, natural replies ("Hello! How can I help you today?"). Technical questions ("What is JavaScript?") return clear explanations with code examples. Business requests ("Build a business strategy") produce structured strategic roadmaps.
- **Contextual Memory**: Follow-ups ("tell me more", "can you give an example?") naturally reference previous turns in the conversation.
- **Pro Developer Tooling**: Markdown rendering with syntax highlighting, fenced code blocks, table rendering, prompt editing, response regeneration, copy-to-clipboard, and live **Stop Generation** via `AbortController`.
- **Zero Thread-Lockup**: Throttled stream rendering (40ms buffer) and layout-safe instant scrolling prevent Chrome compositor freezing.

### 2. Provider-Based Multi-Model Architecture
Select from actual frontier and open-source models with transparent provider badges:
- **Google Gemini**: Gemini 1.5 Flash (1M context), Gemini 1.5 Pro (2M context), and Gemini 2.0 Flash (`GEMINI_API_KEY`).
- **OpenRouter Free Models**: Meta Llama 3.3 70B, Gemini 2.0 Flash Exp, Mistral 7B Instruct, and Qwen 2.5 Coder 32B (`OPENROUTER_API_KEY`).
- **OpenAI**: GPT-4o Mini and GPT-4o Omni (`OPENAI_API_KEY`).
- **ApexAI Native Engine**: 100% offline, zero-cost fallback with zero external dependencies.

### 3. Subscription & Payment System
Three structured tiers designed for sustainable monetization:
- **FREE**: 15 daily AI messages, free models (Gemini Flash, OpenRouter Free, Native), standard business tools.
- **PRO ($19/mo or $190/yr)**: 250 daily AI messages, flagship models (GPT-4o, Gemini 1.5 Pro), 50 Video Generation Credits/mo, AI Video Studio, Custom Knowledge RAG.
- **BUSINESS ($49/mo or $490/yr)**: Unlimited AI messages, team workspace, 200 Video Generation Credits/mo, 1080p video rendering, unlimited document RAG, priority routing.
- **Global Merchant Compliance**: Built with a multi-gateway abstraction:
  - **Lemon Squeezy** (Merchant of Record supporting Pakistan, UAE, US, UK, EU, and 135+ countries).
  - **Stripe** (For businesses with registered international entities).
  - **Sandbox Developer Gateway** for instant, safe testing of plan upgrades, invoice generation, and credit assignment without payment fraud.

### 4. AI Video Studio (`/video`)
- **Text-to-Video & Image-to-Video**: Generate dynamic video clips from natural text prompts or reference image URLs.
- **AI Prompt Enhancer**: Click "✨ Enhance with AI" to automatically append cinematographic camera directions, lighting details, and lens specifications.
- **Visual Styles**: Cinematic Movie, Hyper-Realistic, 3D Octane/Pixar, Cyberpunk Neon, Studio Anime, and Corporate Minimal.
- **Formats**: 16:9 Landscape, 9:16 Vertical (Reels/TikTok), 1:1 Square. Durations: 3s, 5s, 10s. Resolutions: 720p HD and 1080p Full HD.
- **Credit Metering**: Transparent credit costs (3-12 credits) displayed before submission.
- **Video Preview Player**: Embedded HTML5 player with play/pause, loop, fullscreen, and direct MP4 download.
- **Generation History**: Revisit and replay previously rendered video projects.

### 5. Custom AI Knowledge Studio & RAG (`/knowledge`)
- **Document Ingestion**: Upload Markdown, TXT, CSV, DOCX, or paste guidelines directly.
- **Intelligent Chunking & Semantic RAG**: Splits documents into passages and scores relevance using term-frequency semantic retrieval.
- **Chat Grounding**: Enable the "Attach Knowledge Base" toggle in Chat to ground responses in uploaded company guidelines with source citations.
- **Honest Educational Disclosure**: The studio clearly informs users that document uploading injects retrieval context at inference time (RAG) and does not modify the weights of foundation models. (For heuristic parameter tuning, use the Model Training Studio at `/train`).

### 6. Dynamic AI Business Tools
- **Email Drafter**: Tailors subject line options and email copy using exact recipient, tone, and key points.
- **Social Captions**: Produces platform-optimized posts with hooks, whitespace formatting, CTAs, and hashtags.
- **Product Copy**: Transforms specifications into customer benefits, taglines, and conversion CTAs.
- **Document Summarizer**: Generates 1-sentence executive summaries, key takeaways, and ownership matrices.
- **Strategy Brainstorming**: Provides structured blueprints with implementation timelines and ROI horizon tables.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router with Webpack)
- **Language**: TypeScript (Strict type checking, zero emit errors)
- **Styling**: Tailwind CSS v4 (Dark Navy `#0B0F19`, Slate `#111827`, Electric Blue `#2563EB`)
- **Icons**: Lucide React
- **AI Providers**: Google Gemini REST API, OpenRouter, OpenAI Node SDK, ApexAI Native Engine
- **Database & Auth**: Autonomous local account engine + Supabase SSR PostgreSQL adapter

---

## 🚀 Getting Started

### 1. Installation

```bash
pnpm install
```

### 2. Development Server

```bash
pnpm dev
```
Open [http://localhost:3000](http://localhost:3000) to access the platform.

### 3. Environment Variables (Optional)

ApexAI operates immediately with zero API keys using its internal Native Engine and Sandbox Gateway. To connect external providers, copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Key environment variables:
- `GEMINI_API_KEY`: Google Gemini API key
- `OPENROUTER_API_KEY`: OpenRouter API key (for free Llama 3.3 70B, Mistral, Qwen)
- `OPENAI_API_KEY`: OpenAI API key
- `FAL_KEY`: fal.ai key for video generation
- `LEMON_SQUEEZY_API_KEY` & `LEMON_SQUEEZY_STORE_ID`: Lemon Squeezy merchant gateway
- `STRIPE_SECRET_KEY`: Stripe API key

### 4. Production Build

```bash
pnpm exec tsc --noEmit
pnpm build
```

All 22 routes compile statically and dynamically with zero TypeScript warnings or webpack errors.
