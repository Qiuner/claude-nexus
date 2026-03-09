/**
 * index.tsx
 * Purpose: FolderManager entry component (JSX + interaction handlers only); reads/updates state via hooks and renders into a portal.
 * Created: 2026-03-09
 */

import type React from 'react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
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
  icon: string;
  iconDanger: string;
  iconHoverBg: string;
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
      panelBg: 'bg-transparent',
      hoverBg: 'hover:bg-zinc-800/60',
      input: 'border-zinc-700 bg-zinc-900/60 text-zinc-100 placeholder:text-zinc-500 focus:ring-zinc-500',
      icon: 'text-zinc-500 hover:text-zinc-200',
      iconDanger: 'text-zinc-500 hover:text-red-300',
      iconHoverBg: 'hover:bg-zinc-800/60',
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
    panelBg: 'bg-transparent',
    hoverBg: 'hover:bg-zinc-100/80',
    input: 'border-zinc-300 bg-white text-zinc-900 placeholder:text-zinc-400 focus:ring-zinc-400',
    icon: 'text-zinc-500 hover:text-zinc-900',
    iconDanger: 'text-zinc-500 hover:text-red-600',
    iconHoverBg: 'hover:bg-zinc-100/80',
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
  const deletePopoverWidth = 320;
  const deletePopoverHeight = 168;

  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<{ folderId: string; anchorRect: DOMRect } | null>(null);

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

  const handleDeleteFolder = (folderId: string, anchorRect: DOMRect) => {
    setPendingDelete({ folderId, anchorRect });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    void removeFolder(pendingDelete.folderId);
    setPendingDelete(null);
  };

  const cancelDelete = () => {
    setPendingDelete(null);
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
    <div className={`text-[12px] leading-4 ${theme.rootText}`}>
      <div className="flex items-center justify-between gap-2">
        <div className={`text-xs font-medium ${theme.headerText}`}>{t('folders.title')}</div>
        <button
          type="button"
          className={`rounded p-1 transition-all duration-150 ${theme.icon} ${theme.iconHoverBg}`}
          onClick={() => {
            setIsCreatingFolder((v) => !v);
            setNewFolderName('');
          }}
          aria-label={t('folders.newFolderAria')}
          title={t('folders.newFolderAria')}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
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

        <div
          className={`rounded border border-dashed bg-transparent px-2 py-1 text-[10px] transition-all duration-150 ${theme.border} ${theme.subtleText} ${theme.hoverBg}`}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleUnfiledDrop}
          aria-label={t('folders.unfiledDropAria')}
        >
          {t('folders.unfiledLabel')}
        </div>
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

      {pendingDelete
        ? createPortal(
            <div className="fixed inset-0 z-[2147483647]" onMouseDown={cancelDelete}>
              <div
                className={`fixed rounded-xl border p-4 pb-4 text-xs shadow-xl transition-all duration-150 ${theme.menu}`}
                style={{
                  width: deletePopoverWidth,
                  left: Math.min(
                    Math.max(8, pendingDelete.anchorRect.right - deletePopoverWidth),
                    Math.max(8, window.innerWidth - 8 - deletePopoverWidth),
                  ),
                  top:
                    pendingDelete.anchorRect.bottom + 8 + deletePopoverHeight <= window.innerHeight - 8
                      ? pendingDelete.anchorRect.bottom + 8
                      : Math.max(8, pendingDelete.anchorRect.top - 8 - deletePopoverHeight),
                }}
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-folder-title"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div id="delete-folder-title" className={`mb-2 text-[13px] font-medium ${theme.rootText}`}>
                  {t('folders.deleteTitle')}
                </div>
                <div className={`mb-4 text-[12px] ${theme.mutedText}`}>{t('folders.deleteConfirm')}</div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className={`rounded border px-3 py-1.5 text-[12px] font-medium transition-all duration-150 ${theme.border} ${theme.rootText} ${theme.hoverBg}`}
                    onClick={cancelDelete}
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="button"
                    className={`rounded border px-3 py-1.5 text-[12px] font-medium transition-all duration-150 ${
                      isDarkTheme
                        ? 'border-red-900/60 text-red-300 hover:bg-red-900/30'
                        : 'border-red-200 text-red-600 hover:bg-red-50'
                    }`}
                    onClick={confirmDelete}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>,
    portalContainer,
  );
}

