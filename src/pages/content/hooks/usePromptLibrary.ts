/**
 * usePromptLibrary.ts
 * Purpose: Provides CRUD operations for the prompt library backed by chrome.storage.local.
 * Created: 2026-03-10
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Prompt } from '@src/types/prompt';
import { readStoredPromptLibrary, writeStoredPromptLibrary } from '@src/services/storage';

type PromptDraft = {
  content: string;
  tags?: string[];
};

type PromptLibraryApi = {
  prompts: Prompt[];
  tags: string[];
  loading: boolean;
  createPrompt: (draft: PromptDraft) => Promise<Prompt>;
  updatePrompt: (id: string, draft: PromptDraft) => Promise<Prompt | null>;
  deletePrompt: (id: string) => Promise<boolean>;
  importFromFile: (file: File) => Promise<{ imported: number; skipped: number }>;
  exportToFile: () => Promise<void>;
  filterPrompts: (query: string, tag: string | null) => Prompt[];
};

const normalizeDraft = (draft: PromptDraft): PromptDraft => {
  const tags = (draft.tags ?? [])
    .map((t) => t.trim())
    .filter(Boolean)
    .filter((t, i, arr) => arr.indexOf(t) === i);
  return {
    content: draft.content.trim(),
    tags: tags.length ? tags : undefined,
  };
};

const buildTagSet = (prompts: Prompt[]): string[] => {
  const set = new Set<string>();
  for (const p of prompts) {
    for (const tag of p.tags ?? []) {
      const t = tag.trim();
      if (t) set.add(t);
    }
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};

const matchesQuery = (prompt: Prompt, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (prompt.content.toLowerCase().includes(q)) return true;
  if (prompt.tags && prompt.tags.some((t) => t.toLowerCase().includes(q))) return true;
  return false;
};

const matchesTag = (prompt: Prompt, tag: string | null): boolean => {
  if (!tag) return true;
  return Boolean(prompt.tags && prompt.tags.includes(tag));
};

type GeminiVoyagerPromptsExport = {
  format: string;
  exportedAt: string;
  items: Array<{ id: string; text: string; tags?: string[]; createdAt: number }>;
};

const formatDateForFilename = (d: Date): string => {
  return d.toISOString().slice(0, 10);
};

const downloadJson = (filename: string, data: unknown): void => {
  const text = JSON.stringify(data, null, 2);
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
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

const generateId = (): string => {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID();
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz-';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
};

/**
 * Prompt library hook
 * @returns PromptLibraryApi
 *
 * Modification Notes:
 *   - 2026-03-10 Initial implementation.
 */
export const usePromptLibrary = (): PromptLibraryApi => {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const stored = await readStoredPromptLibrary();
      setPrompts(stored ?? []);
      setLoading(false);
    })();
  }, []);

  const persist = useCallback(async (next: Prompt[]) => {
    setPrompts(next);
    await writeStoredPromptLibrary(next);
  }, []);

  const createPrompt = useCallback(async (draft: PromptDraft): Promise<Prompt> => {
    const normalized = normalizeDraft(draft);
    const prompt: Prompt = {
      id: generateId(),
      content: normalized.content,
      tags: normalized.tags,
      createdAt: Date.now(),
    };
    const next = [prompt, ...prompts];
    await persist(next);
    return prompt;
  }, [persist, prompts]);

  const updatePrompt = useCallback(async (id: string, draft: PromptDraft): Promise<Prompt | null> => {
    const index = prompts.findIndex((p) => p.id === id);
    if (index < 0) return null;
    const normalized = normalizeDraft(draft);
    const updated: Prompt = { ...prompts[index], content: normalized.content, tags: normalized.tags };
    const next = prompts.slice();
    next[index] = updated;
    await persist(next);
    return updated;
  }, [persist, prompts]);

  const deletePrompt = useCallback(async (id: string): Promise<boolean> => {
    const next = prompts.filter((p) => p.id !== id);
    if (next.length === prompts.length) return false;
    await persist(next);
    return true;
  }, [persist, prompts]);

  const importFromFile = useCallback(async (file: File): Promise<{ imported: number; skipped: number }> => {
    const text = await file.text();
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file');

    const data = parsed as Partial<GeminiVoyagerPromptsExport>;
    if (data.format !== 'gemini-voyager.prompts.v1') throw new Error('Unsupported format');
    if (!Array.isArray(data.items)) throw new Error('Invalid items');

    const existing = new Set(prompts.map((p) => p.content));
    const nextImported: Prompt[] = [];
    let skipped = 0;

    for (const item of data.items) {
      if (!item || typeof item !== 'object') {
        skipped += 1;
        continue;
      }
      const v = item as Partial<GeminiVoyagerPromptsExport['items'][number]>;
      if (typeof v.text !== 'string') {
        skipped += 1;
        continue;
      }
      const content = v.text.trim();
      if (!content) {
        skipped += 1;
        continue;
      }
      if (existing.has(content)) {
        skipped += 1;
        continue;
      }
      existing.add(content);

      const tags =
        v.tags && Array.isArray(v.tags) && v.tags.every((t) => typeof t === 'string')
          ? v.tags.map((t) => t.trim()).filter(Boolean).filter((t, i, arr) => arr.indexOf(t) === i)
          : [];

      nextImported.push({
        id: generateId(),
        content,
        tags: tags.length ? tags : undefined,
        createdAt: Date.now(),
      });
    }

    if (nextImported.length) {
      await persist([...nextImported, ...prompts]);
    }

    return { imported: nextImported.length, skipped };
  }, [persist, prompts]);

  const exportToFile = useCallback(async (): Promise<void> => {
    const now = new Date();
    const payload: GeminiVoyagerPromptsExport = {
      format: 'gemini-voyager.prompts.v1',
      exportedAt: now.toISOString(),
      items: prompts.map((p) => {
        return {
          id: p.id,
          text: p.content,
          tags: p.tags && p.tags.length ? p.tags : [],
          createdAt: p.createdAt,
        };
      }),
    };

    const filename = `claude-nexus-prompts-${formatDateForFilename(now)}.json`;
    downloadJson(filename, payload);
  }, [prompts]);

  const tags = useMemo(() => buildTagSet(prompts), [prompts]);

  const filterPrompts = useCallback((query: string, tag: string | null): Prompt[] => {
    return prompts.filter((p) => matchesTag(p, tag) && matchesQuery(p, query));
  }, [prompts]);

  return useMemo(() => {
    return { prompts, tags, loading, createPrompt, updatePrompt, deletePrompt, importFromFile, exportToFile, filterPrompts };
  }, [createPrompt, deletePrompt, exportToFile, filterPrompts, importFromFile, loading, prompts, tags, updatePrompt]);
};
