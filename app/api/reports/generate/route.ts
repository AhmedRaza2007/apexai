import { NextRequest, NextResponse } from 'next/server';
import { ReportParameters, ExecutiveReport } from '@/lib/ai/reports';
import { checkRateLimit, sanitizeText } from '@/lib/security';
import { dispatchStreamInference, getModelDescriptor } from '@/lib/ai/providers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'anonymous';
    const rateLimit = checkRateLimit(`report-${ip}`, 10, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Report generation limit reached. Please wait ${rateLimit.resetInSec}s.` },
        { status: 429 }
      );
    }

    const body = (await req.json().catch(() => null)) as ReportParameters | null;
    if (!body || !body.topic?.trim()) {
      return NextResponse.json({ error: 'Report topic or business thesis is required.' }, { status: 400 });
    }

    const {
      topic,
      industry = 'Technology & B2B SaaS',
      targetAudience = 'Board of Directors & Executive Leadership',
      format = 'strategic_playbook',
      depth = 'comprehensive',
      model = 'apexai-native-v2',
    } = body;

    const cleanTopic = sanitizeText(topic, 500);

    const reportPrompt = `You are a Principal Partner at McKinsey / Bain and an elite Chief Strategy Officer.
Synthesize an exhaustive, authoritative **Executive Business Report** on the following topic:

- **Core Strategic Topic / Objective**: ${cleanTopic}
- **Industry Sector**: ${industry}
- **Target Readership**: ${targetAudience}
- **Document Format**: ${format.replace(/_/g, ' ').toUpperCase()}
- **Depth**: ${depth.toUpperCase()}

Structure the report into the following exact Markdown sections:

# ${cleanTopic}
## Executive Deliverable & Strategic Briefing

### 1. Executive Summary & Core Thesis
Provide a 2-paragraph high-stakes executive summary articulating the strategic window of opportunity, core catalysts, and recommended capital allocation.

### 2. Market Landscape & Competitive Moats
Analyze market dynamics, buyer pain points, key competitor vulnerabilities, and structural moats (data network effects, switching costs, distribution advantages).

### 3. Financial Projections & Unit Economics Matrix
Include an actionable Markdown table with:
| Metric / Financial KPI | Current Baseline | 12-Month Target | Strategic Lever / Driver | Expected Impact |
| :--- | :--- | :--- | :--- | :--- |
(Fill with 4 to 6 detailed rows relevant to ${cleanTopic})

### 4. Phased Strategic Execution Roadmap
Break down execution into 3 clear operational phases:
- **Phase 1: Foundation & Alpha Validation (Months 1–3)**: Core milestones and gating metrics.
- **Phase 2: Scale & GTM Expansion (Months 4–8)**: Revenue levers and organizational staffing.
- **Phase 3: Category Dominance & Optimization (Months 9–12)**: Long-term operational efficiency and defensive moats.

### 5. Risk Governance & Mitigation Safeguards
Include an actionable Markdown table with:
| Identified Risk Domain | Severity / Probability | Recommended Enterprise Guardrail | Primary Executive Owner |
| :--- | :--- | :--- | :--- |
(Fill with 4 realistic operational, financial, and regulatory risks)

### 6. Concluding Recommendation & Next 30-Day Decisions
Provide 3 immediate binary decisions the executive team must sign off on to unblock execution.

Format with clean Markdown headings, bold key metrics, and professional tables.`;

    // Dispatch inference using the requested model (Claude 3.5 Sonnet, GPT-4o, Gemini 1.5 Pro, or Native Engine)
    const { readable, modelUsed } = await dispatchStreamInference(
      [{ role: 'user', content: reportPrompt }],
      model,
      req.signal,
      'You are a tier-1 executive management consultant and software architect. Synthesize complete, authoritative reports without filler.'
    );

    // Read full output text from stream
    const streamReader = readable.getReader();
    const decoder = new TextDecoder();
    let completeMarkdown = '';

    while (true) {
      const { done, value } = await streamReader.read();
      if (done) break;
      completeMarkdown += decoder.decode(value, { stream: true });
    }

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const descriptor = getModelDescriptor(modelUsed);

    const report: ExecutiveReport = {
      id: reportId,
      title: cleanTopic,
      topic: cleanTopic,
      industry,
      targetAudience,
      format,
      markdownContent: completeMarkdown,
      sections: [
        { id: 'summary', title: 'Executive Summary & Thesis', content: '' },
        { id: 'market', title: 'Market Landscape & Moats', content: '' },
        { id: 'financials', title: 'Financial Matrix & Unit Economics', content: '' },
        { id: 'roadmap', title: 'Phased Execution Roadmap', content: '' },
        { id: 'risks', title: 'Risk Governance & Safeguards', content: '' },
      ],
      modelUsed: descriptor.name,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Failed to generate executive report.' }, { status: 500 });
  }
}
