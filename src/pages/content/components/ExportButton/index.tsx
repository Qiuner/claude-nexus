/**
 * index.tsx
 * Purpose: Injects an "Export" button into claude.ai toolbar and provides export UI.
 * Created: 2026-03-10
 */

import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useExport } from '../../hooks/useExport';
import type { ExportFormat } from '../../services/exportFormatters';
import { EXPORT_SELECTORS } from '../../services/exportExtractors';
import { EXPORT_BUTTON_ROOT_ID, EXPORT_BUTTON_ROOT_SELECTOR } from '@src/constants/selectors';

const INIT_FLAG = '__claudeNexusExportInit__';
const HISTORY_PATCH_FLAG = '__claudeNexusHistoryPatch__';

type ExportPopoverProps = {
  open: boolean;
  onClose: () => void;
};

const ExportPopover = ({ open, onClose }: ExportPopoverProps) => {
  const { t } = useTranslation();
  const { format, setFormat, status, result, error, exportConversation } = useExport();

  const statusText = useMemo(() => {
    if (status === 'exporting') return t('export.statusExporting');
    if (status === 'error') return t('export.statusFailed');
    if (status !== 'success' || !result) return '';

    const base = t('export.statusSuccess', { count: result.messageCount });
    if (!result.failedMessages) return base;
    return `${base} · ${t('export.statusFailedCount', { count: result.failedMessages })}`;
  }, [error, result, status, t]);

  if (!open) return null;

  return (
    <div className="absolute right-0 top-full z-50 mt-2 w-[16rem] rounded-xl border border-[#e5e0d8] bg-white p-3 text-[#374151] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12px] font-medium">{t('export.title')}</div>
        <button
          type="button"
          className="rounded p-1 text-[#6b7280] hover:bg-zinc-100"
          aria-label={t('export.closeAria')}
          onClick={onClose}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <div className="mb-2 text-[12px] text-[#6b7280]">{t('export.formatLabel')}</div>
      <div className="mb-3 flex flex-col gap-2">
        <label className="flex cursor-pointer items-center gap-2 text-[12px]">
          <input
            type="radio"
            name="claude-nexus-export-format"
            value="markdown"
            checked={format === 'markdown'}
            onChange={() => setFormat('markdown')}
          />
          <FileText className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
          {t('export.formatMarkdown')}
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[12px]">
          <input
            type="radio"
            name="claude-nexus-export-format"
            value="json"
            checked={format === 'json'}
            onChange={() => setFormat('json')}
          />
          <FileText className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
          {t('export.formatJson')}
        </label>
      </div>

      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-[#e5e0d8] bg-white px-3 py-2 text-[12px] text-[#374151] hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void exportConversation()}
        disabled={status === 'exporting'}
      >
        <Download className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
        {t('export.exportButton')}
      </button>

      {statusText ? <div className="mt-2 text-[12px] text-[#6b7280]">{statusText}</div> : null}
      {status === 'error' && error ? <div className="mt-1 text-[12px] text-red-600">{error}</div> : null}
    </div>
  );
};

/**
 * Export button mounted into claude.ai toolbar.
 * @returns JSX.Element
 */
const ExportButton = () => {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = wrapperRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener('mousedown', onDown, true);
    return () => window.removeEventListener('mousedown', onDown, true);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        className="inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-lg border border-[#e5e0d8] bg-white px-3 text-[12px] text-[#374151] shadow-sm hover:bg-zinc-50 active:scale-[0.98]"
        aria-label={t('export.buttonAria')}
        onClick={() => setOpen((v) => !v)}
      >
        <Download className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
        {t('export.buttonLabel')}
      </button>

      <ExportPopover open={open} onClose={() => setOpen(false)} />
    </div>
  );
};

const patchHistory = () => {
  const w = window as unknown as Record<string, unknown>;
  if (w[HISTORY_PATCH_FLAG]) return;
  w[HISTORY_PATCH_FLAG] = true;

  const notify = () => window.dispatchEvent(new Event('claude-nexus:locationchange'));

  const originalPushState = history.pushState.bind(history);
  history.pushState = ((...args: Parameters<History['pushState']>) => {
    const ret = originalPushState(...args);
    notify();
    return ret;
  }) as History['pushState'];

  const originalReplaceState = history.replaceState.bind(history);
  history.replaceState = ((...args: Parameters<History['replaceState']>) => {
    const ret = originalReplaceState(...args);
    notify();
    return ret;
  }) as History['replaceState'];

  window.addEventListener('popstate', notify);
};

const mountIntoToolbar = (): boolean => {
  const container = document.querySelector(EXPORT_SELECTORS.toolbarActions);
  if (!(container instanceof HTMLElement)) return false;

  const existing = container.querySelector(EXPORT_BUTTON_ROOT_SELECTOR);
  if (existing instanceof HTMLElement) return true;

  const host = document.createElement('div');
  host.id = EXPORT_BUTTON_ROOT_ID;
  container.appendChild(host);

  createRoot(host).render(<ExportButton />);
  return true;
};

/**
 * Initializes toolbar injection with MutationObserver and SPA navigation hooks.
 * Safe to call multiple times.
 * @returns void
 *
 * Modification Notes:
 *   - 2026-03-10 Initial implementation.
 */
export const initExportButtonInjection = (): void => {
  const w = window as unknown as Record<string, unknown>;
  if (w[INIT_FLAG]) return;
  w[INIT_FLAG] = true;

  patchHistory();
  mountIntoToolbar();

  const observer = new MutationObserver(() => {
    mountIntoToolbar();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('claude-nexus:locationchange', () => {
    window.setTimeout(() => mountIntoToolbar(), 0);
  });
};
