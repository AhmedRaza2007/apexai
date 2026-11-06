export const SYSTEM_PROMPTS = {
  chat: `You are an elite, highly professional AI Business Assistant for modern enterprises, founders, and professionals.
Your objectives:
- Deliver concise, actionable, and executive-ready advice.
- Assist with market strategy, operations, finance concepts, marketing, communications, and workflows.
- Format responses cleanly with markdown: use headings (##, ###), bold key takeaways, bullet points for lists, and concise tables when comparing options.
- When generating code, configuration, or technical commands, use fenced code blocks with language identifiers (e.g. \`\`\`sql, \`\`\`json, \`\`\`typescript).
- Maintain a proactive, strategic, polite, and authoritative business tone.`,

  email: `You are an expert executive business communications strategist.
Your task is to write polished, effective professional emails tailored to the specified objective, audience, and tone.
Structure your output into clearly delineated markdown sections:
### Subject Line Options
Provide 1 primary subject line and 2 alternatives (e.g. curiosity-based, direct).
### Email Body
Include professional salutation, hook, core value/request, and professional sign-off.
### Strategic Delivery Notes
Provide concise advice on why this phrasing was chosen, best sending day/time, and recommended follow-up cadence.`,

  social: `You are a high-performing digital marketing director and copywriter.
Generate high-converting, platform-optimized social media posts.
Structure your response cleanly:
### Hook Options
Provide 2 captivating opening hooks.
### Primary Post
Deliver the complete formatted post with whitespace spacing, bullet highlights, and engaging voice.
### Call to Action (CTA)
Clear, conversion-oriented CTA.
### Recommended Hashtags
Tailored, relevant hashtags suited to the platform algorithm.`,

  product: `You are a senior e-commerce copywriter and product marketing manager.
Craft compelling product descriptions that transform features into vivid customer benefits and drive conversions.
Structure the output with:
### Catchy Tagline & Headline
### Narrative Product Overview
Engaging story hook connecting customer pain point to the solution.
### Core Value Pillars & Key Benefits (Bullet Points)
Feature-to-benefit breakdowns.
### Target Customer Persona
Who this is explicitly built for.
### Conversion Call-To-Action (CTA)`,

  summarize: `You are an executive chief of staff specializing in information synthesis.
Analyze the provided document or text and deliver an executive-level briefing containing:
### 1-Sentence Executive Summary
### Key Takeaways & Strategic Findings (3 to 5 Bullets)
### Action Items & Ownership Matrix (Table with Item, Priority, Recommended Owner)
### Potential Risks or Watch-outs`,

  brainstorm: `You are a McKinsey-grade business strategist and venture consultant.
Brainstorm high-impact, innovative business ideas, marketing campaigns, or strategic initiatives for the provided topic.
Structure the output with:
### Executive Concept Summary
### 3 to 5 Distinct Strategic Initiatives
For each concept, detail:
- Value Proposition & Differentiation
- Target Segment / Buyer Persona
- Step-by-Step Execution Roadmap
- Estimated Resource Investment & ROI Horizon
> **Disclaimer**: *These strategic ideas are AI-generated frameworks intended for brainstorming. Prior to capital deployment, validate with primary customer interviews, regulatory compliance checks, and formal financial modeling.*`,
};

export type ToolType = 'email' | 'social' | 'product' | 'summarize' | 'brainstorm';

export interface EmailToolInput {
  recipient: string;
  purpose: string;
  tone: 'professional' | 'persuasive' | 'friendly' | 'urgent' | 'apologetic';
  length?: 'concise' | 'standard' | 'detailed';
  keyPoints: string;
  senderName?: string;
  subjectContext?: string;
}

export interface SocialToolInput {
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  topic: string;
  tone: 'thought_leadership' | 'engaging' | 'promotional' | 'storytelling';
  audience: string;
  language?: string;
  hashtagStyle?: 'trending' | 'minimal' | 'none';
  callToAction?: string;
}

export interface ProductToolInput {
  productName: string;
  targetAudience: string;
  features: string;
  tone: 'premium' | 'innovative' | 'approachable' | 'bold';
  format: 'ecommerce' | 'saas_landing' | 'kickstarter' | 'amazon_listing';
  category?: string;
}

export interface SummarizeToolInput {
  textToSummarize: string;
  length: 'concise' | 'detailed' | 'bullet_points_only';
  focusArea?: string;
}

export interface BrainstormToolInput {
  challenge: string;
  industry: string;
  budgetOrScale: 'low_budget_startup' | 'growth_scaleup' | 'enterprise';
  primaryGoal: string;
  dimension?: 'revenue_models' | 'gtm_channels' | 'product_differentiation' | 'cost_optimization';
}

export function buildToolPrompt(toolType: ToolType, input: Record<string, unknown>): string {
  switch (toolType) {
    case 'email': {
      const data = input as unknown as EmailToolInput;
      return `Please draft a professional business email with the following specifications:
- Recipient: ${data.recipient || 'Business Partner / Enterprise Client'}
- Core Objective: ${data.purpose || 'General Business Inquiry'}
- Desired Tone: ${data.tone || 'professional'}
- Desired Length: ${data.length || 'standard'}
- Sender Identity: ${data.senderName || '[Your Name & Title]'}
${data.subjectContext ? `- Subject Line Preference / Context: ${data.subjectContext}` : ''}
- Key Points & Specific Context:
${data.keyPoints || 'Discuss recent business updates and coordinate upcoming milestone next steps.'}

Deliver multiple subject line options, the full email draft, and follow-up guidance.`;
    }

    case 'social': {
      const data = input as unknown as SocialToolInput;
      return `Generate a high-impact social media post with the following details:
- Target Platform: ${data.platform || 'linkedin'}
- Core Topic / Lesson: ${data.topic || 'Industry insights and leadership'}
- Tone: ${data.tone || 'thought_leadership'}
- Target Audience: ${data.audience || 'B2B Founders and business leaders'}
- Desired Language: ${data.language || 'English'}
- Hashtag Strategy: ${data.hashtagStyle || 'trending'}
- Call-to-Action: ${data.callToAction || 'Share your insights in the comments'}

Provide hook options, the formatted body copy with algorithm-friendly spacing, CTA, and hashtags.`;
    }

    case 'product': {
      const data = input as unknown as ProductToolInput;
      return `Write compelling product sales copy with the following requirements:
- Product Name: ${data.productName || 'Enterprise Product'}
${data.category ? `- Category: ${data.category}` : ''}
- Target Audience: ${data.targetAudience || 'Modern professionals and businesses'}
- Brand Voice / Tone: ${data.tone || 'premium'}
- Format: ${data.format || 'saas_landing'}
- Technical Specifications / Key Features:
${data.features || 'High speed, automated workflows, bank-grade encryption, time savings.'}

Translate technical features into emotional and operational benefits. Provide tagline, story, feature bullets, and conversion CTA.`;
    }

    case 'summarize': {
      const data = input as unknown as SummarizeToolInput;
      return `Summarize the following document content:
- Summary Format & Depth: ${data.length || 'concise'}
${data.focusArea ? `- Specific Focus Lens: ${data.focusArea}` : ''}

=== SOURCE CONTENT START ===
${data.textToSummarize || 'No content provided.'}
=== SOURCE CONTENT END ===

Extract the 1-sentence executive summary, key takeaways, and an actionable ownership table.`;
    }

    case 'brainstorm': {
      const data = input as unknown as BrainstormToolInput;
      return `Brainstorm strategic growth and business innovation initiatives:
- Strategic Challenge: ${data.challenge || 'Accelerate business expansion'}
- Industry / Market Niche: ${data.industry || 'Technology & Professional Services'}
- Enterprise Scale: ${data.budgetOrScale || 'growth_scaleup'}
- Primary Success KPI: ${data.primaryGoal || 'Acquire 50 qualified enterprise accounts'}
${data.dimension ? `- Focus Dimension: ${data.dimension}` : ''}

Deliver 3 to 5 structured, realistic concepts with execution roadmaps and the standard analytical disclaimer.`;
    }

    default:
      return 'Please analyze the business request and provide executive guidance.';
  }
}
