/**
 * prompt.ts
 * Purpose: Defines prompt library data structures used across the extension.
 * Created: 2026-03-10
 */

/**
 * Prompt library entry
 */
export type Prompt = {
  /** Unique prompt id */
  id: string;
  /** Display title */
  title: string;
  /** Prompt content */
  content: string;
  /** Optional tag list (compatible with legacy data) */
  tags?: string[];
  /** Creation timestamp (ms) */
  createdAt: number;
};
