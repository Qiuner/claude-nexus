/**
 * exportTypes.ts
 * Purpose: Shared types for conversation export (extractors/formatters/hooks).
 * Created: 2026-03-10
 */

export type ExportRole = 'user' | 'assistant';

export type ExportMessage = {
  role: ExportRole;
  content: string;
};

export type ExportPayload = {
  messages: ExportMessage[];
  exportedAt: string;
};

export type ExportExtractionResult = {
  messages: ExportMessage[];
  failedMessages: number;
};

