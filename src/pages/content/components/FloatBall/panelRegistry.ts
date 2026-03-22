/**
 * panelRegistry.ts
 * Purpose: Central registry for FloatBall panels; add new panels here to extend functionality.
 * Last updated: 2026-03-10
 */

import type { FC } from 'react';
import WidthPanel from './panels/WidthPanel';
import PromptPanel from './panels/PromptPanel';

type FloatBallPanelComponentProps = {
  side: 'left' | 'right';
  onClose: () => void;
};

export type FloatBallPanel = {
  id: string;
  icon?: string;
  labelKey: string;
  fallbackLabel?: string;
  component?: FC<FloatBallPanelComponentProps>;
  action?: () => void;
};

export const panels: FloatBallPanel[] = [
  {
    id: 'width',
    icon: 'ArrowLeftRight',
    labelKey: 'floatBall.width',
    fallbackLabel: 'Chat Width',
    component: WidthPanel,
  },
  {
    id: 'prompt',
    icon: 'BookText',
    labelKey: 'promptLibrary.title',
    fallbackLabel: 'Prompt Library',
    component: PromptPanel,
  },
  {
    id: 'export',
    icon: 'Download',
    labelKey: 'floatBall.export',
    fallbackLabel: 'Cherry-Pick Export',
    action: () => {
      // Lazy import allows decoupled architecture
      import('../ExportHub/store').then(({ exportStore }) => {
        exportStore.setIsSelectionMode(true);
      });
    }
  }
];
