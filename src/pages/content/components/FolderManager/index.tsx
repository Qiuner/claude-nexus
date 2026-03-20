/**
 * Connects FolderManager hooks and composes the UI components (no modal JSX).
 */

import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import type { Folder } from '@src/types/folder';
import { useConversations } from '../../hooks/useConversations';
import { useFolders } from '../../hooks/useFolders';
import { useSidebarOpen } from '../../hooks/useSidebarOpen';
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
      headerText: 'text-zinc-400',
      mutedText: 'text-zinc-500',
      subtleText: 'text-zinc-600',
      border: 'border-white/10',
      panelBg: 'bg-transparent',
      hoverBg: 'hover:bg-white/5',
      input: 'border-white/10 bg-black/20 text-zinc-200 placeholder:text-zinc-600 focus:border-white/20 focus:ring-0',
      icon: 'text-zinc-500 hover:text-zinc-300',
      iconDanger: 'text-zinc-500 hover:text-red-400',
      iconHoverBg: 'hover:bg-white/10',
      menu: 'border-white/10 bg-zinc-900 text-zinc-200',
      divider: 'bg-white/10',
    };
  }

  return {
    rootText: 'text-stone-800',
    headerText: 'text-stone-500',
    mutedText: 'text-stone-400',
    subtleText: 'text-stone-300',
    border: 'border-black/5',
    panelBg: 'bg-transparent',
    hoverBg: 'hover:bg-black/5',
    input: 'border-black/10 bg-white/50 text-stone-800 placeholder:text-stone-400 focus:border-black/20 focus:ring-0',
    icon: 'text-stone-400 hover:text-stone-700',
    iconDanger: 'text-stone-400 hover:text-red-600',
    iconHoverBg: 'hover:bg-black/5',
    menu: 'border-black/5 bg-white text-stone-800',
    divider: 'bg-black/5',
  };
};

export default function FolderManager() {
  const { t } = useTranslation();
  const isSidebarOpen = useSidebarOpen();
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
  const handleConversationContextMenu = (payload: { x: number; y: number; conversationId: string }) => setContextMenu(payload);

  const { portalContainer, conversationIndex, isDarkTheme } = useConversations({
    hiddenConversationIds: allConversationIdsInFolders,
    onConversationContextMenu: handleConversationContextMenu,
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

  const handleFolderDrop = (folderId: string, conversationId: string) => {
    void moveConversationToFolder(conversationId, folderId);
  };

  const handleCloseContextMenu = () => setContextMenu(null);

  if (!isSidebarOpen) return null;
  if (!portalContainer) return null;

  return createPortal(
    <div className={`text-sm ${theme.rootText}`}>
      <div className="flex items-center justify-between px-2 py-1 mb-1">
        <div className={`text-xs font-medium ${theme.headerText}`}>{t('folders.title')}</div>
        <button
          type="button"
          className={`rounded-md p-1 transition-colors ${theme.icon} ${theme.iconHoverBg}`}
          onClick={() => {
            setIsCreatingFolder((v) => !v);
            setNewFolderName('');
          }}
          aria-label={t('folders.newFolderAria')}
          title={t('folders.newFolderAria')}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {isCreatingFolder ? (
        <div className="mb-2 flex items-center gap-2 px-2">
          <input
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className={`w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 ${theme.input}`}
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
            className={`rounded-md px-2 py-1 text-xs transition-colors ${theme.rootText} ${theme.hoverBg}`}
            onClick={() => void handleCreateFolder()}
            aria-label={t('folders.createFolderAria')}
          >
            {t('common.save')}
          </button>
          <button
            type="button"
            className={`rounded-md px-2 py-1 text-xs transition-colors ${theme.mutedText} ${theme.hoverBg}`}
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

      <div className="mt-1">
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
          onConversationContextMenu={handleConversationContextMenu}
        />
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

