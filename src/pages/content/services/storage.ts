/**
 * storage.ts
 * Purpose: Wraps chrome.storage.local folder read/write and legacy key migration (no React).
 * Created: 2026-03-09
 */

import type { Folder } from '@src/types/folder';
import { i18n } from '@src/services/i18n';

export const STORAGE_KEY = 'claude_folio_folders';
const LEGACY_STORAGE_KEY = 'folderStore';

type StorageOpResult<T> = { ok: true; value: T | undefined } | { ok: false; error: string };

const isDebugEnabled = () => {
  try {
    return window.localStorage.getItem('claude_folio_debug') === '1';
  } catch {
    return false;
  }
};

const debugLog = (...args: unknown[]) => {
  if (!isDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.log('[claude-folio][storage]', ...args);
};

const debugWarn = (...args: unknown[]) => {
  if (!isDebugEnabled()) return;
  // eslint-disable-next-line no-console
  console.warn('[claude-folio][storage]', ...args);
};

const isContextInvalidatedError = (message: string | undefined) =>
  (message ?? '').toLowerCase().includes('extension context invalidated');

const sanitizeFolderName = (name: string) => name.trim().slice(0, 60);

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
        ? folder.conversationIds.filter((id): id is string => typeof id === 'string' && id.length > 0)
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

  const legacy = await storageLocalGet<unknown>(LEGACY_STORAGE_KEY);
  const migrated = legacy.ok ? parseFoldersFromStorageValue(legacy.value) : [];
  if (migrated.length > 0) {
    await storageLocalSet(STORAGE_KEY, migrated);
  }

  return migrated;
};

export const saveFolders = async (folders: Folder[]): Promise<void> => {
  if (!chrome?.storage?.local) return;

  const setRes = await storageLocalSet(STORAGE_KEY, folders);
  if (!setRes.ok) return;

  debugLog('storage.set committed', STORAGE_KEY, { folderCount: folders.length });
  const echoed = await storageLocalGet<unknown>(STORAGE_KEY);
  if (echoed.ok) debugLog('storage readback', STORAGE_KEY, echoed.value);
};
