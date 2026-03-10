/**
 * useExport.ts
 * Purpose: Orchestrates message extraction, formatting, and file download for exports.
 * Created: 2026-03-10
 */

import { useCallback, useMemo, useState } from 'react';
import { extractConversationMessages } from '../services/exportExtractors';
import { formatContent } from '../services/exportFormatters';
import type { ExportFormat } from '../services/exportFormatters';

type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

type ExportResult = {
  messageCount: number;
  failedMessages: number;
};

type ExportApi = {
  format: ExportFormat;
  setFormat: (format: ExportFormat) => void;
  status: ExportStatus;
  result: ExportResult | null;
  error: string | null;
  exportConversation: () => Promise<void>;
};

const getChatId = (): string => window.location.pathname.split('/chat/')?.[1] ?? '';

const getFilename = (format: ExportFormat): string => {
  const chatId = getChatId();
  const time = new Date().toISOString().replace(/[:.]/g, '-');
  const ext = format === 'markdown' ? 'md' : 'json';
  const idPart = chatId ? `-${chatId}` : '';
  return `claude-export${idPart}-${time}.${ext}`;
};

const downloadText = (filename: string, text: string, mime: string) => {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();

  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

/**
 * Export hook
 * @returns ExportApi
 *
 * Modification Notes:
 *   - 2026-03-10 Initial implementation (Markdown / JSON).
 */
export const useExport = (): ExportApi => {
  const [format, setFormat] = useState<ExportFormat>('markdown');
  const [status, setStatus] = useState<ExportStatus>('idle');
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mime = useMemo(() => {
    if (format === 'markdown') return 'text/markdown;charset=utf-8';
    return 'application/json;charset=utf-8';
  }, [format]);

  const exportConversation = useCallback(async () => {
    setStatus('exporting');
    setError(null);
    setResult(null);

    try {
      const extracted = await extractConversationMessages();
      const text = formatContent(extracted.messages, format);
      const filename = getFilename(format);
      downloadText(filename, text, mime);
      setResult({ messageCount: extracted.messages.length, failedMessages: extracted.failedMessages });
      setStatus('success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setError(msg);
      setStatus('error');
    }
  }, [format, mime]);

  return { format, setFormat, status, result, error, exportConversation };
};

