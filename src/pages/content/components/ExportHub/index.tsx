import { useEffect } from 'react';
import { exportStore, useExportStore } from './store';
import ExportDock from './ExportDock';

export const CLAUDE_SELECTORS = {
  // Constant abstraction preventing brittle hardcoded DOM matching
  messageNode: '[data-test-render-count]',
};

export default function ExportHub() {
  const store = useExportStore();

  useEffect(() => {
    if (!store.isSelectionMode) {
      // Complete Sanitizer step ONLY when completely exiting Selection Mode.
      document.body.classList.remove('cherry-pick-mode');
      document.querySelectorAll('[data-cherry-selected]').forEach(n => n.removeAttribute('data-cherry-selected'));
      document.querySelectorAll('[data-cherry-id]').forEach(n => n.removeAttribute('data-cherry-id'));
      return;
    }

    // Attach master active class to trigger global CSS override layer
    document.body.classList.add('cherry-pick-mode');

    // Assign IDs to native DOM blocks
    const syncDOM = () => {
      const nodes = document.querySelectorAll(CLAUDE_SELECTORS.messageNode);
      nodes.forEach((node, idx) => {
        const id = `cherry-msg-${idx}`;
        if (!node.hasAttribute('data-cherry-id')) {
          node.setAttribute('data-cherry-id', id);
        }
        if (store.selectedIds.has(id)) {
          node.setAttribute('data-cherry-selected', 'true');
        } else {
          node.removeAttribute('data-cherry-selected');
        }
      });
    };
    syncDOM();

    // High-performance Capture-Phase click interceptor preventing Claude hooks from misfiring
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Let ExportDock UI pass through normally
      if (target.closest('.export-dock-container')) return;

      const node = target.closest(CLAUDE_SELECTORS.messageNode);
      if (node) {
        // Absolute lockdown on click bubbling
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const id = node.getAttribute('data-cherry-id');
        if (id) {
          exportStore.toggleId(id);
        }
      } else {
        // Block all empty space clicks during selection mode!
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };

    // Third parameter 'true' forces execution in the DOM capture phase!
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [store.isSelectionMode, store.selectedIds]); // Re-syncs attribute bindings strictly upon state mutation

  return (
    <>
      <CustomStyle />
      {store.isSelectionMode && (
        <div className="export-dock-container relative z-[99999]">
          <ExportDock />
        </div>
      )}
    </>
  );
}

function CustomStyle() {
  return (
    <style>{`
      /* Phase 2: Cherry-Pick Dimmer & Hardware Accel Toggles */
      body.cherry-pick-mode::before {
        content: "";
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.15);
        z-index: 99990;
        pointer-events: none;
        transition: background 0.3s ease;
      }
      html.dark body.cherry-pick-mode::before {
        background: rgba(0,0,0,0.6);
      }
      
      body.cherry-pick-mode [data-test-render-count] {
        cursor: pointer !important;
        position: relative !important;
        z-index: 99991 !important;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        border-radius: 12px;
      }
      
      /* Pure CSS Checkbox Injection via Pseudo Element */
      body.cherry-pick-mode [data-test-render-count]::after {
        content: "";
        position: absolute;
        top: 12px;
        right: 12px;
        width: 20px;
        height: 20px;
        border-radius: 6px;
        border: 2px solid #a1a1aa;
        background: white;
        opacity: 0;
        transform: scale(0.9);
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 99992;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }
      html.dark body.cherry-pick-mode [data-test-render-count]::after {
        background: #27272a;
        border-color: #52525b;
      }

      /* Hover States */
      body.cherry-pick-mode [data-test-render-count]:hover {
        box-shadow: 0 0 0 2px #3b82f6 !important;
        background-color: rgba(59, 130, 246, 0.05) !important;
      }
      body.cherry-pick-mode [data-test-render-count]:hover::after {
        opacity: 1;
        transform: scale(1);
      }

      /* Active Selected States (Green Theme Checkmark) */
      body.cherry-pick-mode [data-test-render-count][data-cherry-selected="true"] {
        box-shadow: 0 0 0 2px #10b981 !important;
        background-color: rgba(16, 185, 129, 0.08) !important;
      }
      body.cherry-pick-mode [data-test-render-count][data-cherry-selected="true"]::after {
        opacity: 1;
        transform: scale(1);
        background: #10b981;
        border-color: #10b981;
      }
      
      /* W3C CSS Checkmark Hack */
      body.cherry-pick-mode [data-test-render-count][data-cherry-selected="true"]::before {
        content: "";
        position: absolute;
        top: 16px;
        right: 19px;
        width: 5px;
        height: 10px;
        border: solid white;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
        z-index: 99993;
      }
    `}</style>
  );
}
