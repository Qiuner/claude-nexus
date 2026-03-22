import { CLAUDE_SELECTORS } from '../components/ExportHub/index';
import { exportStore } from '../components/ExportHub/store';
import { extractMarkdownFromDom, EXPORT_SELECTORS } from './exportExtractors';
import { saveAs } from 'file-saver';

// Resolves chronological positions of selected nodes to survive React wiping DOM attributes on re-renders
function getSelectedIndices(): number[] {
  const allNodes = Array.from(document.querySelectorAll<HTMLElement>(CLAUDE_SELECTORS.messageNode));
  return allNodes
    .map((n, idx) => n.getAttribute('data-cherry-selected') === 'true' ? idx : -1)
    .filter(idx => idx !== -1);
}

// Retrieves fresh DOM references based on chronological indices post-render
function getFreshNodes(indices: number[]): HTMLElement[] {
  const allNodes = Array.from(document.querySelectorAll<HTMLElement>(CLAUDE_SELECTORS.messageNode));
  return indices.map(idx => allNodes[idx]).filter(Boolean);
}

// Ensure Claude's long text/code attachments are fully expanded before extracting!
async function globalExpandShowMore(indices: number[]) {
  const allNodes = Array.from(document.querySelectorAll<HTMLElement>(CLAUDE_SELECTORS.messageNode));
  let clicked = false;
  
  for (const idx of indices) {
    const node = allNodes[idx];
    if (!node) continue;
    const buttons = Array.from(node.querySelectorAll('button'));
    for (const btn of buttons) {
      const text = btn.textContent?.trim().toLowerCase() || '';
      if (text.includes('show more') || text.includes('显示更多')) {
        btn.click();
        clicked = true;
      }
    }
  }
  
  if (clicked) {
    // Await React reconciliation bridging. React totally replaces the DOM node upon expansion,
    // so we MUST wait before calling getFreshNodes() to avoid capturing detached orphans!
    await new Promise(r => setTimeout(r, 800));
  }
}

// 1. Pure Markdown Generation
export async function generateMarkdown() {
  const indices = getSelectedIndices();
  if (indices.length === 0) return;

  await globalExpandShowMore(indices);
  const nodes = getFreshNodes(indices);
  
  const mdParts = nodes.map(n => {
    const isUser = !!n.querySelector(EXPORT_SELECTORS.userMessage);
    const roleHeader = isUser ? '# User\n' : '# Assistant\n';
    const content = extractMarkdownFromDom(n) || '[Export empty]';
    return `${roleHeader}${content}`;
  });
  
  const finalMd = mdParts.join('\n\n---\n\n');
  downloadFile(finalMd, 'claude-selection-export.md');
  exportStore.setIsSelectionMode(false);
}

// 2. Pure JSON Generation
export async function generateJSON() {
  const indices = getSelectedIndices();
  if (indices.length === 0) return;

  await globalExpandShowMore(indices);
  const nodes = getFreshNodes(indices);
  
  const messages = nodes.map(n => {
    // Determine author role using the native app selectors
    const isUser = !!n.querySelector(EXPORT_SELECTORS.userMessage);
    const role = isUser ? 'user' : 'assistant';
    const content = extractMarkdownFromDom(n) || '[Export empty]';
    return { role, content };
  });
  
  const finalJson = JSON.stringify(messages, null, 2);
  downloadFile(finalJson, 'claude-selection-export.json', 'application/json');
  exportStore.setIsSelectionMode(false);
}

// Robust unified blob dispatcher utilizing JS 'file-saver' polyfill override
function downloadFile(content: string, filename: string, mimeType = 'text/markdown') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  saveAs(blob, filename);
}
