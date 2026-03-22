/**
 * Tracks claude.ai message nodes and provides timeline navigation state.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AUTOSCROLL_CONTAINER_SELECTOR,
  CONVERSATION_LINK_SELECTOR,
  MESSAGE_RENDER_WRAPPER_SELECTOR,
  SIDEBAR_FALLBACK_CONTAINER_SELECTOR,
  SIDEBAR_NAV_SELECTOR,
  USER_MESSAGE_SELECTOR,
} from '@src/constants/selectors';

type MessageType = 'user';

type TimelineNode = {
  id: string;
  type: MessageType;
  element: Element;
  index: number;
  text: string;
};

type TimelineApi = {
  nodes: TimelineNode[];
  activeIndex: number;
  scrollToNode: (index: number) => void;
};

const SCROLL_OFFSET_PX = 80;
const CHAT_RESYNC_DELAY_MS = 800;
const CHAT_POLL_INTERVAL_MS = 500;
const SIDEBAR_RESYNC_DEBOUNCE_MS = 800;

const getChatId = (): string => window.location.pathname.split('/chat/')?.[1] ?? '';

const findSidebarContainer = (): HTMLElement | null => {
  const nav = document.querySelector(SIDEBAR_NAV_SELECTOR);
  if (nav instanceof HTMLElement) return nav;
  const fallback = document.querySelector(SIDEBAR_FALLBACK_CONTAINER_SELECTOR);
  return fallback instanceof HTMLElement ? fallback : null;
};

const mutationHasChatLink = (mutations: MutationRecord[]): boolean => {
  for (const m of mutations) {
    for (const node of Array.from(m.addedNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches(CONVERSATION_LINK_SELECTOR)) return true;
      if (node.querySelector(CONVERSATION_LINK_SELECTOR)) return true;
    }
    for (const node of Array.from(m.removedNodes)) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.matches(CONVERSATION_LINK_SELECTOR)) return true;
      if (node.querySelector(CONVERSATION_LINK_SELECTOR)) return true;
    }
  }
  return false;
};

const findScrollContainer = (): HTMLElement | null => {
  const el = document.querySelector(AUTOSCROLL_CONTAINER_SELECTOR);
  return el instanceof HTMLElement ? el : null;
};

const getMessageType = (wrapper: Element): MessageType | null => {
  if (wrapper.querySelector(USER_MESSAGE_SELECTOR)) return 'user';
  return null;
};

const extractUserText = (wrapper: Element): string => {
  const el = wrapper.querySelector(USER_MESSAGE_SELECTOR);
  const text = el?.textContent ?? '';
  return text.replace(/\s+/g, ' ').trim();
};

const buildNodes = (scrollContainer: HTMLElement): TimelineNode[] => {
  const wrappers = Array.from(scrollContainer.querySelectorAll(MESSAGE_RENDER_WRAPPER_SELECTOR));
  const nodes: TimelineNode[] = [];

  for (const [index, wrapper] of wrappers.entries()) {
    const type = getMessageType(wrapper);
    if (!type) continue;
    const text = extractUserText(wrapper);
    const renderCount = wrapper.getAttribute('data-test-render-count') || '';
    const id = renderCount ? `${renderCount}_${index}` : String(index);
    nodes.push({ id, type, element: wrapper, index: nodes.length, text });
  }

  return nodes;
};

const computeActiveIndex = (nodes: TimelineNode[], container: HTMLElement | null): number => {
  if (nodes.length === 0) return -1;
  const containerTop = container ? container.getBoundingClientRect().top : 0;
  const threshold = containerTop + SCROLL_OFFSET_PX + 40;
  let active = -1;
  for (let i = 0; i < nodes.length; i += 1) {
    const top = nodes[i].element.getBoundingClientRect().top;
    if (top <= threshold) active = i;
  }
  return Math.max(0, active);
};

export const useTimeline = (): TimelineApi => {
  const [scrollContainer, setScrollContainer] = useState<HTMLElement | null>(null);
  const [nodes, setNodes] = useState<TimelineNode[]>([]);
  const nodesRef = useRef(nodes);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const resyncTimeoutRef = useRef<number | null>(null);
  const sidebarResyncTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const refresh = useMemo((): (() => void) => {
    return () => {
      const container = findScrollContainer();
      setScrollContainer(container);
      if (!container) return;
      const nextNodes = buildNodes(container);
      setNodes(nextNodes);
      setActiveIndex(computeActiveIndex(nextNodes, container));
    };
  }, []);

  useEffect(() => {
    let currentChatId = getChatId();

    const timer = window.setInterval(() => {
      const newChatId = getChatId();
      if (newChatId === currentChatId) return;
      currentChatId = newChatId;

      setNodes([]);
      setActiveIndex(0);

      if (resyncTimeoutRef.current) window.clearTimeout(resyncTimeoutRef.current);
      resyncTimeoutRef.current = window.setTimeout(() => {
        resyncTimeoutRef.current = null;
        refresh();
      }, CHAT_RESYNC_DELAY_MS);
    }, CHAT_POLL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
      if (resyncTimeoutRef.current) window.clearTimeout(resyncTimeoutRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    const sidebar = findSidebarContainer();
    if (!sidebar) return;

    const scheduleResync = () => {
      if (sidebarResyncTimeoutRef.current) window.clearTimeout(sidebarResyncTimeoutRef.current);
      sidebarResyncTimeoutRef.current = window.setTimeout(() => {
        sidebarResyncTimeoutRef.current = null;
        refresh();
      }, SIDEBAR_RESYNC_DEBOUNCE_MS);
    };

    const mo = new MutationObserver((mutations) => {
      if (!mutationHasChatLink(mutations)) return;
      scheduleResync();
    });

    mo.observe(sidebar, { childList: true, subtree: true });

    return () => {
      mo.disconnect();
      if (sidebarResyncTimeoutRef.current) window.clearTimeout(sidebarResyncTimeoutRef.current);
    };
  }, [refresh]);

  useEffect(() => {
    const initial = findScrollContainer();
    if (initial) setScrollContainer(initial);

    if (initial) return;

    const mo = new MutationObserver(() => {
      const next = findScrollContainer();
      if (!next) return;
      setScrollContainer(next);
      mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  useEffect(() => {
    const el = scrollContainer;
    if (!el) return;

    let raf = 0;
    const schedule = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        const nextNodes = buildNodes(el);
        setNodes(nextNodes);
        setActiveIndex(computeActiveIndex(nextNodes, el));
      });
    };

    schedule();
    const mo = new MutationObserver(schedule);
    mo.observe(el, { childList: true, subtree: true });

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      mo.disconnect();
    };
  }, [scrollContainer]);

  useEffect(() => {
    const el = scrollContainer;
    if (!el) return;

    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        setActiveIndex(computeActiveIndex(nodesRef.current, el));
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      el.removeEventListener('scroll', onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [scrollContainer]);

  const scrollToNode = useMemo(() => {
    return (index: number) => {
      const el = scrollContainer;
      const node = nodesRef.current[index];
      if (!el || !node) return;

      const containerRect = el.getBoundingClientRect();
      const nodeRect = node.element.getBoundingClientRect();
      const targetTop = nodeRect.top - containerRect.top + el.scrollTop - SCROLL_OFFSET_PX;
      el.scrollTo({ top: Math.max(0, targetTop), behavior: 'instant' });
    };
  }, [scrollContainer]);

  return { nodes, activeIndex, scrollToNode };
};
