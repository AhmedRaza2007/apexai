// ApexAI Knowledge Studio & Retrieval-Augmented Generation (RAG) Architecture
// Grounds conversational responses in private uploaded documents via context retrieval without altering foundation model weights.

export interface KnowledgeDocument {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx' | 'md' | 'csv';
  sizeBytes: number;
  content: string;
  chunks: string[];
  tags: string[];
  uploadedAt: string;
}

export interface KnowledgeCollection {
  id: string;
  title: string;
  customInstructions: string;
  documents: KnowledgeDocument[];
  updatedAt: string;
}

const STORAGE_KEY_KNOWLEDGE = 'apexai_knowledge_collections';

// Default initial collection with enterprise compliance guidelines
export const DEFAULT_COLLECTION: KnowledgeCollection = {
  id: 'col-default',
  title: 'Enterprise Standard Operating Procedures',
  customInstructions: 'Prioritize compliance with SOC2 Type II, GDPR Article 32, and enterprise data encryption standards. Ensure all recommendations cite specific section policies.',
  updatedAt: new Date().toISOString(),
  documents: [
    {
      id: 'doc-sla-policy',
      name: 'Enterprise_SLA_Guidelines_2026.md',
      type: 'md',
      sizeBytes: 4200,
      content: `# Enterprise SLA & Vendor Governance Standards 2026
## 1. System Availability Guarantees
All production SaaS workloads must adhere to a minimum 99.9% monthly uptime SLA. Planned maintenance windows must be scheduled between 02:00 UTC and 04:00 UTC on Sundays, with at least 5 business days advance notification.

## 2. Security Breach Notification
Vendors must notify the Chief Information Security Officer (CISO) within 72 hours of any confirmed or suspected unauthorized access to customer confidential data.

## 3. Remedies & Service Credits
If monthly uptime drops below 99.5%, a 10% credit applies. If uptime drops below 98.0%, customer reserves the right to terminate for cause with zero termination penalties.`,
      chunks: [
        'Enterprise SLA & Vendor Governance Standards 2026. System Availability Guarantees: All production SaaS workloads must adhere to a minimum 99.9% monthly uptime SLA. Planned maintenance windows must be scheduled between 02:00 UTC and 04:00 UTC on Sundays, with at least 5 business days advance notification.',
        'Security Breach Notification: Vendors must notify the Chief Information Security Officer (CISO) within 72 hours of any confirmed or suspected unauthorized access to customer confidential data.',
        'Remedies & Service Credits: If monthly uptime drops below 99.5%, a 10% credit applies. If uptime drops below 98.0%, customer reserves the right to terminate for cause with zero termination penalties.',
      ],
      tags: ['compliance', 'sla', 'security'],
      uploadedAt: new Date().toISOString(),
    },
  ],
};

// Split raw document text into retrievable passage chunks
export function chunkDocumentText(text: string, chunkSize: number = 600, overlap: number = 100): string[] {
  const paragraphs = text.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const clean = para.trim();
    if (!clean) continue;

    if ((currentChunk + ' ' + clean).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Keep overlap
      currentChunk = currentChunk.slice(-overlap) + ' ' + clean;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + clean;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [text.slice(0, 1000)];
}

// Retrieve top relevant chunks for RAG context
export function searchKnowledgeBase(query: string, documents: KnowledgeDocument[], topK: number = 3): string[] {
  const terms = query
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (terms.length === 0) return [];

  const scoredChunks: Array<{ text: string; score: number; docName: string }> = [];

  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      const lower = chunk.toLowerCase();
      let score = 0;

      for (const term of terms) {
        if (lower.includes(term)) {
          // Exact term match
          score += 2;
          // Bonus for frequency
          const matches = lower.split(term).length - 1;
          score += matches * 0.5;
        }
      }

      if (score > 0) {
        scoredChunks.push({ text: chunk, score, docName: doc.name });
      }
    }
  }

  scoredChunks.sort((a, b) => b.score - a.score);
  return scoredChunks.slice(0, topK).map((item) => `[Source: ${item.docName}]\n${item.text}`);
}

export function getLocalKnowledgeCollections(): KnowledgeCollection[] {
  if (typeof window === 'undefined') return [DEFAULT_COLLECTION];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KNOWLEDGE);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not read knowledge collections:', e);
  }
  return [DEFAULT_COLLECTION];
}

export function saveLocalKnowledgeCollections(collections: KnowledgeCollection[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_KNOWLEDGE, JSON.stringify(collections));
  } catch (e) {
    console.warn('Could not save knowledge collections:', e);
  }
}
