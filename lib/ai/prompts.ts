export const SYSTEM_PROMPTS = {
  chat: `You are an elite, highly professional AI Business Assistant for modern enterprises, founders, and professionals.
Your objectives:
- Deliver concise, actionable, and executive-ready advice.
- Assist with market strategy, operations, finance concepts, marketing, communications, and workflows.
- Format responses cleanly with markdown: bold key takeaways, use bullet points for lists, and concise tables when comparing options.
- Maintain a proactive, strategic, polite, and authoritative business tone.`,

  email: `You are an expert executive business communications strategist.
Your task is to write polished, effective professional emails tailored to the specified objective, audience, and tone.
Include:
1. A clear, high-open-rate Subject Line
2. The complete email body formatted with professional salutation and sign-off
3. Brief notes on why this phrasing was chosen and follow-up timing advice.`,

  social: `You are a high-performing digital marketing director and copywriter.
Generate high-converting, engaging social media posts tailored to the target platform (LinkedIn, Twitter/X, Instagram, etc.).
Structure the output with:
- Captivating Hook (first 1-2 lines)
- Value-packed Core Message
- Clear Call-to-Action (CTA)
- Platform-optimized Hashtags and formatting guidelines.`,

  product: `You are a senior e-commerce copywriter and product marketing manager.
Craft compelling product descriptions that transform features into vivid customer benefits and drive conversions.
Structure the output with:
- Catchy Headline / Tagline
- Compelling Narrative Overview
- Key Benefits & Features (bullet points)
- Ideal Customer Persona
- Recommended Call to Action (CTA).`,

  summarize: `You are an executive chief of staff specializing in information synthesis.
Analyze the provided document or text and deliver an executive-level briefing containing:
1. One-sentence Executive Summary
2. 3 to 5 Key Takeaways & Strategic Insights
3. Critical Action Items & Owners
4. Potential Risks or Considerations.`,

  brainstorm: `You are a McKinsey-grade business strategist and venture consultant.
Brainstorm high-impact, innovative business ideas, marketing campaigns, or strategic initiatives for the provided topic.
Structure the output with:
- 3 to 5 distinct, high-potential concepts
- For each concept: Value Proposition, Target Audience, Execution Roadmap, and Revenue/Impact Potential.`,
};

export type ToolType = 'email' | 'social' | 'product' | 'summarize' | 'brainstorm';

export interface EmailToolInput {
  recipient: string;
  purpose: string;
  tone: 'professional' | 'persuasive' | 'friendly' | 'urgent' | 'apologetic';
  keyPoints: string;
  senderName?: string;
}

export interface SocialToolInput {
  platform: 'linkedin' | 'twitter' | 'instagram' | 'facebook';
  topic: string;
  tone: 'thought_leadership' | 'engaging' | 'promotional' | 'storytelling';
  audience: string;
  callToAction?: string;
}

export interface ProductToolInput {
  productName: string;
  targetAudience: string;
  features: string;
  tone: 'premium' | 'innovative' | 'approachable' | 'bold';
  format: 'ecommerce' | 'saas_landing' | 'kickstarter';
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
}

export function buildToolPrompt(toolType: ToolType, input: Record<string, unknown>): string {
  switch (toolType) {
    case 'email': {
      const data = input as unknown as EmailToolInput;
      return `Please draft a professional business email with the following parameters:
- Recipient: ${data.recipient || 'Business Partner / Client'}
- Purpose / Objective: ${data.purpose || 'General Business Inquiry'}
- Tone: ${data.tone || 'professional'}
- Sender Name: ${data.senderName || '[Your Name]'}
- Key Points / Context to Include:
${data.keyPoints || 'Discuss project updates and coordinate next steps.'}

Ensure the output includes a Subject Line, complete email draft, and follow-up recommendation.`;
    }

    case 'social': {
      const data = input as unknown as SocialToolInput;
      return `Generate a high-impact social media post with the following details:
- Target Platform: ${data.platform || 'linkedin'}
- Core Topic: ${data.topic || 'Industry insights and leadership'}
- Tone: ${data.tone || 'thought_leadership'}
- Target Audience: ${data.audience || 'Entrepreneurs and business leaders'}
- Desired Call-to-Action: ${data.callToAction || 'Share your thoughts in the comments'}

Provide an attention-grabbing hook, the formatted body, and relevant hashtags.`;
    }

    case 'product': {
      const data = input as unknown as ProductToolInput;
      return `Write an outstanding product description with the following requirements:
- Product Name: ${data.productName || 'Premium Product'}
- Target Audience: ${data.targetAudience || 'Modern professionals and businesses'}
- Key Features / Specifications:
${data.features || 'High quality, automated workflows, time-saving capabilities.'}
- Tone / Brand Voice: ${data.tone || 'premium'}
- Format: ${data.format || 'ecommerce'}

Turn features into benefits and provide a headline, product story, feature list, and conversion CTA.`;
    }

    case 'summarize': {
      const data = input as unknown as SummarizeToolInput;
      return `Summarize the following document/content:
- Format / Detail Level: ${data.length || 'concise'}
${data.focusArea ? `- Specific Focus: ${data.focusArea}` : ''}

--- Content to Summarize ---
${data.textToSummarize || 'No content provided.'}
----------------------------

Provide the 1-sentence executive summary, bulleted key takeaways, and action items.`;
    }

    case 'brainstorm': {
      const data = input as unknown as BrainstormToolInput;
      return `Brainstorm high-impact strategic ideas for the following challenge:
- Core Challenge / Objective: ${data.challenge || 'Accelerate business growth'}
- Industry / Niche: ${data.industry || 'Technology & Business Services'}
- Scale / Stage: ${data.budgetOrScale || 'growth_scaleup'}
- Primary Goal: ${data.primaryGoal || 'Acquire high-value customers'}

Provide 3 to 5 structured, actionable concepts with execution steps and value proposition.`;
    }

    default:
      return 'Please analyze the request and provide comprehensive business guidance.';
  }
}
