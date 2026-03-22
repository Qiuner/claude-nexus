/**
 * index.tsx
 * Purpose: Injects a prompt library button into the chat input toolbar and manages insertion/editing UI.
 * Created: 2026-03-10
 */

import { createRoot } from 'react-dom/client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { BookText, Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePromptLibrary } from '../../hooks/usePromptLibrary';
import type { Prompt } from '@src/types/prompt';
import {
  CHAT_INPUT_LEFT_ACTIONS_SELECTOR,
  CHAT_INPUT_SELECTOR,
  CHAT_INPUT_TOOLBAR_PARENT_SELECTOR,
  PROMPT_BUTTON_ROOT_ID,
  PROMPT_BUTTON_ROOT_SELECTOR,
} from '@src/constants/selectors';

const INIT_FLAG = '__claudeNexusPromptInit__';
const HISTORY_PATCH_FLAG = '__claudeNexusHistoryPatch__';

type ViewMode = 'list' | 'edit';

type Draft = {
  title: string;
  content: string;
  tags: string;
};

const getChatInputElement = (): HTMLElement | null => {
  const el = document.querySelector(CHAT_INPUT_SELECTOR);
  return el instanceof HTMLElement ? el : null;
};

/**
 * Finds the left button container next to the chat input.
 * Uses relative positioning as claude.ai DOM is SPA-driven and classnames can shift.
 */
const findLeftButtonsContainer = (): HTMLElement | null => {
  const input = document.querySelector(CHAT_INPUT_SELECTOR);
  if (!(input instanceof HTMLElement)) return null;

  const container = input.closest(CHAT_INPUT_TOOLBAR_PARENT_SELECTOR);
  if (!container) return null;

  const leftButtons = container.querySelector(CHAT_INPUT_LEFT_ACTIONS_SELECTOR);
  return leftButtons instanceof HTMLElement ? leftButtons : null;
};

const insertIntoChatInput = (promptContent: string): boolean => {
  const el = getChatInputElement();
  if (!el) return false;

  try {
    el.focus();
    document.execCommand('selectAll');
    document.execCommand('insertText', false, promptContent);
    try {
      el.dispatchEvent(new InputEvent('input', { bubbles: true }));
    } catch {
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    return true;
  } catch {
    return false;
  }
};

const buildPreview = (content: string): string => {
  const normalized = content.replace(/\s+/g, ' ').trim();
  if (normalized.length <= 30) return normalized;
  return `${normalized.slice(0, 30)}…`;
};

const parseTagsInput = (input: string): string[] => {
  const tags = input
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i);
  return tags;
};

const formatTagsInput = (tags?: string[]): string => {
  if (!tags || tags.length === 0) return '';
  return tags.join(', ');
};

type PromptPopoverProps = {
  open: boolean;
  onClose: () => void;
};

const PromptPopover = ({ open, onClose }: PromptPopoverProps) => {
  const { t } = useTranslation();
  const { tags, loading, createPrompt, updatePrompt, deletePrompt, importFromFile, exportToFile, filterPrompts } = usePromptLibrary();

  const [mode, setMode] = useState<ViewMode>('list');
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ title: '', content: '', tags: '' });
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setMode('list');
    setQuery('');
    setSelectedTag(null);
    setEditingId(null);
    setPendingDeleteId(null);
    setDraft({ title: '', content: '', tags: '' });
    setImportMessage(null);
  }, [open]);

  const filtered = useMemo(() => filterPrompts(query, selectedTag), [filterPrompts, query, selectedTag]);

  useEffect(() => {
    if (!selectedTag) return;
    if (tags.includes(selectedTag)) return;
    setSelectedTag(null);
  }, [selectedTag, tags]);

  const startCreate = () => {
    setEditingId(null);
    setPendingDeleteId(null);
    setDraft({ title: '', content: '', tags: '' });
    setMode('edit');
  };

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setPendingDeleteId(null);
    setDraft({ title: prompt.title, content: prompt.content, tags: formatTagsInput(prompt.tags) });
    setMode('edit');
  };

  const handleSave = async () => {
    const title = draft.title.trim();
    const content = draft.content.trim();
    if (!title || !content) return;
    const tags = parseTagsInput(draft.tags);

    if (editingId) {
      await updatePrompt(editingId, { title, content, tags: tags.length ? tags : undefined });
    } else {
      await createPrompt({ title, content, tags: tags.length ? tags : undefined });
    }
    setMode('list');
  };

  const handleConfirmDelete = async (prompt: Prompt) => {
    await deletePrompt(prompt.id);
    setPendingDeleteId(null);
  };

  const handleInsert = (prompt: Prompt) => {
    const ok = insertIntoChatInput(prompt.content);
    if (!ok) return;
    setPendingDeleteId(null);
    onClose();
  };

  const startImport = () => {
    setImportMessage(null);
    fileInputRef.current?.click();
  };

  const handleExport = async () => {
    setImportMessage(null);
    try {
      await exportToFile();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setImportMessage(t('promptLibrary.exportFailed', { error: msg }));
    }
  };

  const handleImportFile = async (file: File) => {
    try {
      const result = await importFromFile(file);
      setImportMessage(t('promptLibrary.importSuccess', { imported: result.imported, skipped: result.skipped }));
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      setImportMessage(t('promptLibrary.importFailed', { error: msg }));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!open) return null;

  return (
    <div className="absolute bottom-full left-0 z-50 mb-2 w-[24rem] rounded-xl border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 text-[#374151] dark:text-zinc-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12px] font-medium">{t('promptLibrary.title')}</div>
        <button
          type="button"
          className="rounded p-1 text-[#6b7280] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label={t('promptLibrary.closeAria')}
          onClick={onClose}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {mode === 'list' ? (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
            }}
          />

          <div className="mb-2 flex items-start gap-2">
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex items-center gap-2 rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1">
                <Search className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
                <input
                  className="w-full bg-transparent text-[12px] outline-none dark:text-zinc-200 dark:placeholder:text-zinc-500"
                  placeholder={t('promptLibrary.searchPlaceholder')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>

              {tags.length ? (
                <div className="flex flex-nowrap gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    className={
                      selectedTag === null
                        ? 'whitespace-nowrap rounded-full border border-[#374151] !bg-[#374151] px-3 py-1 text-[12px] !text-white'
                        : 'whitespace-nowrap rounded-full border border-[#e5e0d8] dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1 text-[12px] !text-[#374151] dark:!text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                    }
                    onClick={() => setSelectedTag(null)}
                  >
                    {t('promptLibrary.filterAll')}
                  </button>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={
                        selectedTag === tag
                          ? 'whitespace-nowrap rounded-full border border-[#374151] !bg-[#374151] px-3 py-1 text-[12px] !text-white'
                          : 'whitespace-nowrap rounded-full border border-[#e5e0d8] dark:border-zinc-600 bg-white dark:bg-zinc-800 px-3 py-1 text-[12px] !text-[#374151] dark:!text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                      }
                      onClick={() => setSelectedTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                onClick={startImport}
              >
                <Plus className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
                {t('promptLibrary.import')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                onClick={() => void handleExport()}
              >
                <Download className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
                {t('promptLibrary.export')}
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                aria-label={t('promptLibrary.newAria')}
                onClick={startCreate}
              >
                <Plus className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
                {t('promptLibrary.new')}
              </button>
            </div>
          </div>

          {importMessage ? <div className="mb-2 text-[12px] text-[#6b7280] dark:text-zinc-400">{importMessage}</div> : null}

          {loading ? (
            <div className="py-6 text-center text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="py-6 text-center text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.empty')}</div>
          ) : (
            <div className="max-h-[18rem] overflow-auto">
              <div className="flex flex-col gap-2">
                {filtered.map((p) => (
                  <div key={p.id} className="rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 p-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-[12px] font-medium">{p.title}</div>
                        <div className="mt-1 truncate text-[12px] text-[#6b7280] dark:text-zinc-400">{buildPreview(p.content)}</div>
                        {p.tags && p.tags.length ? (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {p.tags.map((tag) => (
                              <span key={tag} className="rounded border border-[#e5e0d8] dark:border-zinc-600 bg-white dark:bg-zinc-800 px-1.5 py-0.5 text-[11px] text-[#6b7280] dark:text-zinc-400">
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        {pendingDeleteId === p.id ? null : (
                          <>
                            <button
                              type="button"
                              className="rounded p-1 text-[#6b7280] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              aria-label={t('promptLibrary.insertAria')}
                              onClick={() => handleInsert(p)}
                            >
                              <BookText className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="rounded p-1 text-[#6b7280] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              aria-label={t('promptLibrary.editAria')}
                              onClick={() => startEdit(p)}
                            >
                              <Pencil className="h-4 w-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              className="rounded p-1 text-[#6b7280] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                              aria-label={t('promptLibrary.deleteAria')}
                              onClick={() => setPendingDeleteId(p.id)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {pendingDeleteId === p.id ? (
                      <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-2">
                        <div className="min-w-0 text-[12px] text-[#6b7280] dark:text-zinc-400">
                          {t('promptLibrary.deleteConfirm', { title: p.title })}
                        </div>
                        <div className="flex shrink-0 gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                            onClick={() => setPendingDeleteId(null)}
                          >
                            {t('common.cancel')}
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                            onClick={() => void handleConfirmDelete(p)}
                          >
                            {t('common.delete')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="flex flex-1 items-center justify-center rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                          onClick={() => handleInsert(p)}
                        >
                          {t('promptLibrary.insert')}
                        </button>
                        <button
                          type="button"
                          className="flex flex-1 items-center justify-center rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                          onClick={() => startEdit(p)}
                        >
                          {t('promptLibrary.edit')}
                        </button>
                        <button
                          type="button"
                          className="flex flex-1 items-center justify-center rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-1 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
                          onClick={() => setPendingDeleteId(p.id)}
                        >
                          {t('promptLibrary.delete')}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="mb-2">
            <div className="mb-1 text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.titleLabel')}</div>
            <input
              className="w-full rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-2 text-[12px] dark:text-zinc-200 outline-none focus:border-[#c96442]"
              value={draft.title}
              onChange={(e) => setDraft((v) => ({ ...v, title: e.target.value }))}
              placeholder={t('promptLibrary.titlePlaceholder')}
            />
          </div>
          <div className="mb-2">
            <div className="mb-1 text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.tagsLabel')}</div>
            <input
              className="w-full rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-2 text-[12px] dark:text-zinc-200 outline-none focus:border-[#c96442]"
              value={draft.tags}
              onChange={(e) => setDraft((v) => ({ ...v, tags: e.target.value }))}
              placeholder={t('promptLibrary.tagsPlaceholder')}
            />
          </div>
          <div className="mb-3">
            <div className="mb-1 text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.contentLabel')}</div>
            <textarea
              className="h-[10rem] w-full resize-none rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-2 py-2 text-[12px] dark:text-zinc-200 outline-none focus:border-[#c96442]"
              value={draft.content}
              onChange={(e) => setDraft((v) => ({ ...v, content: e.target.value }))}
              placeholder={t('promptLibrary.contentPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700"
              onClick={() => setMode('list')}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-2 text-[12px] dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void handleSave()}
              disabled={!draft.title.trim() || !draft.content.trim()}
            >
              {t('common.save')}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Prompt library button mounted into claude.ai chat input toolbar.
 * @returns JSX.Element
 */
const PromptButton = () => {
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
        className="inline-flex h-8 items-center gap-2 rounded-lg !bg-white dark:!bg-zinc-800 px-3 text-[12px] !text-[#374151] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700 active:scale-[0.98]"
        aria-label={t('promptLibrary.buttonAria')}
        onClick={() => setOpen((v) => !v)}
      >
        <BookText className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
        {t('promptLibrary.buttonLabel')}
      </button>

      <PromptPopover open={open} onClose={() => setOpen(false)} />
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

const mountIntoInputToolbar = (): boolean => {
  const container = findLeftButtonsContainer();
  if (!container) return false;

  const existing = container.querySelector(PROMPT_BUTTON_ROOT_SELECTOR);
  if (existing instanceof HTMLElement) return true;

  const host = document.createElement('div');
  host.id = PROMPT_BUTTON_ROOT_ID;
  container.appendChild(host);

  createRoot(host).render(<PromptButton />);
  return true;
};

/**
 * Initializes input toolbar injection with MutationObserver and SPA navigation hooks.
 * Safe to call multiple times.
 * @returns void
 *
 * Modification Notes:
 *   - 2026-03-10 Initial implementation.
 */
export const initPromptButtonInjection = (): void => {
  const w = window as unknown as Record<string, unknown>;
  if (w[INIT_FLAG]) return;
  w[INIT_FLAG] = true;

  patchHistory();
  mountIntoInputToolbar();

  const observer = new MutationObserver(() => {
    mountIntoInputToolbar();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  window.addEventListener('claude-nexus:locationchange', () => {
    window.setTimeout(() => mountIntoInputToolbar(), 0);
  });
};
