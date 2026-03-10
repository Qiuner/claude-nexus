/**
 * storage.ts
 * Purpose: Typed wrappers around chrome.storage.local with runtime-safe parsing.
 * Last updated: 2026-03-10
 */

import type { Prompt } from '@src/types/prompt';

export const CHAT_WIDTH_STORAGE_KEY = 'chatWidth';
export const FLOAT_BALL_POSITION_STORAGE_KEY = 'floatBallPosition';
export const PROMPT_LIBRARY_STORAGE_KEY = 'promptLibrary';

const parseChatWidth = (value: unknown): number | undefined => {
  if (typeof value !== 'number' || Number.isNaN(value) || !Number.isFinite(value)) return undefined;
  return value;
};

type FloatBallPosition = { x: number; y: number };

const parseFloatBallPosition = (value: unknown): FloatBallPosition | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Partial<FloatBallPosition>;
  if (typeof v.x !== 'number' || Number.isNaN(v.x) || !Number.isFinite(v.x)) return undefined;
  if (typeof v.y !== 'number' || Number.isNaN(v.y) || !Number.isFinite(v.y)) return undefined;
  return { x: v.x, y: v.y };
};

const parsePrompt = (value: unknown): Prompt | undefined => {
  if (!value || typeof value !== 'object') return undefined;
  const v = value as Partial<Prompt>;
  if (typeof v.id !== 'string' || !v.id) return undefined;
  if (typeof v.title !== 'string') return undefined;
  if (typeof v.content !== 'string') return undefined;
  if (typeof v.createdAt !== 'number' || Number.isNaN(v.createdAt) || !Number.isFinite(v.createdAt)) return undefined;
  return { id: v.id, title: v.title, content: v.content, createdAt: v.createdAt };
};

const parsePromptLibrary = (value: unknown): Prompt[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const parsed = value.map(parsePrompt).filter((v): v is Prompt => Boolean(v));
  if (parsed.length !== value.length) return undefined;
  return parsed;
};

/**
 * Reads chat width override from local storage.
 * @returns Promise<number | undefined>
 *
 * Modification Notes:
 *   - 2026-03-10 Added documentation and clarified return value.
 */
export const readStoredChatWidth = async (): Promise<number | undefined> => {
  try {
    if (!chrome?.storage?.local) return undefined;
    const result = await new Promise<Record<string, unknown>>((resolve) => {
      chrome.storage.local.get([CHAT_WIDTH_STORAGE_KEY], (value) => resolve(value || {}));
    });
    return parseChatWidth(result[CHAT_WIDTH_STORAGE_KEY]);
  } catch {
    return undefined;
  }
};

/**
 * Persists chat width override to local storage.
 * @param chatWidth number
 * @returns Promise<void>
 *
 * Modification Notes:
 *   - 2026-03-10 Added documentation and clarified behavior in non-extension environments.
 */
export const writeStoredChatWidth = async (chatWidth: number): Promise<void> => {
  try {
    if (!chrome?.storage?.local) return;
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [CHAT_WIDTH_STORAGE_KEY]: chatWidth }, () => resolve());
    });
  } catch {
    return;
  }
};

/**
 * Reads the stored floating ball position.
 * @returns Promise<{x:number; y:number} | undefined>
 *
 * Modification Notes:
 *   - 2026-03-10 Added documentation and clarified return value.
 */
export const readStoredFloatBallPosition = async (): Promise<FloatBallPosition | undefined> => {
  try {
    if (!chrome?.storage?.local) return undefined;
    const result = await new Promise<Record<string, unknown>>((resolve) => {
      chrome.storage.local.get([FLOAT_BALL_POSITION_STORAGE_KEY], (value) => resolve(value || {}));
    });
    return parseFloatBallPosition(result[FLOAT_BALL_POSITION_STORAGE_KEY]);
  } catch {
    return undefined;
  }
};

/**
 * Persists the floating ball position to local storage.
 * @param position { x: number; y: number }
 * @returns Promise<void>
 *
 * Modification Notes:
 *   - 2026-03-10 Added documentation and clarified behavior in non-extension environments.
 */
export const writeStoredFloatBallPosition = async (position: FloatBallPosition): Promise<void> => {
  try {
    if (!chrome?.storage?.local) return;
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [FLOAT_BALL_POSITION_STORAGE_KEY]: position }, () => resolve());
    });
  } catch {
    return;
  }
};

/**
 * Reads the persisted prompt library list.
 * @returns Promise<Prompt[] | undefined>
 *
 * Modification Notes:
 *   - 2026-03-10 Added prompt library storage support.
 */
export const readStoredPromptLibrary = async (): Promise<Prompt[] | undefined> => {
  try {
    if (!chrome?.storage?.local) return undefined;
    const result = await new Promise<Record<string, unknown>>((resolve) => {
      chrome.storage.local.get([PROMPT_LIBRARY_STORAGE_KEY], (value) => resolve(value || {}));
    });
    return parsePromptLibrary(result[PROMPT_LIBRARY_STORAGE_KEY]);
  } catch {
    return undefined;
  }
};

/**
 * Persists the prompt library list.
 * @param prompts Prompt[]
 * @returns Promise<void>
 *
 * Modification Notes:
 *   - 2026-03-10 Added prompt library storage support.
 */
export const writeStoredPromptLibrary = async (prompts: Prompt[]): Promise<void> => {
  try {
    if (!chrome?.storage?.local) return;
    await new Promise<void>((resolve) => {
      chrome.storage.local.set({ [PROMPT_LIBRARY_STORAGE_KEY]: prompts }, () => resolve());
    });
  } catch {
    return;
  }
};
