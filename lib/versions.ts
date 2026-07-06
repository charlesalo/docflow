// Automatic version snapshots are throttled so continuous autosave (every
// keystroke pause) doesn't create a version row per edit — only one
// checkpoint per window, capturing the document's state right before the
// next batch of edits overwrites it.
export const SNAPSHOT_THROTTLE_MS = 3 * 60 * 1000; // 3 minutes

export function shouldCreateSnapshot(lastVersionAt: Date | null, now: Date): boolean {
  if (!lastVersionAt) return true;
  return now.getTime() - lastVersionAt.getTime() >= SNAPSHOT_THROTTLE_MS;
}
