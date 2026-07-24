import { FieldErrors, FieldValues } from 'react-hook-form';

/** Flatten react-hook-form / Zod field errors into user-facing messages. */
export function getValidationErrorMessages(errors: FieldErrors<FieldValues>): string[] {
  const messages: string[] = [];

  const walk = (node: unknown) => {
    if (!node || typeof node !== 'object') return;

    const record = node as Record<string, unknown>;
    if (typeof record.message === 'string' && record.message) {
      messages.push(record.message);
      return;
    }

    Object.values(record).forEach(walk);
  };

  walk(errors);
  return [...new Set(messages)];
}

/** Scroll the first invalid field into view when possible. */
export function scrollToFirstError(errors: FieldErrors<FieldValues>) {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return;

  const byName = document.querySelector(`[name="${firstKey}"]`) as HTMLElement | null;
  if (byName) {
    byName.scrollIntoView({ behavior: 'smooth', block: 'center' });
    byName.focus?.();
    return;
  }

  // Radix Select / combobox often have no name attribute
  const labelled = Array.from(document.querySelectorAll('[aria-invalid="true"]'))[0] as
    | HTMLElement
    | undefined;
  labelled?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/** Local calendar date as YYYY-MM-DD (for date inputs max=today). */
export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** True when YYYY-MM-DD (or parseable date) is after today. */
export function isFutureDate(value?: string | null): boolean {
  if (!value) return false;
  const dateOnly = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}` > getTodayDateString();
  }
  return dateOnly > getTodayDateString();
}
