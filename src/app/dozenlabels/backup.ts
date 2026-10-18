export type PortableBoxBatch = {
  room: string;
  contents: string;
  count: number;
  fragile: boolean;
  priority: 'direct' | 'eerst' | 'later';
};

const FORMAT = 'woonpoints.private-box-labels';
const MAX_FILE_BYTES = 16 * 1024;

/** Exact offline format: no browser storage or external importer. */
export function writeBoxLabelBackup(batches: PortableBoxBatch[]) {
  return JSON.stringify({
    format: FORMAT,
    version: 1,
    batches: batches.map(({room, contents, count, fragile, priority}) =>
      ({room, contents, count, fragile, priority}))
  }, null, 2) + '\n';
}

/** Accept only our own complete canonical JSON shape, not ambiguous or partial data. */
export function readBoxLabelBackup(raw: string): PortableBoxBatch[] {
  if (new TextEncoder().encode(raw).length > MAX_FILE_BYTES || !raw || raw.includes('\u0000')) {
    throw new Error('invalid backup size');
  }
  let value: unknown;
  try { value = JSON.parse(raw); }
  catch { throw new Error('invalid backup JSON'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('invalid backup format');
  }
  const source = value as Record<string, unknown>;
  if (source.format !== FORMAT || source.version !== 1 || !Array.isArray(source.batches) ||
      source.batches.length > 20 || source.batches.length < 1) {
    throw new Error('invalid backup format');
  }
  let total = 0;
  const batches: PortableBoxBatch[] = [];
  for (const item of source.batches) {
    if (!item || typeof item !== 'object' || Array.isArray(item)) throw new Error('invalid backup entry');
    const b = item as Record<string, unknown>;
    if (typeof b.room !== 'string' || !b.room.trim() || b.room.length > 36 ||
        typeof b.contents !== 'string' || b.contents.length > 80 ||
        !Number.isSafeInteger(b.count) || (b.count as number) < 1 || (b.count as number) > 24 ||
        typeof b.fragile !== 'boolean' ||
        (b.priority !== 'direct' && b.priority !== 'eerst' && b.priority !== 'later') ||
        /[\u0000-\u001f\u007f-\u009f\u200e\u200f\u202a-\u202e\u2066-\u2069]/u.test(b.room + b.contents) ||
        b.room.trim() !== b.room || b.contents.trim() !== b.contents) {
      throw new Error('invalid backup entry');
    }
    total += b.count as number;
    if (total > 48) throw new Error('too many backup labels');
    batches.push({room: b.room, contents: b.contents, count: b.count as number,
      fragile: b.fragile, priority: b.priority});
  }
  if (writeBoxLabelBackup(batches) !== raw) {
    // Also rejects duplicate JSON keys, hidden fields and re-ordered/edited structures.
    throw new Error('noncanonical backup');
  }
  return batches;
}
