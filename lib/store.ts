import { randomUUID } from "node:crypto";
import type { AppMetadata, AppMetadataInput } from "./types";

type Store = {
  apps: Map<string, AppMetadata>;
};

const globalForStore = globalThis as unknown as { __appmetaStore?: Store };

function getStore(): Store {
  if (!globalForStore.__appmetaStore) {
    globalForStore.__appmetaStore = { apps: new Map() };
    seed(globalForStore.__appmetaStore);
  }
  return globalForStore.__appmetaStore;
}

function seed(store: Store) {
  const now = new Date().toISOString();
  const samples: AppMetadata[] = [
    {
      id: randomUUID(),
      name: "Pomodoro Pro",
      slug: "pomodoro-pro",
      description: "Focus timer with task tracking and analytics.",
      version: "2.4.1",
      platform: "ios",
      status: "published",
      category: "Productivity",
      tags: ["timer", "focus", "productivity"],
      iconUrl: null,
      storeUrl: "https://apps.apple.com/app/pomodoro-pro",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: randomUUID(),
      name: "Habit Garden",
      slug: "habit-garden",
      description: "Grow virtual plants by completing daily habits.",
      version: "1.0.3",
      platform: "android",
      status: "draft",
      category: "Health & Fitness",
      tags: ["habits", "gamification"],
      iconUrl: null,
      storeUrl: null,
      createdAt: now,
      updatedAt: now,
    },
  ];
  for (const app of samples) store.apps.set(app.id, app);
}

export function listApps(): AppMetadata[] {
  return Array.from(getStore().apps.values()).sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
}

export function getApp(id: string): AppMetadata | undefined {
  return getStore().apps.get(id);
}

export function createApp(input: AppMetadataInput): AppMetadata {
  const now = new Date().toISOString();
  const app: AppMetadata = {
    ...input,
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
  };
  getStore().apps.set(app.id, app);
  return app;
}

export function updateApp(
  id: string,
  patch: Partial<AppMetadataInput>,
): AppMetadata | undefined {
  const store = getStore();
  const existing = store.apps.get(id);
  if (!existing) return undefined;
  const updated: AppMetadata = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  store.apps.set(id, updated);
  return updated;
}

export function deleteApp(id: string): boolean {
  return getStore().apps.delete(id);
}
