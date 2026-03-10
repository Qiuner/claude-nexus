/**
 * useDraggable.ts
 * Purpose: Adds draggable behavior for UI elements with click/drag distinction.
 * Last updated: 2026-03-10
 */

import type React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Point = { x: number; y: number };

type DraggableApi = {
  position: Point;
  isDragging: boolean;
  containerStyle: { left: string; top: string };
  onPointerDown: (e: React.PointerEvent) => void;
  setPosition: (pos: Point) => void;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

type Options = {
  defaultPosition: () => Point;
  getSize: () => { width: number; height: number };
  onClick: () => void;
  onDragEnd: (pos: Point) => void;
};

export const useDraggable = (options: Options): DraggableApi => {
  const [position, setPosition] = useState<Point>(() => options.defaultPosition());
  const [isDragging, setIsDragging] = useState(false);

  // Track latest position to avoid stale closures across multiple drags.
  const positionRef = useRef(position);
  const getSizeRef = useRef(options.getSize);
  const onClickRef = useRef(options.onClick);
  const onDragEndRef = useRef(options.onDragEnd);
  const startRef = useRef<{ pointerId: number; pointerStart: Point; posStart: Point } | null>(null);
  const movedRef = useRef(false);

  useEffect(() => {
    positionRef.current = position;
  }, [position]);

  useEffect(() => {
    getSizeRef.current = options.getSize;
    onClickRef.current = options.onClick;
    onDragEndRef.current = options.onDragEnd;
  }, [options.getSize, options.onClick, options.onDragEnd]);

  const setClampedPosition = useCallback((next: Point) => {
    const { width, height } = getSizeRef.current();
    const maxX = Math.max(0, window.innerWidth - width);
    const maxY = Math.max(0, window.innerHeight - height);
    setPosition({ x: clamp(next.x, 0, maxX), y: clamp(next.y, 0, maxY) });
  }, []);

  useEffect(() => {
    const onResize = () => setClampedPosition(positionRef.current);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [setClampedPosition]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    // 不使用 setPointerCapture：部分站点/场景下会导致 document 级 pointermove / pointerup 监听异常，从而拖拽失效。

    movedRef.current = false;
    setIsDragging(true);
    startRef.current = {
      pointerId: e.pointerId,
      pointerStart: { x: e.clientX, y: e.clientY },
      posStart: positionRef.current,
    };
  }, []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      if (e.pointerId !== start.pointerId) return;
      e.preventDefault();

      const dx = e.clientX - start.pointerStart.x;
      const dy = e.clientY - start.pointerStart.y;
      if (Math.hypot(dx, dy) >= 5) movedRef.current = true;

      setClampedPosition({ x: start.posStart.x + dx, y: start.posStart.y + dy });
    };

    const end = (e: PointerEvent) => {
      const start = startRef.current;
      if (!start) return;
      if (e.pointerId !== start.pointerId) return;
      e.preventDefault();

      startRef.current = null;
      setIsDragging(false);

      const finalPos = positionRef.current;
      if (!movedRef.current) {
        onClickRef.current();
      } else {
        onDragEndRef.current(finalPos);
      }
    };

    document.addEventListener('pointermove', onMove, true);
    document.addEventListener('pointerup', end, true);
    document.addEventListener('pointercancel', end, true);
    return () => {
      document.removeEventListener('pointermove', onMove, true);
      document.removeEventListener('pointerup', end, true);
      document.removeEventListener('pointercancel', end, true);
    };
  }, [setClampedPosition]);

  const containerStyle = useMemo(() => {
    return { left: `${position.x}px`, top: `${position.y}px` };
  }, [position]);

  return { position, isDragging, containerStyle, onPointerDown, setPosition: setClampedPosition };
};
