/**
 * FolderItem.tsx
 * Purpose: Renders a single folder row (title, expand/collapse, rename, delete, drop target, and conversation list).
 * Created: 2026-03-09
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
        className={`block truncate rounded px-2 py-1 text-xs ${theme.rootText} ${theme.hoverBg}`}
        tabIndex={0}
        aria-label={t('conversation.openAria', { title })}
      >
        {title}
      </a>
    );
  };

  return (
    <div
      className={`group rounded-md transition-all duration-150 ${theme.hoverBg}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      aria-label={t('folderItem.folderAria', { name: folder.name })}
    >
      <div className="flex items-center gap-2 px-2 py-1">
        <button
          type="button"
          className={`shrink-0 rounded p-1 transition-all duration-150 ${theme.icon} ${theme.iconHoverBg}`}
          onClick={() => onToggleExpanded(folder.id)}
          aria-label={folder.isExpanded ? t('folderItem.collapse') : t('folderItem.expand')}
        >
          {folder.isExpanded ? <ChevronDown className="h-4 w-4" aria-hidden="true" /> : <ChevronRight className="h-4 w-4" aria-hidden="true" />}
        </button>

        {isEditing ? (
          <input
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            className={`w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 ${theme.input}`}
            aria-label={t('folderItem.renameAria')}
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              onRenameCommit(folder.id);
            }}
            onBlur={() => onRenameCommit(folder.id)}
            autoFocus
          />
        ) : (
          <div className="min-w-0 flex-1">
            <div className={`truncate text-[13px] ${theme.rootText}`}>{folder.name}</div>
          </div>
        )}

        <div className={`shrink-0 text-[11px] ${theme.mutedText}`}>{count}</div>

        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-all duration-150 group-hover:opacity-100">
          <button
            type="button"
            className={`rounded p-1 transition-all duration-150 ${theme.icon} ${theme.iconHoverBg}`}
            onClick={() => onRenameStart(folder)}
            aria-label={t('folderItem.renameAria')}
            title={t('common.rename')}
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={`rounded p-1 transition-all duration-150 ${theme.iconDanger} ${theme.iconHoverBg}`}
            onClick={(e) => onDelete(folder.id, e.currentTarget.getBoundingClientRect())}
            aria-label={t('folderItem.deleteAria')}
            title={t('common.delete')}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {folder.isExpanded ? (
        <div className="px-1 pb-1">
          {folder.conversationIds.length === 0 ? (
            <div className={`px-2 py-1 text-[10px] ${theme.subtleText}`}>{t('folderItem.dropHint')}</div>
          ) : (
            <div className="space-y-0.5">{folder.conversationIds.map(renderConversationLink)}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

