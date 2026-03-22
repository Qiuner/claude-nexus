/**
 * index.tsx
 * Purpose: Renders the floating action ball and toggles its utility panel.
 * Last updated: 2026-03-10
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowLeftRight, Settings, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { readStoredFloatBallPosition, writeStoredFloatBallPosition } from '@src/services/storage';
import { useDraggable } from '../../hooks/useDraggable';
import { panels } from './panelRegistry';

type Point = { x: number; y: number };
type PanelSide = 'left' | 'right';

type PanelMenuProps = {
  side: PanelSide;
  onClose: () => void;
  onSelectPanel: (panelId: string) => void;
};

const panelIcons: Record<string, LucideIcon> = {
  ArrowLeftRight,
};

const PanelMenu = ({ side, onClose, onSelectPanel }: PanelMenuProps) => {
  const { t } = useTranslation();

  const sideClass = side === 'left' ? 'right-full mr-3' : 'left-full ml-3';
  const arrowWrapperClass = side === 'left' ? 'left-full' : 'right-full';
  const arrowBorderClass = side === 'left' ? 'border-l-[#e5e0d8]' : 'border-r-[#e5e0d8]';
  const arrowFillClass = side === 'left' ? 'border-l-white' : 'border-r-white';
  const arrowBorderOffsetClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`absolute top-1/2 -translate-y-1/2 ${sideClass} z-50`}>
      <div className="relative w-[14rem] rounded-xl border border-[#e5e0d8] dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 text-[#374151] dark:text-zinc-200 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <div className="mb-1 flex items-center justify-between">
          <div className="text-[12px] font-medium">FloatBall</div>
          <button
            type="button"
            className="rounded p-1 text-[#6b7280] dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label={t('common.cancel')}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex flex-col gap-1">
          {panels.map((panel) => {
            const Icon = panel.icon ? panelIcons[panel.icon] : undefined;
            return (
              <button
                key={panel.id}
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-[12px] hover:bg-zinc-50 dark:hover:bg-zinc-800"
                aria-label={t(panel.labelKey)}
                onClick={() => onSelectPanel(panel.id)}
              >
                {Icon ? <Icon className="h-4 w-4 text-[#6b7280] dark:text-zinc-400" aria-hidden="true" /> : null}
                <span className="truncate">{t(panel.labelKey)}</span>
              </button>
            );
          })}
        </div>

        <div className={`absolute top-1/2 -translate-y-1/2 ${arrowWrapperClass}`}>
          <div className={`h-0 w-0 border-y-[6px] border-y-transparent ${arrowBorderClass} ${side === 'left' ? 'border-l-[6px]' : 'border-r-[6px]'}`} />
          <div
            className={`absolute ${arrowBorderOffsetClass} top-1/2 -translate-y-1/2 h-0 w-0 border-y-[5px] border-y-transparent ${arrowFillClass} ${
              side === 'left' ? 'border-l-[5px]' : 'border-r-[5px]'
            }`}
          />
        </div>
      </div>
    </div>
  );
};

const BALL_SIZE_REM = 4.2;
const BALL_SIZE_FALLBACK_PX = 28;
const BALL_RIGHT_PX = 16;

/**
 * Floating ball entry component
 * @returns JSX.Element
 *
 * Modification Notes:
 *   - 2026-03-10 Reduced ball size (~70%) for better visual balance.
 */
export default function FloatBall() {
  const { t } = useTranslation();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [activePanelId, setActivePanelId] = useState<string | null>(null);
  const [loadedPosition, setLoadedPosition] = useState<Point | null>(null);
  const [hovered, setHovered] = useState(false);

  const closeAll = () => {
    setOpen(false);
    setActivePanelId(null);
  };

  useEffect(() => {
    void (async () => {
      // Restore last position if available.
      const stored = await readStoredFloatBallPosition();
      if (!stored) return;
      setLoadedPosition(stored);
    })();
  }, []);

  /**
   * Reads the rendered ball size for drag clamping and default positioning.
   * Falls back to a constant size before layout is ready.
   */
  const getSize = () => {
    const el = rootRef.current;
    if (!el) return { width: BALL_SIZE_FALLBACK_PX, height: BALL_SIZE_FALLBACK_PX };
    const rect = el.getBoundingClientRect();
    return { width: rect.width || BALL_SIZE_FALLBACK_PX, height: rect.height || BALL_SIZE_FALLBACK_PX };
  };

  /**
   * Default ball position: vertically centered and pinned to the right.
   */
  const defaultPosition = () => {
    const size = getSize();
    const x = Math.max(0, window.innerWidth - size.width - BALL_RIGHT_PX);
    const y = Math.max(0, (window.innerHeight - size.height) / 2);
    return { x, y };
  };

  const draggable = useDraggable({
    defaultPosition: () => loadedPosition ?? defaultPosition(),
    getSize,
    onClick: () => {
      if (open) {
        closeAll();
        return;
      }
      setActivePanelId(null);
      setOpen(true);
    },
    onDragEnd: (pos) => void writeStoredFloatBallPosition(pos),
  });

  const { position, isDragging, containerStyle, onPointerDown, setPosition } = draggable;

  useEffect(() => {
    if (!loadedPosition) return;
    // Ensure draggable state is in sync with restored position.
    setPosition(loadedPosition);
  }, [loadedPosition, setPosition]);

  const panelSide = useMemo<PanelSide>(() => {
    const size = getSize();
    const centerX = position.x + size.width / 2;
    return centerX >= window.innerWidth / 2 ? 'left' : 'right';
  }, [position]);

  const activePanel = useMemo(() => {
    if (!activePanelId) return null;
    return panels.find((p) => p.id === activePanelId) ?? null;
  }, [activePanelId]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      // Close when clicking outside of the ball/panel region.
      closeAll();
    };
    window.addEventListener('mousedown', onDown, true);
    return () => window.removeEventListener('mousedown', onDown, true);
  }, [open]);

  return (
    <div className="fixed z-50" style={containerStyle}>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          className={`flex items-center justify-center active:scale-95 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{
            width: `${BALL_SIZE_REM}rem`,
            height: `${BALL_SIZE_REM}rem`,
            borderRadius: '50%',
            backgroundColor: hovered ? '#b5572f' : '#c96442',
            boxShadow: '0 0.25rem 0.75rem rgba(0,0,0,0.3)',
            transition: 'background-color 0.15s ease',
          }}
          onPointerDown={onPointerDown}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={t('widthControl.openAria')}
        >
          <Settings className="pointer-events-none" style={{ width: '1.4rem', height: '1.4rem', color: '#ffffff' }} aria-hidden="true" />
        </button>

        {open && !activePanel ? <PanelMenu side={panelSide} onClose={closeAll} onSelectPanel={setActivePanelId} /> : null}
        {open && activePanel ? <activePanel.component side={panelSide} onClose={closeAll} /> : null}
      </div>
    </div>
  );
}
