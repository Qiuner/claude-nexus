/**
 * index.tsx
 * Purpose: FolderManager entry component (JSX + interaction handlers only); reads/updates state via hooks and renders into a portal.
 * Created: 2026-03-09
 */

import type React from 'react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Folder } from '@src/types/folder';
import { useConversations } from '../../hooks/useConversations';
import { useFolders } from '../../hooks/useFolders';
import { getConversationIdFromDragEvent } from '../../utils/dom';
import FolderList from './FolderList';

type ThemeTokens = {
  rootText: string;
  headerText: string;
  mutedText: string;
  subtleText: string;
  border: string;
  panelBg: string;
  hoverBg: string;
  input: string;
  dangerText: string;
  menu: string;
  divider: string;
};

const getThemeTokens = (isDarkTheme: boolean): ThemeTokens => {
  if (isDarkTheme) {
    return {
      rootText: 'text-zinc-200',
      headerText: 'text-zinc-300',
      mutedText: 'text-zinc-400',
      subtleText: 'text-zinc-500',
      border: 'border-zinc-800',
      panelBg: 'bg-zinc-950/30',
      hoverBg: 'hover:bg-zinc-800/70',
      input: 'border-zinc-700 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500 focus:ring-zinc-500',
      dangerText: 'text-red-300',
      menu: 'border-zinc-700 bg-zinc-900/95 text-zinc-100',
      divider: 'bg-zinc-700/60',
    };
  }

  return {
    rootText: 'text-zinc-900',
    headerText: 'text-zinc-700',
    mutedText: 'text-zinc-600',
    subtleText: 'text-zinc-500',
    border: 'border-zinc-200',
    panelBg: 'bg-white/85',
    hoverBg: 'hover:bg-zinc-100',
    input: 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-400',
    dangerText: 'text-red-600',
    menu: 'border-zinc-200 bg-white text-zinc-900',
    divider: 'bg-zinc-200',
  };
};

export default function FolderManager() {
  const { t } = useTranslation();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    conversationId: string;
  } | null>(null);

  const {
    folders,
    allConversationIdsInFolders,
    addFolder,
    renameFolder,
    removeFolder,
    toggleExpanded,
    moveConversationToFolder,
  } = useFolders();

  const { portalContainer, conversationIndex, isDarkTheme } = useConversations({
    hiddenConversationIds: allConversationIdsInFolders,
    onConversationContextMenu: (payload) => setContextMenu(payload),
  });

  const theme = useMemo(() => getThemeTokens(isDarkTheme), [isDarkTheme]);

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateFolder = async () => {
    await addFolder(newFolderName);
    setIsCreatingFolder(false);
    setNewFolderName('');
  };

  const handleRenameStart = (folder: Folder) => {
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
  };

  const handleRenameCommit = (folderId: string) => {
    void (async () => {
      await renameFolder(folderId, editingName);
      setEditingFolderId(null);
      setEditingName('');
    })();
  };

  const handleDeleteFolder = (folderId: string) => {
    const ok = window.confirm(t('folders.deleteConfirm'));
    if (!ok) return;
    void removeFolder(folderId);
  };

  const handleUnfiledDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const conversationId = getConversationIdFromDragEvent(e);
    if (!conversationId) return;
    void moveConversationToFolder(conversationId, null);
  };

  const handleFolderDrop = (folderId: string, conversationId: string) => {
    void moveConversationToFolder(conversationId, folderId);
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  if (!portalContainer) return null;

  return createPortal(
    <div className={`text-xs ${theme.rootText}`}>
      <div className="flex items-center justify-between gap-2">
        <div className={`text-[11px] font-medium ${theme.headerText}`}>{t('folders.title')}</div>
        <button
          type="button"
          className={`rounded px-2 py-1 text-[11px] ${theme.rootText} ${theme.hoverBg}`}
          onClick={() => {
            setIsCreatingFolder((v) => !v);
            setNewFolderName('');
          }}
          aria-label={t('folders.newFolderAria')}
        >
          {t('folders.newButton')}
        </button>
      </div>

      {isCreatingFolder ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className={`w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 ${theme.input}`}
            placeholder={t('folders.folderName')}
            aria-label={t('folders.folderName')}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              void handleCreateFolder();
            }}
            autoFocus
          />
          <button
            type="button"
            className={`rounded px-2 py-1 text-[11px] ${theme.rootText} ${theme.hoverBg}`}
            onClick={() => void handleCreateFolder()}
            aria-label={t('folders.createFolderAria')}
          >
            {t('common.save')}
          </button>
          <button
            type="button"
            className={`rounded px-2 py-1 text-[11px] ${theme.mutedText} ${theme.hoverBg}`}
            onClick={() => {
              setIsCreatingFolder(false);
              setNewFolderName('');
            }}
            aria-label={t('folders.cancelCreateAria')}
          >
            {t('common.cancel')}
          </button>
        </div>
      ) : null}

      <div className="mt-2">
        <div
          className={`rounded border px-2 py-1 text-[11px] ${theme.border} ${theme.panelBg} ${theme.mutedText}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleUnfiledDrop}
          aria-label={t('folders.unfiledDropAria')}
        >
          {t('folders.unfiledLabel')}
        </div>

        <FolderList
          folders={folders}
          theme={theme}
          conversationIndex={conversationIndex}
          editingFolderId={editingFolderId}
          editingName={editingName}
          onEditingNameChange={setEditingName}
          onRenameStart={handleRenameStart}
          onRenameCommit={handleRenameCommit}
          onDelete={handleDeleteFolder}
          onToggleExpanded={(folderId) => void toggleExpanded(folderId)}
          onDropConversationToFolder={handleFolderDrop}
        />
      </div>

      {contextMenu ? (
        <div
          className="fixed inset-0 z-[2147483647]"
          onMouseDown={handleCloseContextMenu}
          aria-label={t('menu.closeAria')}
        >
          <div
            className={`fixed min-w-[220px] rounded border p-1 text-xs shadow-xl ${theme.menu}`}
            style={{ left: contextMenu.x, top: contextMenu.y }}
            data-claude-folio-context-menu="1"
            role="menu"
            aria-label={t('menu.labelAria')}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="sr-only"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Escape') handleCloseContextMenu();
              }}
              aria-label={t('menu.escToCloseAria')}
            />

            <div className={`px-2 py-1 text-[11px] ${theme.mutedText}`}>{t('menu.moveInto')}</div>
            <div className="max-h-[240px] overflow-auto">
              {folders.length === 0 ? (
                <div className={`px-2 py-1 text-[11px] ${theme.subtleText}`}>{t('menu.emptyFolders')}</div>
              ) : (
                folders.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    className={`flex w-full items-center justify-between gap-2 rounded px-2 py-1 text-left ${theme.hoverBg}`}
                    onClick={() => {
                      void (async () => {
                        await moveConversationToFolder(contextMenu.conversationId, f.id);
                        handleCloseContextMenu();
                      })();
                    }}
                    role="menuitem"
                  >
                    <span className="truncate">{f.name}</span>
                    <span className={`text-[11px] ${theme.subtleText}`}>{f.conversationIds.length}</span>
                  </button>
                ))
              )}
            </div>
            <div className={`my-1 h-px ${theme.divider}`} />
            <button
              type="button"
              className={`w-full rounded px-2 py-1 text-left ${theme.rootText} ${theme.hoverBg}`}
              onClick={() => {
                void (async () => {
                  await moveConversationToFolder(contextMenu.conversationId, null);
                  handleCloseContextMenu();
                })();
              }}
              role="menuitem"
            >
              {t('menu.moveOut')}
            </button>
          </div>
        </div>
      ) : null}
    </div>,
    portalContainer,
  );
}

