/**
 * dom.ts
 * Purpose: Pure utilities for sidebar DOM scanning and parsing (no React or business state).
 * Created: 2026-03-09
 */

import type React from 'react';
import type { Conversation } from '@src/types/conversation';
import {
  CONVERSATION_LINK_SELECTOR,
  CONVERSATION_TITLE_SR_ONLY_SELECTOR,
  CONVERSATION_TITLE_SELECTOR,
  SIDEBAR_CONVERSATION_LIST_SELECTOR,
} from '@src/constants/selectors';

export const findNavUl = (): HTMLElement | null => {
  const el = document.querySelector(SIDEBAR_CONVERSATION_LIST_SELECTOR);
  if (!el) return null;
  if (el instanceof HTMLElement) return el;
  return null;
};

export const extractConversationIdFromHref = (href: string) => {
  if (!href) return null;

  let normalizedHref = href.trim();
  if (!normalizedHref) return null;

  try {
    if (/^https?:\/\//i.test(normalizedHref)) {
      normalizedHref = new URL(normalizedHref).pathname;
    }
  } catch {
    return null;
  }

  if (!normalizedHref.startsWith('/chat/')) return null;
  const raw = normalizedHref.replace('/chat/', '');
  return raw.split(/[?#]/)[0] || null;
};

export const getConversationTitleFromAnchor = (a: HTMLAnchorElement) => {
  const visibleTitle = a.querySelector(CONVERSATION_TITLE_SELECTOR);
  const srOnlyTitle = a.querySelector(CONVERSATION_TITLE_SR_ONLY_SELECTOR);
  return (visibleTitle?.textContent || srOnlyTitle?.textContent || a.textContent || '').trim();
};

export const scanConversations = (root: HTMLElement): Conversation[] => {
  const anchors = Array.from(root.querySelectorAll(CONVERSATION_LINK_SELECTOR));
  const metas: Conversation[] = [];

  for (const a of anchors) {
    if (!(a instanceof HTMLAnchorElement)) continue;
    const href = a.getAttribute('href') || '';
    const id = extractConversationIdFromHref(href);
    if (!id) continue;
    metas.push({ id, href, title: getConversationTitleFromAnchor(a) });
  }

  return metas;
};

export const getConversationIdFromDragEvent = (e: DragEvent | React.DragEvent) => {
  const dt = e.dataTransfer;
  if (!dt) return null;
  const custom = dt.getData('application/x-claude-nexus-conversation');
  if (custom) return extractConversationIdFromHref(`/chat/${custom}`) ?? custom;
  const plain = dt.getData('text/plain');
  if (plain) {
    const fromHref = extractConversationIdFromHref(plain);
    if (fromHref) return fromHref;
    if (plain.length >= 8 && !plain.includes('/')) return plain;
  }
  return null;
};

export const getConversationTitleFromDragEvent = (e: DragEvent | React.DragEvent) => {
  const dt = e.dataTransfer;
  if (!dt) return null;
  const title = dt.getData('application/x-claude-nexus-conversation-title').trim();
  return title || null;
};

const parseRgb = (value: string) => {
  const match = value.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (!match) return null;
  const r = Number(match[1]);
  const g = Number(match[2]);
  const b = Number(match[3]);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
  return { r, g, b };
};

export const estimateIsDarkBackground = (backgroundColor: string) => {
  const rgb = parseRgb(backgroundColor);
  if (!rgb) return null;
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance < 0.55;
};

