/**
 * Connects FolderManager hooks and composes the UI components (no modal JSX).
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
import { FolderManagerModals } from './FolderManagerModals';

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

      <FolderManagerModals
        folders={folders}
        isDarkTheme={isDarkTheme}
        theme={theme}
        contextMenu={contextMenu}
        onContextMenuClose={handleCloseContextMenu}
        onMoveConversationToFolder={(conversationId, folderId) => moveConversationToFolder(conversationId, folderId)}
        deleteTarget={pendingDelete}
        onDeleteConfirm={confirmDelete}
        onDeleteCancel={cancelDelete}
      />
    </div>,
    portalContainer,
  );
}

