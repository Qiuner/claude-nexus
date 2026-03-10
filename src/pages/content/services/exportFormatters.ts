/**
 * exportFormatters.ts
 * Purpose: Formats extracted conversation messages into exportable text payloads.
 * Created: 2026-03-10
 */

import type { ExportMessage, ExportPayload } from './exportTypes';

export type ExportFormat = 'markdown' | 'json';

const formatMarkdown = (messages: ExportMessage[]): string => {
  return messages
    .map((m) => {
      const title = m.role === 'user' ? 'User' : 'Assistant';
      return `# ${title}\n${m.content}`.trim();
    })
    .join('\n\n');
};

const formatJson = (payload: ExportPayload): string => {
  return JSON.stringify(payload, null, 2);
};

/**
 * Formats the given message list into the requested output format.
 * @param messages ExportMessage[]
 * @param format ExportFormat
 * @returns string
 *
 * Modification Notes:
 *   - 2026-03-10 Initial implementation (Markdown / JSON).
 */
export const formatContent = (messages: ExportMessage[], format: ExportFormat): string => {
  if (format === 'markdown') return formatMarkdown(messages);
  return formatJson({ messages, exportedAt: new Date().toISOString() });
};

