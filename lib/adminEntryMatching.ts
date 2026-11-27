type AdminEntryMatchFields = {
  [key: string]: unknown;
  _id?: unknown;
  customerName?: unknown;
  componentName?: unknown;
  internalJobOrder?: unknown;
  created?: unknown;
  createdAt?: unknown;
  updatedAt?: unknown;
};

type ProductionRecordMatchFields = {
  customerName?: unknown;
  componentName?: unknown;
  internalJobOrder?: unknown;
};

function normalizeMatchValue(value: unknown): string {
  return String(value ?? '').trim().toLowerCase();
}

function getEntryTimestamp(entry: AdminEntryMatchFields): number {
  for (const value of [entry.updatedAt, entry.createdAt]) {
    if (value == null) continue;
    const timestamp = new Date(String(value)).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }

  const id = String(entry._id ?? '');
  if (/^[\da-f]{24}$/i.test(id)) {
    return Number.parseInt(id.slice(0, 8), 16) * 1000;
  }

  if (entry.created != null) {
    const timestamp = new Date(String(entry.created)).getTime();
    if (Number.isFinite(timestamp)) return timestamp;
  }

  return 0;
}

function newestEntry<T extends AdminEntryMatchFields>(entries: T[]): T {
  return entries.reduce((newest, entry) =>
    getEntryTimestamp(entry) > getEntryTimestamp(newest) ? entry : newest
  );
}

export function findAdminEntryForRecord<T extends AdminEntryMatchFields>(
  adminEntries: readonly T[],
  record: ProductionRecordMatchFields,
): T | undefined {
  const customerName = normalizeMatchValue(record.customerName);
  const componentName = normalizeMatchValue(record.componentName);
  const internalJobOrder = normalizeMatchValue(record.internalJobOrder);
  if (!customerName || !componentName || !internalJobOrder) return undefined;

  const matchingEntries = adminEntries.filter(
    (entry) =>
      normalizeMatchValue(entry.customerName) === customerName &&
      normalizeMatchValue(entry.componentName) === componentName &&
      normalizeMatchValue(entry.internalJobOrder) === internalJobOrder,
  );
  return matchingEntries.length > 0 ? newestEntry(matchingEntries) : undefined;
}
