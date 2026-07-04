/**
 * useBallSizeControl.ts
 * Purpose: Controls the floating ball scale with persisted local storage.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  FLOAT_BALL_SIZE_STORAGE_KEY,
  readStoredFloatBallSize,
  writeStoredFloatBallSize,
} from '@src/services/storage';

type BallSizeControlApi = {
  ballScale: number;
  setBallScale: (scale: number) => void;
};

const MIN_BALL_SCALE = 0.8;
const MAX_BALL_SCALE = 1.4;
const DEFAULT_BALL_SCALE = 1;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const useBallSizeControl = (): BallSizeControlApi => {
  const [ballScale, setBallScaleState] = useState<number>(DEFAULT_BALL_SCALE);

  useEffect(() => {
    void (async () => {
      const stored = await readStoredFloatBallSize();
      setBallScaleState(clamp(stored ?? DEFAULT_BALL_SCALE, MIN_BALL_SCALE, MAX_BALL_SCALE));
    })();
  }, []);

  useEffect(() => {
    const handleChanged: Parameters<typeof chrome.storage.onChanged.addListener>[0] = (changes, area) => {
      if (area !== 'local') return;
      if (!changes?.[FLOAT_BALL_SIZE_STORAGE_KEY]) return;
      const next = changes[FLOAT_BALL_SIZE_STORAGE_KEY].newValue;
      if (typeof next !== 'number' || Number.isNaN(next) || !Number.isFinite(next)) return;
      setBallScaleState(clamp(next, MIN_BALL_SCALE, MAX_BALL_SCALE));
    };

    chrome?.storage?.onChanged?.addListener(handleChanged);
    return () => chrome?.storage?.onChanged?.removeListener(handleChanged);
  }, []);

  const setBallScale = useCallback((scale: number) => {
    const next = clamp(scale, MIN_BALL_SCALE, MAX_BALL_SCALE);
    setBallScaleState(next);
    void writeStoredFloatBallSize(next);
  }, []);

  return { ballScale, setBallScale };
};

export const FLOAT_BALL_SCALE_RANGE = {
  min: MIN_BALL_SCALE,
  max: MAX_BALL_SCALE,
  defaultValue: DEFAULT_BALL_SCALE,
  step: 0.05,
} as const;
