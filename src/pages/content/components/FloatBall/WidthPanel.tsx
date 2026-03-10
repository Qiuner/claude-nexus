/**
 * WidthPanel.tsx
 * Purpose: Floating ball panel that controls the chat width override.
 * Last updated: 2026-03-10
 */

import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, X } from 'lucide-react';
import { CHAT_WIDTH_RANGE, useWidthControl } from '../../hooks/useWidthControl';

type Props = {
  /** Where the panel should expand (relative to the ball). */
  side: 'left' | 'right';
  /** Close callback triggered by the panel close button. */
  onClose: () => void;
};

/**
 * Width control panel shown next to the floating ball
 * @param props Props
 * @returns JSX.Element
 *
 * Modification Notes:
 *   - 2026-03-10 Added documentation for readability and maintenance.
 */
export default function WidthPanel({ side, onClose }: Props) {
  const { t } = useTranslation();
  const { chatWidth, setChatWidth } = useWidthControl();

  const displayValue = useMemo(() => `${Math.round(chatWidth)}rem`, [chatWidth]);

  const sideClass = side === 'left' ? 'right-full mr-3' : 'left-full ml-3';
  const arrowWrapperClass = side === 'left' ? 'left-full' : 'right-full';
  const arrowBorderClass = side === 'left' ? 'border-l-[#e5e0d8]' : 'border-r-[#e5e0d8]';
  const arrowFillClass = side === 'left' ? 'border-l-white' : 'border-r-white';
  const arrowBorderOffsetClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div className={`absolute top-1/2 -translate-y-1/2 ${sideClass} z-50`}>
      <div className="relative w-[18rem] rounded-xl border border-[#e5e0d8] bg-white p-3 text-[#374151] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[12px] font-medium">{t('widthControl.title')}</div>
          <button
            type="button"
            className="rounded p-1 text-[#6b7280] hover:bg-zinc-100"
            aria-label={t('widthControl.closeAria')}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mb-2 flex items-center justify-between text-[12px] text-[#6b7280]">
          <div>{t('widthControl.valueLabel')}</div>
          <div className="font-medium text-[#374151]">{displayValue}</div>
        </div>

        <input
          type="range"
          min={CHAT_WIDTH_RANGE.min}
          max={CHAT_WIDTH_RANGE.max}
          step={1}
          value={Math.round(chatWidth)}
          onChange={(e) => setChatWidth(Number(e.target.value))}
          className="w-full"
          aria-label={t('widthControl.sliderAria')}
        />

        <div className="mt-3 flex justify-end">
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg border border-[#e5e0d8] bg-white px-2 py-1 text-[12px] text-[#374151] hover:bg-zinc-50"
            onClick={() => setChatWidth(CHAT_WIDTH_RANGE.defaultValue)}
          >
            <RotateCcw className="h-4 w-4 text-[#6b7280]" aria-hidden="true" />
            {t('common.reset')}
          </button>
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
}
