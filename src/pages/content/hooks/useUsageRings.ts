/**
 * useUsageRings.ts
 * Purpose: Maintains the floating usage ring data with polling and manual refresh support.
 * Created: 2026-04-03
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchUsageData, type UsageData } from '../services/usage';

type UseUsageRingsApi = {
  usageData: UsageData | null;
  refreshUsage: () => Promise<void>;
};

const USAGE_REFRESH_INTERVAL_MS = 60_000;

/**
 * Loads and refreshes account usage data for the FloatBall usage rings.
 * Failing requests are ignored so the rest of the page stays functional.
 */
export const useUsageRings = (): UseUsageRingsApi => {
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const mountedRef = useRef(true);
  const inFlightRef = useRef(false);

  const refreshUsage = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    try {
      const next = await fetchUsageData();
      if (!mountedRef.current || !next) return;
      setUsageData(next);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    void refreshUsage();

    const timer = window.setInterval(() => {
      void refreshUsage();
    }, USAGE_REFRESH_INTERVAL_MS);

    return () => {
      mountedRef.current = false;
      window.clearInterval(timer);
    };
  }, [refreshUsage]);

  return { usageData, refreshUsage };
};
