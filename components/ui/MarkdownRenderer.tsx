'use client';

import React, { useState, useMemo } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  className = '',
}: MarkdownRendererProps) {
  // Parse blocks: code fences, tables, headings, lists, paragraphs (memoized per content)
  const blocks = useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className={`space-y-3 leading-relaxed text-slate-200 ${className}`}>
      {blocks.map((block, i) => (
        <BlockItem key={`${block.type}-${i}`} block={block} />
      ))}
    </div>
  );
});

type Block =
  | { type: 'code'; language: string; code: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'blockquote'; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'list'; items: string[]; ordered: boolean }
  | { type: 'paragraph'; text: string };

function parseMarkdownBlocks(content: string): Block[] {
  if (!content) return [];

  const lines = content.split('\n');
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const startI = i;
    const line = lines[i];

    // 1. Code Fence
    if (line.trim().startsWith('```')) {
      const match = line.trim().match(/^```([a-zA-Z0-9_-]*)/);
      const language = match ? match[1] || 'text' : 'text';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({
        type: 'code',
        language,
        code: codeLines.join('\n'),
      });
      if (i < lines.length && lines[i].trim().startsWith('```')) {
        i++; // skip ending fence
      }
      continue;
    }

    // 2. Headings (# to ###### followed by optional whitespace or text)
    if (line.match(/^#{1,6}(\s+.*)?$/)) {
      const match = line.match(/^(#{1,6})\s*(.*)$/);
      if (match) {
        blocks.push({
          type: 'heading',
          level: match[1].length,
          text: match[2] || '',
        });
        i++;
        continue;
      }
    }

    // 3. Blockquote
    if (line.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
        i++;
      }
      blocks.push({
        type: 'blockquote',
        text: quoteLines.join('\n'),
      });
      continue;
    }

    // 4. Tables (pipe-delimited)
    if (line.trim().startsWith('|') && line.includes('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const parseRow = (row: string) =>
          row
            .split('|')
            .slice(1, -1)
            .map((cell) => cell.trim());
        const headers = parseRow(tableLines[0]);
        // line 1 is usually separator (|---|---|)
        const rows = tableLines.slice(2).map(parseRow);
        blocks.push({
          type: 'table',
          headers,
          rows,
        });
        continue;
      } else {
        // Lone pipe line during streaming: treat as paragraph line
        blocks.push({
          type: 'paragraph',
          text: tableLines.join('\n'),
        });
        continue;
      }
    }

    // 5. Lists (unordered * or - or ordered 1.)
    if (line.match(/^(\*|-)\s+/) || line.match(/^\d+\.\s+/)) {
      const isOrdered = Boolean(line.match(/^\d+\.\s+/));
      const listItems: string[] = [];
      while (
        i < lines.length &&
        ((isOrdered && lines[i].match(/^\d+\.\s+/)) ||
          (!isOrdered && lines[i].match(/^(\*|-)\s+/)))
      ) {
        const itemText = isOrdered
          ? lines[i].replace(/^\d+\.\s+/, '')
          : lines[i].replace(/^(\*|-)\s+/, '');
        listItems.push(itemText);
        i++;
      }
      blocks.push({
        type: 'list',
        items: listItems,
        ordered: isOrdered,
      });
      continue;
    }

    // 6. Empty line
    if (line.trim().length === 0) {
      i++;
      continue;
    }

    // 7. Regular paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim().length > 0 &&
      !lines[i].trim().startsWith('```') &&
      !lines[i].match(/^#{1,6}(\s+.*)?$/) &&
      !lines[i].startsWith('>') &&
      !lines[i].trim().startsWith('|') &&
      !lines[i].match(/^(\*|-)\s+/) &&
      !lines[i].match(/^\d+\.\s+/)
    ) {
      paraLines.push(lines[i]);
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: paraLines.join('\n'),
      });
    }

    // Absolute forward progress guarantee: prevent infinite loops on malformed/streaming inputs
    if (i === startI) {
      blocks.push({
        type: 'paragraph',
        text: lines[i],
      });
      i++;
    }
  }

  return blocks;
}

const BlockItem = React.memo(function BlockItem({ block }: { block: Block }) {
  switch (block.type) {
    case 'code':
      return <CodeBlock language={block.language} code={block.code} />;

    case 'heading': {
      if (block.level === 1) {
        return (
          <h1 className="text-xl font-bold text-white mt-3 pb-1 border-b border-slate-800">
            {formatInline(block.text)}
          </h1>
        );
      }
      if (block.level === 2) {
        return <h2 className="text-lg font-bold text-white mt-3 pb-1">{formatInline(block.text)}</h2>;
      }
      return <h3 className="text-sm font-semibold text-blue-300 mt-2">{formatInline(block.text)}</h3>;
    }

    case 'blockquote':
      return (
        <blockquote className="border-l-4 border-blue-500/60 bg-blue-950/20 px-3.5 py-2 my-2 rounded-r-lg text-xs italic text-slate-300">
          {formatInline(block.text)}
        </blockquote>
      );

    case 'table':
      return (
        <div className="overflow-x-auto my-3 rounded-lg border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80">
                {block.headers.map((h, idx) => (
                  <th key={idx} className="p-2.5 font-semibold text-slate-300">
                    {formatInline(h)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {block.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="p-2.5 text-slate-300">
                      {formatInline(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case 'list': {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag className={`space-y-1.5 pl-5 my-1 text-xs sm:text-sm ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((item, idx) => (
            <li key={idx} className="leading-relaxed text-slate-300">
              {formatInline(item)}
            </li>
          ))}
        </Tag>
      );
    }

    case 'paragraph':
      return <p className="text-xs sm:text-sm leading-relaxed text-slate-200">{formatInline(block.text)}</p>;

    default:
      return null;
  }
});

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/80 px-4 py-1.5 text-xs">
        <span className="font-mono text-[11px] font-medium text-blue-400 uppercase tracking-wider">
          {language}
        </span>
        <button
          onClick={handleCopy}
          aria-label="Copy code block"
          className="flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-xs text-slate-200 leading-normal">
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Inline formatting: **bold**, *italics*, `code`
function formatInline(text: string): React.ReactNode {
  if (!text) return null;

  const parts: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={match.index}
          className="rounded bg-slate-800/90 border border-slate-700/60 px-1.5 py-0.5 font-mono text-[11px] text-blue-300"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={match.index} className="font-semibold text-white">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push(
        <em key={match.index} className="italic text-slate-300">
          {token.slice(1, -1)}
        </em>
      );
    }

    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : text;
}
