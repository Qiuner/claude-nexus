/**
 * Centralizes FolderManager floating UI like popovers and context menus.
 */

import type React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { Folder } from '@src/types/folder';

type ThemeTokens = {
  rootText: string;
  mutedText: string;
  subtleText: string;
  border: string;
  hoverBg: string;
  menu: string;
  divider: string;
};

type DeleteTarget = { folderId: string; anchorRect: DOMRect };

type FolderManagerModalsProps = {
  folders: Folder[];
  isDarkTheme: boolean;
  theme: ThemeTokens;
  contextMenu: { x: number; y: number; conversationId: string } | null;
  onContextMenuClose: () => void;
  onMoveConversationToFolder: (conversationId: string, folderId: string | null) => Promise<void>;
  deleteTarget: DeleteTarget | null;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
};

export function FolderManagerModals({
  folders,
  isDarkTheme,
  theme,
  contextMenu,
  onContextMenuClose,
  onMoveConversationToFolder,
  deleteTarget,
  onDeleteConfirm,
  onDeleteCancel,
}: FolderManagerModalsProps) {
  const { t } = useTranslation();
  const deletePopoverWidth = 320;
  const deletePopoverHeight = 168;

  return (
    <>
      {contextMenu ? (
        <div
          className="fixed inset-0 z-[2147483647]"
          onMouseDown={onContextMenuClose}
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
                if (e.key === 'Escape') onContextMenuClose();
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
                        await onMoveConversationToFolder(contextMenu.conversationId, f.id);
                        onContextMenuClose();
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
                  await onMoveConversationToFolder(contextMenu.conversationId, null);
                  onContextMenuClose();
                })();
              }}
              role="menuitem"
            >
              {t('menu.moveOut')}
            </button>
          </div>
        </div>
      ) : null}

      {deleteTarget
        ? createPortal(
            <div className="fixed inset-0 z-[2147483647]" onMouseDown={onDeleteCancel}>
              <div
                className={`fixed rounded-xl border p-4 pb-4 text-xs shadow-xl transition-all duration-150 ${theme.menu}`}
                style={{
                  width: deletePopoverWidth,
                  left: Math.min(
                    Math.max(8, deleteTarget.anchorRect.right - deletePopoverWidth),
                    Math.max(8, window.innerWidth - 8 - deletePopoverWidth),
                  ),
                  top:
                    deleteTarget.anchorRect.bottom + 8 + deletePopoverHeight <= window.innerHeight - 8
                      ? deleteTarget.anchorRect.bottom + 8
                      : Math.max(8, deleteTarget.anchorRect.top - 8 - deletePopoverHeight),
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
                    onClick={onDeleteCancel}
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
                    onClick={onDeleteConfirm}
                  >
                    {t('common.delete')}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

