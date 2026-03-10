/**
 * useWidthControl.ts
 * Purpose: Controls Claude chat container width by injecting an override style tag.
 * Last updated: 2026-03-10
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { readStoredChatWidth, writeStoredChatWidth } from '@src/services/storage';

type WidthControlApi = {
  chatWidth: number;
  setChatWidth: (widthRem: number) => void;
};

const MIN_CHAT_WIDTH_REM = 38;
const MAX_CHAT_WIDTH_REM = 90;
const DEFAULT_CHAT_WIDTH_REM = 48;

const STYLE_ID = 'claude-nexus-width-override';
const STYLE_CHECK_INTERVAL_MS = 500;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Builds the CSS override used to widen/narrow the chat container.
 * Note: selectors may break if claude.ai changes its DOM/classnames.
 */
const buildOverrideCss = (widthRem: number) => {
  return `
div.mx-auto.flex.size-full.max-w-3xl.flex-col,
div.flex-1.flex.flex-col.px-4.max-w-3xl.mx-auto.w-full.pt-1 {
  max-width: ${widthRem}rem !important;
}
`.trim();
};

/**
 * Ensures the override <style> exists and contains the expected CSS text.
 */
const ensureStyleTag = (cssText: string) => {
  const head = document.head;
  if (!head) return;

  const existing = document.getElementById(STYLE_ID);
  if (existing && existing instanceof HTMLStyleElement) {
    if (existing.textContent !== cssText) existing.textContent = cssText;
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = cssText;
  head.appendChild(style);
};

/**
 * Width control hook
 * @returns WidthControlApi
 *
 * Modification Notes:
 *   - 2026-03-10 Added file-level and function-level documentation.
 */
export const useWidthControl = (): WidthControlApi => {
  const [chatWidth, setChatWidthState] = useState<number>(DEFAULT_CHAT_WIDTH_REM);
  const chatWidthRef = useRef(chatWidth);

  useEffect(() => {
    chatWidthRef.current = chatWidth;
  }, [chatWidth]);

  const refresh = useCallback(() => {
    // Use ref to avoid stale state during interval-based refresh.
    const next = clamp(chatWidthRef.current, MIN_CHAT_WIDTH_REM, MAX_CHAT_WIDTH_REM);
    ensureStyleTag(buildOverrideCss(next));
  }, []);

  useEffect(() => {
    void (async () => {
      const stored = await readStoredChatWidth();
      const initial = clamp(stored ?? DEFAULT_CHAT_WIDTH_REM, MIN_CHAT_WIDTH_REM, MAX_CHAT_WIDTH_REM);
      setChatWidthState(initial);
      chatWidthRef.current = initial;
      refresh();
    })();
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const style = document.getElementById(STYLE_ID);
      // claude.ai sometimes re-renders <head>; re-inject our style if missing.
      if (!style) refresh();
    }, STYLE_CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const setChatWidth = useCallback((widthRem: number) => {
    const next = clamp(widthRem, MIN_CHAT_WIDTH_REM, MAX_CHAT_WIDTH_REM);
    setChatWidthState(next);
    chatWidthRef.current = next;
    refresh();
    // Persist for future sessions.
    void writeStoredChatWidth(next);
  }, [refresh]);

  return { chatWidth, setChatWidth };
};

/**
 * Slider boundaries for WidthPanel.
 */
export const CHAT_WIDTH_RANGE = {
  min: MIN_CHAT_WIDTH_REM,
  max: MAX_CHAT_WIDTH_REM,
  defaultValue: DEFAULT_CHAT_WIDTH_REM,
} as const;
