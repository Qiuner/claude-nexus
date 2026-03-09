/**
 * FolderList.tsx
 * Purpose: Renders the folder list (UI composition only; no business state).
 * Created: 2026-03-09
 */

import type { Conversation } from '@src/types/conversation';
import type { Folder } from '@src/types/folder';
import FolderItem from './FolderItem';

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
  folders: Folder[];
  theme: ThemeTokens;
  conversationIndex: Record<string, Conversation>;
  editingFolderId: string | null;
  editingName: string;
  onEditingNameChange: (value: string) => void;
  onRenameStart: (folder: Folder) => void;
  onRenameCommit: (folderId: string) => void;
  onDelete: (folderId: string, anchorRect: DOMRect) => void;
  onToggleExpanded: (folderId: string) => void;
  onDropConversationToFolder: (folderId: string, conversationId: string) => void;
};

const FolderList = ({
  folders,
  theme,
  conversationIndex,
  editingFolderId,
  editingName,
  onEditingNameChange,
  onRenameStart,
  onRenameCommit,
  onDelete,
  onToggleExpanded,
  onDropConversationToFolder,
}: Props) => {
  return (
    <div className="mt-1 space-y-1">
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          theme={theme}
          conversationIndex={conversationIndex}
          isEditing={editingFolderId === folder.id}
          editingName={editingName}
          onEditingNameChange={onEditingNameChange}
          onRenameStart={onRenameStart}
          onRenameCommit={onRenameCommit}
          onDelete={onDelete}
          onToggleExpanded={onToggleExpanded}
          onDropConversationToFolder={onDropConversationToFolder}
        />
      ))}
    </div>
  );
};

export default FolderList;

