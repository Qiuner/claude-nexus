/**
 * usage.ts
 * Purpose: Fetches Claude organization usage data for the floating usage rings.
 * Created: 2026-04-03
 */

export type UsageData = {
  fiveHour: number;
  sevenDay: number;
  fiveResetAt: string;
  sevenResetAt: string;
};

const ORGANIZATIONS_URL = 'https://claude.ai/api/organizations';

const clampPercentage = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const parseOrganizationId = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    const first = value[0];
    if (!first || typeof first !== 'object') return null;
    const uuid = (first as { uuid?: unknown }).uuid;
    return typeof uuid === 'string' && uuid ? uuid : null;
  }

  if (!value || typeof value !== 'object') return null;
  const organizations = (value as { organizations?: unknown }).organizations;
  return parseOrganizationId(organizations);
};

const parseUsageData = (value: unknown): UsageData | null => {
  if (!value || typeof value !== 'object') return null;

  const fiveHour = (value as { five_hour?: unknown }).five_hour;
  const sevenDay = (value as { seven_day?: unknown }).seven_day;

  if (!fiveHour || typeof fiveHour !== 'object') return null;
  if (!sevenDay || typeof sevenDay !== 'object') return null;

  const fiveUtilization = (fiveHour as { utilization?: unknown }).utilization;
  const sevenUtilization = (sevenDay as { utilization?: unknown }).utilization;
  const fiveResetAt = (fiveHour as { resets_at?: unknown }).resets_at;
  const sevenResetAt = (sevenDay as { resets_at?: unknown }).resets_at;

  if (typeof fiveUtilization !== 'number' || Number.isNaN(fiveUtilization) || !Number.isFinite(fiveUtilization)) return null;
  if (typeof sevenUtilization !== 'number' || Number.isNaN(sevenUtilization) || !Number.isFinite(sevenUtilization)) return null;
  if (typeof fiveResetAt !== 'string' || !fiveResetAt) return null;
  if (typeof sevenResetAt !== 'string' || !sevenResetAt) return null;

  return {
    fiveHour: clampPercentage(fiveUtilization),
    sevenDay: clampPercentage(sevenUtilization),
    fiveResetAt,
    sevenResetAt,
  };
};

const fetchJson = async (url: string): Promise<unknown | null> => {
  try {
    const response = await window.fetch(url, {
      credentials: 'include',
      cache: 'no-store',
      headers: {
        accept: 'application/json',
      },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
};

/**
 * Fetches usage data for the first available Claude organization.
 * Returns null when the API is unavailable or the payload cannot be parsed.
 */
export const fetchUsageData = async (): Promise<UsageData | null> => {
  const organizations = await fetchJson(ORGANIZATIONS_URL);
  const organizationId = parseOrganizationId(organizations);
  if (!organizationId) return null;

  const usage = await fetchJson(`https://claude.ai/api/organizations/${organizationId}/usage`);
  return parseUsageData(usage);
};
