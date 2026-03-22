import { useEffect, useMemo, useRef, useState } from 'react';
import { BookText, Copy, Check, Download, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { usePromptLibrary } from '../../../hooks/usePromptLibrary';
import type { Prompt } from '@src/types/prompt';
import { CHAT_INPUT_SELECTOR } from '@src/constants/selectors';

type ViewMode = 'list' | 'edit';

type Draft = {
  content: string;
  tags: string;
};

const getChatInputElement = (): HTMLElement | null => {
  const el = document.querySelector(CHAT_INPUT_SELECTOR);
  return el instanceof HTMLElement ? el : null;
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
  if (normalized.length <= 40) return normalized;
  return `${normalized.slice(0, 40)}…`;
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

type Props = {
  side: 'left' | 'right';
  onClose: () => void;
};

export default function PromptPanel({ side, onClose }: Props) {
  const { t } = useTranslation();
  const { tags, loading, createPrompt, updatePrompt, deletePrompt, importFromFile, exportToFile, filterPrompts } = usePromptLibrary();

  const [mode, setMode] = useState<ViewMode>('list');
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({ content: '', tags: '' });
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filtered = useMemo(() => filterPrompts(query, selectedTag), [filterPrompts, query, selectedTag]);

  useEffect(() => {
    if (!selectedTag) return;
    if (tags.includes(selectedTag)) return;
    setSelectedTag(null);
  }, [selectedTag, tags]);

  const startCreate = () => {
    setEditingId(null);
    setPendingDeleteId(null);
    setDraft({ content: '', tags: '' });
    setMode('edit');
  };

  const startEdit = (prompt: Prompt) => {
    setEditingId(prompt.id);
    setPendingDeleteId(null);
    setDraft({ content: prompt.content, tags: formatTagsInput(prompt.tags) });
    setMode('edit');
  };

  const handleSave = async () => {
    const content = draft.content.trim();
    if (!content) return;
    const tags = parseTagsInput(draft.tags);

    if (editingId) {
      await updatePrompt(editingId, { content, tags: tags.length ? tags : undefined });
    } else {
      await createPrompt({ content, tags: tags.length ? tags : undefined });
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

  const handleCopy = async (prompt: Prompt) => {
    try {
      await navigator.clipboard.writeText(prompt.content);
      setCopiedId(prompt.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (e) {
      console.error('Failed to copy to clipboard', e);
    }
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

  const sideClass = side === 'left' ? 'right-full mr-3' : 'left-full ml-3';
  const arrowWrapperClass = side === 'left' ? 'left-full' : 'right-full';
  const arrowBorderClass = side === 'left' ? 'border-l-zinc-200 dark:border-l-zinc-700/50' : 'border-r-zinc-200 dark:border-r-zinc-700/50';
  const arrowFillClass = side === 'left' ? 'border-l-white dark:border-l-[#18181b]' : 'border-r-white dark:border-r-[#18181b]';
  const arrowBorderOffsetClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`absolute top-1/2 -translate-y-1/2 ${sideClass} z-50`}>
      <div className="relative w-[28rem] rounded-xl border !border-[#e5e0d8] dark:!border-zinc-700/50 !bg-white/95 dark:!bg-[#18181b]/95 backdrop-blur-md p-3 !text-[#374151] dark:!text-zinc-200 shadow-[0_8px_32px_rgba(0,0,0,0.16)]">
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

            <div className="mb-2 flex items-start gap-2 max-w-full">
              <div className="flex flex-1 min-w-0 flex-col gap-2 w-full overflow-hidden">
                <div className="flex items-center gap-2 rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1">
                  <Search className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
                  <input
                    className="w-full min-w-0 !bg-transparent text-[12px] outline-none !text-[#374151] dark:!text-zinc-200 dark:placeholder:!text-zinc-500"
                    placeholder={t('promptLibrary.searchPlaceholder')}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
                  aria-label={t('promptLibrary.newAria')}
                  onClick={startCreate}
                >
                  <Plus className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
                  {t('promptLibrary.new')}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
                  onClick={startImport}
                >
                  <Plus className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
                  {t('promptLibrary.import')}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
                  onClick={() => void handleExport()}
                >
                  <Download className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" />
                  {t('promptLibrary.export')}
                </button>
              </div>
            </div>

            {tags.length ? (
              <div className="mb-2 flex flex-nowrap gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:!bg-zinc-200 dark:[&::-webkit-scrollbar-thumb]:!bg-zinc-700">
                <button
                  type="button"
                  className={
                    selectedTag === null
                      ? 'whitespace-nowrap rounded-full border border-[#374151] !bg-[#374151] px-3 py-1 text-[12px] !text-white'
                      : 'whitespace-nowrap rounded-full border !border-[#e5e0d8] dark:!border-zinc-600 !bg-white dark:!bg-zinc-800 px-3 py-1 text-[12px] !text-[#374151] dark:!text-zinc-300 hover:!bg-zinc-50 dark:hover:!bg-zinc-700'
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
                        : 'whitespace-nowrap rounded-full border !border-[#e5e0d8] dark:!border-zinc-600 !bg-white dark:!bg-zinc-800 px-3 py-1 text-[12px] !text-[#374151] dark:!text-zinc-300 hover:!bg-zinc-50 dark:hover:!bg-zinc-700'
                    }
                    onClick={() => setSelectedTag(tag)}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            ) : null}

            {importMessage ? <div className="mb-2 text-[12px] text-[#6b7280] dark:text-zinc-400">{importMessage}</div> : null}

            {loading ? (
              <div className="py-6 text-center text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.loading')}</div>
            ) : filtered.length === 0 ? (
              <div className="py-6 text-center text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.empty')}</div>
            ) : (
              <div className="max-h-[18rem] overflow-auto">
                <div className="flex flex-col gap-2">
                  {filtered.map((p) => (
                    <div key={p.id} className="rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="line-clamp-2 text-[12px] !text-[#374151] dark:!text-zinc-300 break-words leading-relaxed whitespace-pre-wrap">{p.content}</div>
                          {p.tags && p.tags.length ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {p.tags.map((tag) => (
                                <span key={tag} className="rounded border !border-[#e5e0d8] dark:!border-zinc-600 !bg-white dark:!bg-zinc-800 px-1.5 py-0.5 text-[11px] !text-[#6b7280] dark:!text-zinc-400">
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
                                aria-label={t('common.copy', { defaultValue: 'Copy' })}
                                onClick={() => void handleCopy(p)}
                              >
                                {copiedId === p.id ? (
                                  <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                                ) : (
                                  <Copy className="h-4 w-4" aria-hidden="true" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {pendingDeleteId === p.id ? (
                        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-2">
                          <div className="min-w-0 text-[12px] !text-[#6b7280] dark:!text-zinc-400">
                            {t('promptLibrary.deleteConfirm', { title: buildPreview(p.content) })}
                          </div>
                          <div className="flex shrink-0 gap-2">
                            <button
                              type="button"
                              className="rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
                              onClick={() => setPendingDeleteId(null)}
                            >
                              {t('common.cancel')}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
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
                            className="flex flex-1 items-center justify-center rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
                            onClick={() => handleInsert(p)}
                          >
                            {t('promptLibrary.insert')}
                          </button>
                          <button
                            type="button"
                            className="flex flex-1 items-center justify-center rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
                            onClick={() => startEdit(p)}
                          >
                            {t('promptLibrary.edit')}
                          </button>
                          <button
                            type="button"
                            className="flex flex-1 items-center justify-center rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-1 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
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
              <div className="mb-1 text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.tagsLabel')}</div>
              <input
                className="w-full rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-2 text-[12px] dark:!text-zinc-200 outline-none focus:border-[#c96442]"
                value={draft.tags}
                onChange={(e) => setDraft((v) => ({ ...v, tags: e.target.value }))}
                placeholder={t('promptLibrary.tagsPlaceholder')}
              />
            </div>
            <div className="mb-3">
              <div className="mb-1 text-[12px] text-[#6b7280] dark:text-zinc-400">{t('promptLibrary.contentLabel')}</div>
              <textarea
                className="h-[10rem] w-full resize-none rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-2 py-2 text-[12px] dark:!text-zinc-200 outline-none focus:border-[#c96442]"
                value={draft.content}
                onChange={(e) => setDraft((v) => ({ ...v, content: e.target.value }))}
                placeholder={t('promptLibrary.contentPlaceholder')}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-3 py-2 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700"
                onClick={() => setMode('list')}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="rounded-lg border !border-[#e5e0d8] dark:!border-zinc-700 !bg-white dark:!bg-zinc-800 px-3 py-2 text-[12px] dark:!text-zinc-200 hover:!bg-zinc-50 dark:hover:!bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={() => void handleSave()}
                disabled={!draft.content.trim()}
              >
                {t('common.save')}
              </button>
            </div>
          </>
        )}
        
        {/* Positional Arrow for FloatBall matching exact colors block */}
        <div className={`absolute top-1/2 -translate-y-1/2 ${arrowWrapperClass}`}>
          <div className={`h-0 w-0 border-y-[6px] border-y-transparent ${arrowBorderClass} ${side === 'left' ? 'border-l-[6px]' : 'border-r-[6px]'}`} />
          <div
            className={`absolute ${arrowBorderOffsetClass} top-1/2 -translate-y-1/2 h-0 w-0 border-y-[5px] border-y-transparent ${arrowFillClass} ${
              side === 'left' ? 'border-l-[5px]' : 'border-r-[5px]'
            }`}
          />
        </div>

      </div>
    </div>
  );
}
