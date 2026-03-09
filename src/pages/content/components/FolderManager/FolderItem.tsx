/**
 * FolderItem.tsx
 * Purpose: Renders a single folder row (title, expand/collapse, rename, delete, drop target, and conversation list).
 * Created: 2026-03-09
 */

import type React from 'react';
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
  dangerText: string;
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
  onDelete: (folderId: string) => void;
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
    const title = meta?.title || `对话 ${conversationId.slice(0, 8)}`;

    return (
      <a
        key={conversationId}
        href={href}
        className={`block truncate rounded px-2 py-1 text-xs ${theme.rootText} ${theme.hoverBg}`}
        tabIndex={0}
        aria-label={`打开对话：${title}`}
      >
        {title}
      </a>
    );
  };

  return (
    <div
      className={`rounded border ${theme.border} ${theme.panelBg}`}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      aria-label={`文件夹：${folder.name}`}
    >
      <div className="flex items-center gap-2 px-2 py-1">
        <button
          type="button"
          className={`shrink-0 rounded px-1 py-0.5 text-[11px] ${theme.headerText} ${theme.hoverBg}`}
          onClick={() => onToggleExpanded(folder.id)}
          aria-label={folder.isExpanded ? '折叠文件夹' : '展开文件夹'}
        >
          {folder.isExpanded ? '▾' : '▸'}
        </button>

        {isEditing ? (
          <input
            value={editingName}
            onChange={(e) => onEditingNameChange(e.target.value)}
            className={`w-full rounded border px-2 py-1 text-xs focus:outline-none focus:ring-1 ${theme.input}`}
            aria-label="重命名文件夹"
            onKeyDown={(e) => {
              if (e.key !== 'Enter') return;
              onRenameCommit(folder.id);
            }}
            onBlur={() => onRenameCommit(folder.id)}
            autoFocus
          />
        ) : (
          <div className="min-w-0 flex-1">
            <div className={`truncate text-xs ${theme.rootText}`}>{folder.name}</div>
          </div>
        )}

        <div className={`shrink-0 text-[11px] ${theme.mutedText}`}>{count}</div>

        <button
          type="button"
          className={`shrink-0 rounded px-2 py-1 text-[11px] ${theme.headerText} ${theme.hoverBg}`}
          onClick={() => onRenameStart(folder)}
          aria-label="重命名文件夹"
        >
          重命名
        </button>
        <button
          type="button"
          className={`shrink-0 rounded px-2 py-1 text-[11px] ${theme.dangerText} ${theme.hoverBg}`}
          onClick={() => onDelete(folder.id)}
          aria-label="删除文件夹"
        >
          删除
        </button>
      </div>

      {folder.isExpanded ? (
        <div className="px-1 pb-1">
          {folder.conversationIds.length === 0 ? (
            <div className={`px-2 py-1 text-[11px] ${theme.subtleText}`}>拖拽对话到此文件夹</div>
          ) : (
            <div className="space-y-0.5">{folder.conversationIds.map(renderConversationLink)}</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

