/**
 * folder.ts
 * Purpose: Defines cross-layer shared folder types (types only; no runtime code).
 * Created: 2026-03-09
 */

export type Folder = {
  id: string;
  name: string;
  conversationIds: string[];
  isExpanded: boolean;
};

export type FolderStore = {
  folders: Folder[];
};

