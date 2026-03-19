/**
 * selectors.ts
 * Purpose: Centralized DOM selectors used across scripts.
 * Created: 2026-03-19
 */

// Content/Popup/Options React mount root id.
export const APP_ROOT_ID = '__root';
// Selector for locating the shared React mount root.
export const APP_ROOT_SELECTOR = `#${APP_ROOT_ID}`;

// Root host id for the injected export button app.
export const EXPORT_BUTTON_ROOT_ID = 'claude-nexus-export-button-root';
// Selector for checking whether export button host already exists.
export const EXPORT_BUTTON_ROOT_SELECTOR = `#${EXPORT_BUTTON_ROOT_ID}`;
// Root host id for the injected prompt button app.
export const PROMPT_BUTTON_ROOT_ID = 'claude-nexus-prompt-button-root';
// Selector for checking whether prompt button host already exists.
export const PROMPT_BUTTON_ROOT_SELECTOR = `#${PROMPT_BUTTON_ROOT_ID}`;

// Main sidebar navigation container.
export const SIDEBAR_NAV_SELECTOR = 'nav';
// Conversation list container under sidebar navigation.
export const SIDEBAR_CONVERSATION_LIST_SELECTOR = 'nav ul';
// "Recents" section used as insertion anchor for folder manager container.
export const SIDEBAR_RECENTS_SECTION_SELECTOR = 'nav div.flex-1.relative';
// Fallback sidebar container when nav is not available.
export const SIDEBAR_FALLBACK_CONTAINER_SELECTOR = 'div.flex-1.relative';
// Element whose width reflects sidebar open/collapsed state.
export const SIDEBAR_WIDTH_TARGET_SELECTOR =
  'div.flex.min-h-0.w-full.overflow-x-clip.overflow-y-auto.relative > div.shrink-0';

// Conversation anchors in sidebar list.
export const CONVERSATION_LINK_SELECTOR = 'a[href^="/chat/"]';
// List item wrapper for a single conversation entry.
export const CONVERSATION_LIST_ITEM_SELECTOR = 'li';
// Title text node inside conversation anchor.
export const CONVERSATION_TITLE_SELECTOR = 'span.truncate';

// Chat input editable area.
export const CHAT_INPUT_SELECTOR = 'div[data-testid="chat-input"]';
// Parent wrapper used to find adjacent toolbar regions.
export const CHAT_INPUT_TOOLBAR_PARENT_SELECTOR = 'div.flex.flex-col';
// Left-side actions container where prompt button is injected.
export const CHAT_INPUT_LEFT_ACTIONS_SELECTOR = 'div.relative.flex-1.flex.items-center.shrink.min-w-0.gap-1';

// Scrollable chat content container.
export const AUTOSCROLL_CONTAINER_SELECTOR = '[data-autoscroll-container="true"]';
// Wrapper attribute marking each rendered message block.
export const MESSAGE_RENDER_WRAPPER_SELECTOR = '[data-test-render-count]';
// User message block.
export const USER_MESSAGE_SELECTOR = '[data-testid="user-message"]';
// Assistant message block.
export const ASSISTANT_MESSAGE_SELECTOR = 'div.font-claude-response';
// Assistant action-bar copy button used for clipboard-based export.
export const ASSISTANT_COPY_BUTTON_SELECTOR = 'button[data-testid="action-bar-copy"]';
// Toolbar action area where export button is injected.
export const TOOLBAR_ACTIONS_SELECTOR = '[data-testid="wiggle-controls-actions"]';
// Code element inside pre blocks when extracting markdown.
export const CODE_BLOCK_CONTENT_SELECTOR = 'code';
