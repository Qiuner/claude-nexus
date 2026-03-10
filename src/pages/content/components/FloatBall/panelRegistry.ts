/**
 * panelRegistry.ts
 * Purpose: Central registry for FloatBall panels; add new panels here to extend functionality.
 * Last updated: 2026-03-10
 */

import type { FC } from 'react';
import WidthPanel from './panels/WidthPanel';

type FloatBallPanelComponentProps = {
  side: 'left' | 'right';
  onClose: () => void;
};

export type FloatBallPanel = {
  id: string;
  icon?: string;
  labelKey: string;
  component: FC<FloatBallPanelComponentProps>;
};

export const panels: FloatBallPanel[] = [
  {
    id: 'width',
    icon: 'ArrowLeftRight',
    labelKey: 'floatBall.width',
    component: WidthPanel,
  },
];
