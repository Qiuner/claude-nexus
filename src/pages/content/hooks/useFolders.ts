/**
 * useFolders.ts
 * Purpose: Manages folder CRUD and conversation filing state, persisted to chrome.storage.local (no JSX).
 * Created: 2026-03-09
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Folder } from '@src/types/folder';
import { getFolders, parseFoldersFromStorageValue, saveFolders, STORAGE_KEY } from '@pages/content/services/storage';

const generateId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
};

const sanitizeFolderName = (name: string) => name.trim().slice(0, 60);

export const useFolders = () => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const foldersRef = useRef(folders);

  useEffect(() => {
    foldersRef.current = folders;
  }, [folders]);

  useEffect(() => {
    void (async () => {
      const loaded = await getFolders();
      setFolders(loaded);
    })();

    const handleChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== 'local') return;
      if (!changes?.[STORAGE_KEY]) return;
      const next = parseFoldersFromStorageValue(changes[STORAGE_KEY].newValue);
      setFolders(next);
    };

    chrome?.storage?.onChanged?.addListener(handleChanged);
    return () => chrome?.storage?.onChanged?.removeListener(handleChanged);
  }, []);

  const allConversationIdsInFolders = useMemo(() => {
    const ids = new Set<string>();
    for (const f of folders) for (const id of f.conversationIds) ids.add(id);
    return ids;
  }, [folders]);

  const persist = async (nextFolders: Folder[]) => {
    setFolders(nextFolders);
    await saveFolders(nextFolders);
  };

  const addFolder = async (name: string) => {
    const sanitized = sanitizeFolderName(name);
    if (!sanitized) return;

    const nextFolders: Folder[] = [
      ...foldersRef.current,
      { id: generateId(), name: sanitized, conversationIds: [], isExpanded: true },
    ];

    await persist(nextFolders);
  };

  const renameFolder = async (folderId: string, name: string) => {
    const sanitized = sanitizeFolderName(name);
    if (!sanitized) return;

    const nextFolders = foldersRef.current.map((f) => (f.id === folderId ? { ...f, name: sanitized } : f));
    await persist(nextFolders);
  };

  const removeFolder = async (folderId: string) => {
    const nextFolders = foldersRef.current.filter((f) => f.id !== folderId);
    await persist(nextFolders);
  };

  const toggleExpanded = async (folderId: string) => {
    const nextFolders = foldersRef.current.map((f) => (f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f));
    await persist(nextFolders);
  };

  const moveConversationToFolder = async (conversationId: string, folderId: string | null) => {
    if (!conversationId) return;

    const foldersWithout = foldersRef.current.map((f) => ({
      ...f,
      conversationIds: f.conversationIds.filter((id) => id !== conversationId),
    }));

    const nextFolders =
      folderId === null
        ? foldersWithout
        : foldersWithout.map((f) =>
            f.id === folderId
              ? { ...f, conversationIds: Array.from(new Set([...f.conversationIds, conversationId])) }
              : f,
          );

    await persist(nextFolders);
  };

  return {
    folders,
    allConversationIdsInFolders,
    addFolder,
    renameFolder,
    removeFolder,
    toggleExpanded,
    moveConversationToFolder,
  };
};

