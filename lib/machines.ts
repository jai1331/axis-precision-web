/** Default machines always available (seeded into DB on first load). */
export const DEFAULT_MACHINES = ['TC-1', 'TC-2', 'TC-3', 'VMC', 'VMC-2'] as const;

export type DefaultMachine = (typeof DEFAULT_MACHINES)[number];

/** Normalize machine name for storage / comparison. */
export function normalizeMachineName(value: unknown): string {
  return String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase();
}

/** Fetch active machine names from API (falls back to defaults). */
export async function fetchMachines(): Promise<string[]> {
  try {
    const response = await fetch('/api/machines');
    if (!response.ok) return [...DEFAULT_MACHINES];
    const data = await response.json();
    const list = Array.isArray(data?.machines) ? data.machines.map(String) : [];
    if (!list.length) return [...DEFAULT_MACHINES];
    return Array.from(new Set([...DEFAULT_MACHINES, ...list]));
  } catch {
    return [...DEFAULT_MACHINES];
  }
}
