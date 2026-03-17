/**
 * Renders a single folder row and its conversation list (pure UI).
 */

import type React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronRight, Pencil, Trash2 } from 'lucide-react';
import type { Conversation } from '@src/types/conversation';
import type { Folder } from '@src/types/folder';
import { getConversationIdFromDragEvent } from '../../utils/dom';

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
};

type Props = {
  folder: Folder;
  theme: ThemeTokens;
  conversationIndex: Record<string, Conversation>;
  isEditing: boolean;
  editingName: string;
  onEditingNameChange: (value: string) => void;
  onRenameStart: (folder: Folder) => void;
  onRenameCommit: (folderId: string) => void;
  onDelete: (folderId: string, anchorRect: DOMRect) => void;
  onToggleExpanded: (folderId: string) => void;
  onDropConversationToFolder: (folderId: string, conversationId: string) => void;
};

export default function FolderItem({
  folder,
  theme,
  conversationIndex,
  isEditing,
  editingName,
  onEditingNameChange,
  onRenameStart,
  onRenameCommit,
  onDelete,
  onToggleExpanded,
  onDropConversationToFolder,
}: Props) {
  const { t } = useTranslation();
  const count = folder.conversationIds.length;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const conversationId = getConversationIdFromDragEvent(e);
    if (!conversationId) return;
    onDropConversationToFolder(folder.id, conversationId);
  };

  const renderConversationLink = (conversationId: string) => {
    const meta = conversationIndex[conversationId];
    const href = meta?.href || `/chat/${conversationId}`;
    const title = meta?.title || t('conversation.fallbackTitle', { id: conversationId.slice(0, 8) });

    return (
      <a
        key={conversationId}
        href={href}
        className={`block truncate rounded-md pl-8 pr-2 py-1.5 text-sm transition-colors ${theme.rootText} ${theme.hoverBg}`}
        tabIndex={0}
        aria-label={t('conversation.openAria', { title })}
      >
        {title}
      </a>
    );
  };

  return (
    <div
      className="group flex flex-col"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      aria-label={t('folderItem.folderAria', { name: folder.name })}
    >
      <div 
        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors cursor-pointer ${theme.hoverBg}`}
        onClick={() => onToggleExpanded(folder.id)}
      >
        <button
          type="button"
          className={`shrink-0 rounded p-0.5 transition-colors ${theme.icon} ${theme.iconHoverBg}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpanded(folder.id);
          }}
          aria-label={folder.isExpanded ? t('folderItem.collapse') : t('folderItem.expand')}
        >
          {folder.isExpanded ? <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" /> : <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />}
        </button>

        {isEditing ? (
          <input
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            className={`w-full rounded-md border px-2 py-1 text-sm focus:outline-none focus:ring-1 ${theme.input}`}
            aria-label={t('folderItem.renameAria')}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              onRenameCommit(folder.id);
            }}
            onBlur={() => onRenameCommit(folder.id)}
            autoFocus
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <div className="min-w-0 flex-1">
            <div className={`truncate text-sm font-medium ${theme.rootText}`}>{folder.name}</div>
          </div>
        )}

        <div className={`shrink-0 text-xs ${theme.mutedText}`}>{count}</div>

        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          <button
            type="button"
            className={`rounded p-1 transition-colors ${theme.icon} ${theme.iconHoverBg}`}
            onClick={(e) => {
              e.stopPropagation();
              onRenameStart(folder);
            }}
            aria-label={t('folderItem.renameAria')}
            title={t('common.rename')}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`rounded p-1 transition-colors ${theme.iconDanger} ${theme.iconHoverBg}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(folder.id, e.currentTarget.getBoundingClientRect());
            }}
            aria-label={t('folderItem.deleteAria')}
            title={t('common.delete')}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {folder.isExpanded ? (
        <div className="mt-[2px] pb-1">
          {folder.conversationIds.length === 0 ? (
            <div className={`px-8 py-1.5 text-xs ${theme.subtleText}`}>{t('folderItem.dropHint')}</div>
          ) : (
            <div className="space-y-[2px]">{folder.conversationIds.map(renderConversationLink)}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

