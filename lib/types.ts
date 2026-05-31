export type Platform = "ios" | "android" | "web" | "desktop";

export type AppStatus = "draft" | "published" | "archived";

export interface AppMetadata {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  platform: Platform;
  status: AppStatus;
  category: string;
  tags: string[];
  iconUrl: string | null;
  storeUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AppMetadataInput = Omit<AppMetadata, "id" | "createdAt" | "updatedAt">;
