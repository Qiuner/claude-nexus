/**
 * Wraps chrome.storage.local folder read/write for claude-nexus (no legacy migration).
 */

import type { Folder } from '@src/types/folder';
import { i18n } from '@src/services/i18n';
import { extractConversationIdFromHref } from '../utils/dom';

export const STORAGE_KEY = 'claude_nexus_folders';
export const CONVERSATION_TITLE_CACHE_KEY = 'claude_nexus_conversation_titles';

type StorageOpResult<T> = { ok: true; value: T | undefined } | { ok: false; error: string };
export type ConversationTitleCache = Record<string, string>;

const isDebugEnabled = () => {
  try {
    return window.localStorage.getItem('claude_nexus_debug') === '1';
  } catch {
    return false;
  }
};

const debugLog = (...args: unknown[]) => {
  if (!isDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log('[claude-nexus][storage]', ...args);
};

const debugWarn = (...args: unknown[]) => {
  if (!isDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.warn('[claude-nexus][storage]', ...args);
};

const isContextInvalidatedError = (message: string | undefined) =>
  (message ?? '').toLowerCase().includes('extension context invalidated');

const sanitizeFolderName = (name: string) => name.trim().slice(0, 60);

const normalizeConversationId = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const fromHref = extractConversationIdFromHref(trimmed);
  if (fromHref) return fromHref;
  if (trimmed.length >= 8 && !trimmed.includes('/')) return trimmed;
  return null;
};

export const parseFoldersFromStorageValue = (value: unknown): Folder[] => {
  if (!value || typeof value !== 'object') return [];

  const foldersRaw = Array.isArray(value) ? value : (value as { folders?: unknown }).folders;
  if (!Array.isArray(foldersRaw)) return [];

  const folders: Folder[] = foldersRaw
    .map((f) => {
      if (!f || typeof f !== 'object') return null;
      const folder = f as Partial<Folder>;
      if (!folder.id || typeof folder.id !== 'string') return null;
      if (!folder.name || typeof folder.name !== 'string') return null;

      const conversationIds = Array.isArray(folder.conversationIds)
        ? folder.conversationIds
            .map((id) => normalizeConversationId(id))
            .filter((id): id is string => Boolean(id))
        : [];

      const dedupedConversationIds = Array.from(new Set(conversationIds));

      return {
        id: folder.id,
        name: sanitizeFolderName(folder.name) || i18n.t('storage.unnamedFolder'),
        conversationIds: dedupedConversationIds,
        isExpanded: typeof folder.isExpanded === 'boolean' ? folder.isExpanded : true,
      } satisfies Folder;
    })
    .filter((x): x is Folder => Boolean(x));

  return folders;
};

const storageLocalGet = <T,>(key: string): Promise<StorageOpResult<T>> => {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) return resolve({ ok: false, error: i18n.t('storage.unavailable') });
    try {
      chrome.storage.local.get([key], (result) => {
        const err = chrome.runtime?.lastError;
        if (err) {
          const errMessage = err.message ?? i18n.t('storage.unknownError');
          debugWarn('storage.get failed', key, errMessage);
          if (isContextInvalidatedError(errMessage)) {
            debugWarn(i18n.t('storage.contextInvalidated'));
          }
          return resolve({ ok: false, error: errMessage });
        }

        const value = result?.[key] as T | undefined;
        debugLog('storage.get ok', key, value);
        resolve({ ok: true, value });
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      debugWarn('storage.get exception', key, message);
      if (isContextInvalidatedError(message)) {
        debugWarn(i18n.t('storage.contextInvalidated'));
      }
      resolve({ ok: false, error: message });
    }
  });
};

const storageLocalSet = (key: string, value: unknown): Promise<StorageOpResult<void>> => {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) return resolve({ ok: false, error: i18n.t('storage.unavailable') });
    try {
      chrome.storage.local.set({ [key]: value }, () => {
        const err = chrome.runtime?.lastError;
        if (err) {
          const errMessage = err.message ?? i18n.t('storage.unknownError');
          debugWarn('storage.set failed', key, errMessage);
          if (isContextInvalidatedError(errMessage)) {
            debugWarn(i18n.t('storage.contextInvalidated'));
          }
          return resolve({ ok: false, error: errMessage });
        }

        debugLog('storage.set ok', key);
        resolve({ ok: true, value: undefined });
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      debugWarn('storage.set exception', key, message);
      if (isContextInvalidatedError(message)) {
        debugWarn(i18n.t('storage.contextInvalidated'));
      }
      resolve({ ok: false, error: message });
    }
  });
};

export const getFolders = async (): Promise<Folder[]> => {
  if (!chrome?.storage?.local) return [];

  const current = await storageLocalGet<unknown>(STORAGE_KEY);
  if (current.ok && current.value !== undefined) return parseFoldersFromStorageValue(current.value);
  return [];
};

export const saveFolders = async (folders: Folder[]): Promise<void> => {
  if (!chrome?.storage?.local) return;

  const setRes = await storageLocalSet(STORAGE_KEY, folders);
  if (!setRes.ok) return;

  debugLog('storage.set committed', STORAGE_KEY, { folderCount: folders.length });
  const echoed = await storageLocalGet<unknown>(STORAGE_KEY);
  if (echoed.ok) debugLog('storage readback', STORAGE_KEY, echoed.value);
};

const normalizeConversationTitle = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const parseConversationTitleCache = (value: unknown): ConversationTitleCache => {
  if (!value || typeof value !== 'object') return {};

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([id, title]) => {
      const normalizedId = normalizeConversationId(id);
      const normalizedTitle = normalizeConversationTitle(title);
      if (!normalizedId || !normalizedTitle) return null;
      return [normalizedId, normalizedTitle] as const;
    })
    .filter((entry): entry is readonly [string, string] => Boolean(entry));

  return Object.fromEntries(entries);
};

export const getConversationTitleCache = async (): Promise<ConversationTitleCache> => {
  if (!chrome?.storage?.local) return {};

  const current = await storageLocalGet<unknown>(CONVERSATION_TITLE_CACHE_KEY);
  if (current.ok && current.value !== undefined) return parseConversationTitleCache(current.value);
  return {};
};

export const saveConversationTitleCache = async (cache: ConversationTitleCache): Promise<void> => {
  if (!chrome?.storage?.local) return;

  const sanitized = parseConversationTitleCache(cache);
  const setRes = await storageLocalSet(CONVERSATION_TITLE_CACHE_KEY, sanitized);
  if (!setRes.ok) return;

  debugLog('storage.set committed', CONVERSATION_TITLE_CACHE_KEY, { titleCount: Object.keys(sanitized).length });
};
