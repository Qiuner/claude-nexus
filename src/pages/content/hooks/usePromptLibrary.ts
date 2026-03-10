/**
 * usePromptLibrary.ts
 * Purpose: Provides CRUD operations for the prompt library backed by chrome.storage.local.
 * Created: 2026-03-10
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Prompt } from '@src/types/prompt';
import { readStoredPromptLibrary, writeStoredPromptLibrary } from '@src/services/storage';

type PromptDraft = {
  title: string;
  content: string;
};

type PromptLibraryApi = {
  prompts: Prompt[];
  loading: boolean;
  createPrompt: (draft: PromptDraft) => Promise<Prompt>;
  updatePrompt: (id: string, draft: PromptDraft) => Promise<Prompt | null>;
  deletePrompt: (id: string) => Promise<boolean>;
};

const normalizeDraft = (draft: PromptDraft): PromptDraft => {
  return {
    title: draft.title.trim(),
    content: draft.content.trim(),
  };
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
    const prompt: Prompt = { id: generateId(), title: normalized.title, content: normalized.content, createdAt: Date.now() };
    const next = [prompt, ...prompts];
    await persist(next);
    return prompt;
  }, [persist, prompts]);

  const updatePrompt = useCallback(async (id: string, draft: PromptDraft): Promise<Prompt | null> => {
    const index = prompts.findIndex((p) => p.id === id);
    if (index < 0) return null;
    const normalized = normalizeDraft(draft);
    const updated: Prompt = { ...prompts[index], title: normalized.title, content: normalized.content };
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

  return useMemo(() => {
    return { prompts, loading, createPrompt, updatePrompt, deletePrompt };
  }, [createPrompt, deletePrompt, loading, prompts, updatePrompt]);
};

