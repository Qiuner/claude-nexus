/**
 * index.tsx
 * Purpose: Renders the floating action ball and toggles its utility panel.
 * Last updated: 2026-03-10
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Settings } from 'lucide-react';
import { readStoredFloatBallPosition, writeStoredFloatBallPosition } from '@src/services/storage';
import { useDraggable } from '../../hooks/useDraggable';
import WidthPanel from './WidthPanel';

type Point = { x: number; y: number };

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
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [loadedPosition, setLoadedPosition] = useState<Point | null>(null);
  const [hovered, setHovered] = useState(false);

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
    onClick: () => setOpen((v) => !v),
    onDragEnd: (pos) => void writeStoredFloatBallPosition(pos),
  });

  const { position, isDragging, containerStyle, onPointerDown, setPosition } = draggable;

  useEffect(() => {
    if (!loadedPosition) return;
    // Ensure draggable state is in sync with restored position.
    setPosition(loadedPosition);
  }, [loadedPosition, setPosition]);

  const panelSide = useMemo<'left' | 'right'>(() => {
    const size = getSize();
    const centerX = position.x + size.width / 2;
    return centerX >= window.innerWidth / 2 ? 'left' : 'right';
  }, [position]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && el.contains(e.target)) return;
      // Close when clicking outside of the ball/panel region.
      setOpen(false);
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
          aria-label="Open float ball"
        >
          <Settings className="pointer-events-none" style={{ width: '1.4rem', height: '1.4rem', color: '#ffffff' }} aria-hidden="true" />
        </button>

        {open ? <WidthPanel side={panelSide} onClose={() => setOpen(false)} /> : null}
      </div>
    </div>
  );
}
