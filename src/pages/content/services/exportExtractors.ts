/**
 * exportExtractors.ts
 * Purpose: Extracts conversation messages from claude.ai DOM for export.
 * Created: 2026-03-10
 */

import type { ExportExtractionResult, ExportMessage, ExportRole } from './exportTypes';
import {
  ASSISTANT_COPY_BUTTON_SELECTOR,
  ASSISTANT_MESSAGE_SELECTOR,
  CODE_BLOCK_CONTENT_SELECTOR,
  MESSAGE_RENDER_WRAPPER_SELECTOR,
  TOOLBAR_ACTIONS_SELECTOR,
  USER_MESSAGE_SELECTOR,
} from '@src/constants/selectors';

export const EXPORT_SELECTORS = {
  toolbarActions: TOOLBAR_ACTIONS_SELECTOR,
  messageWrapper: MESSAGE_RENDER_WRAPPER_SELECTOR,
  userMessage: USER_MESSAGE_SELECTOR,
  assistantMessage: ASSISTANT_MESSAGE_SELECTOR,
  assistantCopyButton: ASSISTANT_COPY_BUTTON_SELECTOR,
} as const;

type Candidate = {
  role: ExportRole;
  element: Element;
  position: number;
};

const getElementTop = (el: Element): number => {
  const rect = el.getBoundingClientRect();
  return rect.top + window.scrollY;
};

const normalizeText = (text: string): string => text.replace(/\s+/g, ' ').trim();

const sleep = (ms: number) =>
  new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });

const extractUserText = (el: Element): string => {
  const raw = el.textContent ?? '';
  return normalizeText(raw);
};

const extractInline = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof HTMLElement)) return '';

  const tag = node.tagName.toLowerCase();
  if (tag === 'br') return '\n';
  if (tag === 'code') return `\`${node.textContent ?? ''}\``;
  if (tag === 'strong' || tag === 'b') return `**${node.textContent ?? ''}**`;
  if (tag === 'em' || tag === 'i') return `*${node.textContent ?? ''}*`;
  if (tag === 'a') {
    const href = node.getAttribute('href') ?? '';
    const label = node.textContent ?? '';
    if (!href) return label;
    return `[${label}](${href})`;
  }

  return Array.from(node.childNodes)
    .map((c) => extractInline(c))
    .join('');
};

const extractBlock = (node: Node, listDepth: number): string => {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
  if (!(node instanceof HTMLElement)) return '';

  const tag = node.tagName.toLowerCase();

  if (tag === 'pre') {
    const code = node.querySelector(CODE_BLOCK_CONTENT_SELECTOR);
    const text = (code?.textContent ?? node.textContent ?? '').replace(/\n$/, '');
    return `\n\`\`\`\n${text}\n\`\`\`\n`;
  }

  if (tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6') {
    const level = Number(tag.slice(1));
    const hashes = '#'.repeat(Number.isFinite(level) ? level : 2);
    const title = normalizeText(node.textContent ?? '');
    return `\n${hashes} ${title}\n`;
  }

  if (tag === 'li') {
    const indent = '  '.repeat(listDepth);
    const text = normalizeText(extractInline(node));
    return `\n${indent}- ${text}\n`;
  }

  if (tag === 'ul' || tag === 'ol') {
    const nextDepth = listDepth + 1;
    return Array.from(node.children)
      .map((c) => extractBlock(c, nextDepth))
      .join('');
  }

  const isBlock =
    tag === 'p' ||
    tag === 'div' ||
    tag === 'section' ||
    tag === 'article' ||
    tag === 'blockquote' ||
    tag === 'table' ||
    tag === 'hr';

  const childText = Array.from(node.childNodes)
    .map((c) => extractBlock(c, listDepth))
    .join('');

  if (tag === 'br') return '\n';

  if (isBlock) return `\n${childText}\n`;
  return childText;
};

/**
 * Extracts a Markdown-like plain text from an arbitrary DOM subtree.
 * @param root Element
 * @returns string
 */
export const extractMarkdownFromDom = (root: Element): string => {
  const raw = extractBlock(root, 0);
  return raw
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

const tryReadAssistantFromClipboard = async (assistantEl: Element): Promise<string | null> => {
  const wrapper = assistantEl.closest(EXPORT_SELECTORS.messageWrapper);
  if (!(wrapper instanceof HTMLElement)) return null;

  const copyButton = wrapper.querySelector(EXPORT_SELECTORS.assistantCopyButton);
  if (!(copyButton instanceof HTMLButtonElement)) return null;

  try {
    copyButton.click();
    await sleep(50);
    const text = await navigator.clipboard.readText();
    const normalized = text.replace(/\r\n/g, '\n').trim();
    if (!normalized) return null;
    return normalized;
  } catch {
    return null;
  }
};

const buildCandidates = (): Candidate[] => {
  const candidates: Candidate[] = [];

  const userNodes = Array.from(document.querySelectorAll(EXPORT_SELECTORS.userMessage));
  for (const el of userNodes) candidates.push({ role: 'user', element: el, position: getElementTop(el) });

  const assistantNodes = Array.from(document.querySelectorAll(EXPORT_SELECTORS.assistantMessage));
  for (const el of assistantNodes) candidates.push({ role: 'assistant', element: el, position: getElementTop(el) });

  return candidates.sort((a, b) => a.position - b.position);
};

/**
 * Extracts conversation messages from the current page.
 * First attempts assistant copy-button + clipboard read, then falls back to DOM extraction.
 * @returns ExportExtractionResult
 *
 * Modification Notes:
 *   - 2026-03-10 Initial implementation (user/assistant text only; skips artifacts/pasted attachments).
 */
export const extractConversationMessages = async (): Promise<ExportExtractionResult> => {
  const candidates = buildCandidates();
  const messages: ExportMessage[] = [];
  let failedMessages = 0;

  for (const candidate of candidates) {
    if (candidate.role === 'user') {
      const content = extractUserText(candidate.element);
      if (!content) failedMessages += 1;
      messages.push({ role: 'user', content: content || '[Export failed]' });
      continue;
    }

    const fromClipboard = await tryReadAssistantFromClipboard(candidate.element);
    if (fromClipboard) {
      messages.push({ role: 'assistant', content: fromClipboard });
      continue;
    }

    const fallback = extractMarkdownFromDom(candidate.element);
    if (!fallback) failedMessages += 1;
    messages.push({ role: 'assistant', content: fallback || '[Export failed]' });
  }

  return { messages, failedMessages };
};

