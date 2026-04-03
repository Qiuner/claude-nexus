/**
 * UsageRings.tsx
 * Purpose: Renders floating usage rings and a delayed hover tooltip around the FloatBall.
 * Created: 2026-04-03
 */

import type { ReactNode } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { UsageData } from '../../services/usage';

type Props = {
  data: UsageData | null;
  side: 'left' | 'right';
  isDragging: boolean;
  children: ReactNode;
};

const RING_VIEWBOX_SIZE = 96;
const RING_CENTER = RING_VIEWBOX_SIZE / 2;
const INNER_RADIUS = 37;
const OUTER_RADIUS = 41;
const RING_STROKE_WIDTH = 4;
const RING_START_ANGLE = -90;
const HOVER_TOOLTIP_DELAY_MS = 500;
const DAY_MS = 24 * 60 * 60 * 1000;

const clampPercentage = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const getUsageColor = (value: number) => {
  if (value < 50) return '#16a34a';
  if (value < 80) return '#f59e0b';
  return '#ef4444';
};

const getRingMetrics = (radius: number, usedPct: number) => {
  const circumference = 2 * Math.PI * radius;
  return {
    circumference,
    offset: circumference * (1 - usedPct / 100),
  };
};

export default function UsageRings({ data, side, isDragging, children }: Props) {
  const { t } = useTranslation();
  const hoverTimerRef = useRef<number | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const clearHoverTimer = () => {
    if (!hoverTimerRef.current) return;
    window.clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = null;
  };

  useEffect(() => {
    return () => clearHoverTimer();
  }, []);

  useEffect(() => {
    if (data && !isDragging) return;
    clearHoverTimer();
    setShowTooltip(false);
  }, [data, isDragging]);

  const handleMouseEnter = () => {
    if (!data || isDragging) return;
    clearHoverTimer();
    hoverTimerRef.current = window.setTimeout(() => {
      setShowTooltip(true);
      hoverTimerRef.current = null;
    }, HOVER_TOOLTIP_DELAY_MS);
  };

  const handleMouseLeave = () => {
    clearHoverTimer();
    setShowTooltip(false);
  };

  const usage = useMemo(() => {
    if (!data) return null;

    const fiveHourUsed = clampPercentage(data.fiveHour);
    const sevenDayUsed = clampPercentage(data.sevenDay);

    return {
      fiveHourUsed,
      fiveHourRemaining: 100 - fiveHourUsed,
      sevenDayUsed,
      sevenDayRemaining: 100 - sevenDayUsed,
      fiveHourMetrics: getRingMetrics(INNER_RADIUS, fiveHourUsed),
      sevenDayMetrics: getRingMetrics(OUTER_RADIUS, sevenDayUsed),
    };
  }, [data]);

  const tooltipPayload = useMemo(() => {
    if (!usage || !data) return null;
    return { usage, data };
  }, [usage, data]);

  const formatResetLabel = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return t('usageRings.resetUnknown');

    const diffMs = date.getTime() - Date.now();
    const timeText = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);

    if (diffMs <= DAY_MS) return t('usageRings.resetToday', { time: timeText });
    if (diffMs <= 2 * DAY_MS) return t('usageRings.resetTomorrow', { time: timeText });
    return t('usageRings.resetInDays', {
      days: Math.max(1, Math.ceil(diffMs / DAY_MS)),
    });
  };

  const sideClass = side === 'left' ? 'right-full mr-3' : 'left-full ml-3';
  const arrowWrapperClass = side === 'left' ? 'left-full' : 'right-full';
  const arrowBorderClass = side === 'left' ? 'border-l-[#e5e0d8]' : 'border-r-[#e5e0d8]';
  const arrowFillClass = side === 'left' ? 'border-l-white' : 'border-r-white';
  const arrowBorderOffsetClass = side === 'left' ? 'left-0' : 'right-0';

  return (
    <div
      className="relative flex size-full items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {usage ? (
        <svg
          className="pointer-events-none absolute inset-0"
          viewBox={`0 0 ${RING_VIEWBOX_SIZE} ${RING_VIEWBOX_SIZE}`}
          aria-hidden="true"
          style={{
            filter: 'drop-shadow(0 1px 4px rgba(201, 100, 66, 0.12))',
          }}
        >
          <g transform={`rotate(${RING_START_ANGLE} ${RING_CENTER} ${RING_CENTER})`}>
            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={OUTER_RADIUS}
              fill="none"
              stroke={getUsageColor(usage.sevenDayUsed)}
              strokeWidth={RING_STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={usage.sevenDayMetrics.circumference}
              strokeDashoffset={usage.sevenDayMetrics.offset}
            />
            <circle
              cx={RING_CENTER}
              cy={RING_CENTER}
              r={INNER_RADIUS}
              fill="none"
              stroke={getUsageColor(usage.fiveHourUsed)}
              strokeWidth={RING_STROKE_WIDTH}
              strokeLinecap="round"
              strokeDasharray={usage.fiveHourMetrics.circumference}
              strokeDashoffset={usage.fiveHourMetrics.offset}
            />
          </g>
        </svg>
      ) : null}

      <div className="relative z-10">{children}</div>

      {tooltipPayload && showTooltip ? (
        <div className={`pointer-events-none absolute top-1/2 -translate-y-1/2 ${sideClass} z-50`}>
          <div className="relative w-[15rem] rounded-xl border border-[#e5e0d8] bg-white p-3 text-[12px] text-[#374151] shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
            <div className="space-y-3">
              <div>
                <div className="mb-1 font-medium text-[#111827]">{t('usageRings.fiveHourWindow')}</div>
                <div>{t('usageRings.usedPercent', { value: tooltipPayload.usage.fiveHourUsed })}</div>
                <div>{t('usageRings.remainingPercent', { value: tooltipPayload.usage.fiveHourRemaining })}</div>
                <div className="text-[#6b7280]">{formatResetLabel(tooltipPayload.data.fiveResetAt)}</div>
              </div>

              <div className="h-px bg-[#f1ece4]" />

              <div>
                <div className="mb-1 font-medium text-[#111827]">{t('usageRings.sevenDayWindow')}</div>
                <div>{t('usageRings.usedPercent', { value: tooltipPayload.usage.sevenDayUsed })}</div>
                <div>{t('usageRings.remainingPercent', { value: tooltipPayload.usage.sevenDayRemaining })}</div>
                <div className="text-[#6b7280]">{formatResetLabel(tooltipPayload.data.sevenResetAt)}</div>
              </div>
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
      ) : null}
    </div>
  );
}
