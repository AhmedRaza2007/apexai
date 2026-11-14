// ApexAI Executive Report Architect Engine
// Multi-stage deep research and document synthesis with tables, matrices, and PDF export

export interface ReportParameters {
  topic: string;
  industry: string;
  targetAudience: string;
  format: 'strategic_playbook' | 'due_diligence_audit' | 'market_landscape' | 'investment_memo';
  depth: 'comprehensive' | 'board_briefing';
  model?: string;
}

export interface ExecutiveReport {
  id: string;
  title: string;
  topic: string;
  industry: string;
  targetAudience: string;
  format: string;
  markdownContent: string;
  sections: Array<{ id: string; title: string; content: string }>;
  modelUsed: string;
  createdAt: string;
}

export const REPORT_FORMATS = [
  { id: 'strategic_playbook', label: 'Executive Strategic Playbook', description: 'Comprehensive GTM roadmap, competitive positioning, and operational execution.' },
  { id: 'due_diligence_audit', label: 'Commercial & Risk Due Diligence', description: 'Rigorous assessment of technology risks, SLA vulnerabilities, and unit economics.' },
  { id: 'market_landscape', label: 'Market Landscape & Sector Deep Dive', description: 'Analysis of market size, competitor moats, customer segments, and tailwinds.' },
  { id: 'investment_memo', label: 'Investment & Allocation Memo', description: 'Structured thesis with capital allocation recommendations, KPIs, and payback periods.' },
];

const STORAGE_KEY_REPORTS = 'apexai_saved_reports';

export function getLocalReports(): ExecutiveReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_REPORTS);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Could not load reports:', e);
  }
  return [];
}

export function saveLocalReport(report: ExecutiveReport): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getLocalReports();
    const updated = [report, ...list.filter((r) => r.id !== report.id)];
    localStorage.setItem(STORAGE_KEY_REPORTS, JSON.stringify(updated.slice(0, 25)));
  } catch (e) {
    console.warn('Could not save report:', e);
  }
}
