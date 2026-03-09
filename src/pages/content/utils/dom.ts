/**
 * dom.ts
 * Purpose: Pure utilities for sidebar DOM scanning and parsing (no React or business state).
 * Created: 2026-03-09
 */

import type React from 'react';
import type { Conversation } from '@src/types/conversation';

export const findNavUl = (): HTMLUListElement | null => {
  const el = document.querySelector('nav ul');
  if (!el) return null;
  if (el instanceof HTMLUListElement) return el;
  return null;
};

export const extractConversationIdFromHref = (href: string) => {
  if (!href.startsWith('/chat/')) return null;
  const raw = href.replace('/chat/', '');
  return raw.split(/[?#]/)[0] || null;
};

export const getConversationTitleFromAnchor = (a: HTMLAnchorElement) => {
  const span = a.querySelector('span.truncate');
  const text = (span?.textContent || a.textContent || '').trim();
  return text;
};

export const scanConversations = (ul: HTMLUListElement): Conversation[] => {
  const anchors = Array.from(ul.querySelectorAll('a[href^="/chat/"]'));
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
  if (custom) return custom;
  const plain = dt.getData('text/plain');
  if (plain && plain.length >= 8) return plain;
  return null;
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

