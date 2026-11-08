/**
 * ChronoCraft - Gist Sync Service
 * Push local IndexedDB snapshot to a GitHub Gist, pull + merge remote changes.
 * Last-write-wins conflict resolution by `updatedAt` / `completedAt`.
 */

import { appDb } from "./db";

const GIST_API = "https://api.github.com/gists";
const SNAPSHOT_FILENAME = "chronocraft-sync.json";
const SNAPSHOT_VERSION = 1;

export interface GistSyncConfig {
  token: string;
  gistId: string;
}

export interface SyncResult {
  ok: boolean;
  gistId?: string;
  pushed: number;
  pulled: number;
  error?: string;
}

interface SnapshotPayload {
  version: number;
  exportedAt: string;
  stores: Record<string, any[]>;
}

const SYNC_STORES = [
  "entries",
  "notes",
  "events",
  "habits",
  "habit_logs",
  "lists",
  "list_items",
  "custom_tabs",
  "scratchpad",
] as const;

// ---------- helpers ----------

async function ghFetch(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

/** Pick the field that determines recency. Different stores use different fields. */
function recencyKey(record: any): number {
  const candidates = [
    record.updatedAt,
    record.completedAt,
    record.createdAt,
    record.lastModified,
  ];
  for (const c of candidates) {
    if (c) {
      const t = new Date(c).getTime();
      if (!isNaN(t)) return t;
    }
  }
  return 0;
}

// ---------- snapshot ----------

export async function buildSnapshot(): Promise<SnapshotPayload> {
  const stores: Record<string, any[]> = {};
  for (const name of SYNC_STORES) {
    stores[name] = await appDb.getAll(name);
  }
  return {
    version: SNAPSHOT_VERSION,
    exportedAt: new Date().toISOString(),
    stores,
  };
}

// ---------- gist create / update / read ----------

async function createGist(
  token: string,
  payload: SnapshotPayload,
): Promise<string> {
  const res = await ghFetch(GIST_API, token, {
    method: "POST",
    body: JSON.stringify({
      description: "ChronoCraft sync snapshot",
      public: false,
      files: {
        [SNAPSHOT_FILENAME]: { content: JSON.stringify(payload, null, 2) },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Create gist failed (${res.status}): ${err}`);
  }
  const json = await res.json();
  return json.id as string;
}

async function updateGist(
  token: string,
  gistId: string,
  payload: SnapshotPayload,
): Promise<void> {
  const res = await ghFetch(`${GIST_API}/${gistId}`, token, {
    method: "PATCH",
    body: JSON.stringify({
      files: {
        [SNAPSHOT_FILENAME]: { content: JSON.stringify(payload, null, 2) },
      },
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Update gist failed (${res.status}): ${err}`);
  }
}

async function readGist(
  token: string,
  gistId: string,
): Promise<SnapshotPayload | null> {
  const res = await ghFetch(`${GIST_API}/${gistId}`, token, { method: "GET" });
  if (res.status === 404) return null;
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Read gist failed (${res.status}): ${err}`);
  }
  const json = await res.json();
  const file = json.files?.[SNAPSHOT_FILENAME];
  if (!file) return null;
  // GitHub truncates very large files in the gist JSON; re-fetch raw if so
  let content: string = file.content;
  if (file.truncated && file.raw_url) {
    const raw = await fetch(file.raw_url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    content = await raw.text();
  }
  try {
    return JSON.parse(content) as SnapshotPayload;
  } catch {
    return null;
  }
}

// ---------- merge ----------

/**
 * Merge remote records into local DB.
 * - Records missing locally → insert.
 * - Records present locally with newer remote timestamp → overwrite.
 * - Records present locally with newer local timestamp → keep local.
 * Deleted records are NOT propagated in this v1 (add tombstones later if needed).
 */
async function mergeSnapshot(
  remote: SnapshotPayload,
): Promise<{ pushed: number; pulled: number }> {
  let pulled = 0;

  for (const storeName of SYNC_STORES) {
    const remoteList = remote.stores[storeName];
    if (!Array.isArray(remoteList) || remoteList.length === 0) continue;

    const localList = await appDb.getAll<any>(storeName);
    const localMap = new Map(localList.map((r) => [r.id, r]));

    for (const remoteRecord of remoteList) {
      if (!remoteRecord?.id) continue;
      const localRecord = localMap.get(remoteRecord.id);

      if (!localRecord) {
        await appDb.put(storeName as any, remoteRecord);
        pulled++;
        continue;
      }

      const remoteT = recencyKey(remoteRecord);
      const localT = recencyKey(localRecord);

      if (remoteT > localT) {
        await appDb.put(storeName as any, remoteRecord);
        pulled++;
      }
    }
  }

  return { pushed: 0, pulled };
}

// ---------- public API ----------

export async function pushToGist(
  token: string,
  existingGistId: string,
): Promise<{ gistId: string; pushed: number }> {
  const snapshot = await buildSnapshot();
  let gistId = existingGistId;

  if (!gistId) {
    gistId = await createGist(token, snapshot);
  } else {
    await updateGist(token, gistId, snapshot);
  }

  const total = Object.values(snapshot.stores).reduce(
    (n, list) => n + list.length,
    0,
  );
  return { gistId, pushed: total };
}

export async function pullFromGist(
  token: string,
  gistId: string,
): Promise<{ pulled: number }> {
  const remote = await readGist(token, gistId);
  if (!remote) return { pulled: 0 };
  const { pulled } = await mergeSnapshot(remote);
  return { pulled };
}

export async function syncWithGist(
  token: string,
  gistId: string,
): Promise<SyncResult> {
  try {
    // 1. Pull first (merge remote → local)
    const remote = await readGist(token, gistId);
    let pulled = 0;
    if (remote) {
      const merged = await mergeSnapshot(remote);
      pulled = merged.pulled;
    }

    // 2. Push local state back (single write covers the merged result)
    const snapshot = await buildSnapshot();
    let finalGistId = gistId;

    if (!finalGistId) {
      finalGistId = await createGist(token, snapshot);
    } else {
      await updateGist(token, finalGistId, snapshot);
    }

    const pushed = Object.values(snapshot.stores).reduce(
      (n, list) => n + list.length,
      0,
    );

    return { ok: true, gistId: finalGistId, pushed, pulled };
  } catch (err: any) {
    return {
      ok: false,
      pushed: 0,
      pulled: 0,
      error: err?.message || String(err),
    };
  }
}
