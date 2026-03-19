/**
 * useSidebarOpen.ts
 * Purpose: Detects Claude sidebar open/collapsed state by observing sidebar width changes.
 * Created: 2026-03-18
 */

import { useEffect, useState } from 'react';
import { SIDEBAR_WIDTH_TARGET_SELECTOR } from '@src/constants/selectors';

/**
 * Reads current sidebar open state from claude.ai DOM.
 * @returns boolean - true means expanded, false means collapsed
 *
 * Modification Notes:
 *   - 2026-03-18 [Qiuner] Added width-based predicate for open/collapsed detection.
 */
const getSidebarOpen = (): boolean => {
  const el = document.querySelector(SIDEBAR_WIDTH_TARGET_SELECTOR);
  if (!(el instanceof HTMLElement)) return true;
  return el.getBoundingClientRect().width > 100;
};

/**
 * Watches the claude.ai sidebar width to infer whether it is open.
 * @returns boolean - true means expanded, false means collapsed
 *
 * Modification Notes:
 *   - 2026-03-18 [Qiuner] Switched to width check via getSidebarOpen().
 */
export const useSidebarOpen = (): boolean => {
  const [isOpen, setIsOpen] = useState(() => getSidebarOpen());

  useEffect(() => {
    let disposed = false;
    let ro: ResizeObserver | null = null;
    let mo: MutationObserver | null = null;
    let raf = 0;

    const update = () => {
      if (disposed) return;
      setIsOpen(getSidebarOpen());
    };

    const attach = (target: HTMLElement) => {
      if (ro) return;

      update();

      if (typeof ResizeObserver === 'undefined') return;
      ro = new ResizeObserver((entries) => {
        if (!entries[0]) return;
        if (raf) return;
        raf = window.requestAnimationFrame(() => {
          raf = 0;
          update();
        });
      });

      ro.observe(target);
    };

    const tryAttach = (): boolean => {
      const el = document.querySelector(SIDEBAR_WIDTH_TARGET_SELECTOR);
      if (!(el instanceof HTMLElement)) return false;
      attach(el);
      return true;
    };

    if (tryAttach()) {
      return () => {
        disposed = true;
        if (raf) window.cancelAnimationFrame(raf);
        ro?.disconnect();
      };
    }

    mo = new MutationObserver(() => {
      if (tryAttach() && mo) {
        mo.disconnect();
        mo = null;
      }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    return () => {
      disposed = true;
      if (raf) window.cancelAnimationFrame(raf);
      ro?.disconnect();
      mo?.disconnect();
    };
  }, []);

  return isOpen;
};
