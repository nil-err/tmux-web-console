import type { ExternalLinkShortcut } from "../../shared/externalLinkTypes.js";

export type { ExternalLinkShortcut };

const CUSTOM_EXTERNAL_LINKS_STORAGE_KEY = "tmux-web-console.custom-external-links";
const EXTERNAL_LINKS_STORAGE_KEY = "tmux-web-console.external-links";

function getStorage(): Storage | undefined {
  try {
    return globalThis.localStorage;
  } catch {
    return undefined;
  }
}

function normalizeTitle(title: string): string | undefined {
  const normalized = title.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, 32) : undefined;
}

export function normalizeExternalLinkUrl(rawUrl: string): string | undefined {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    return undefined;
  }

  const candidate = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmedUrl) ? trimmedUrl : `https://${trimmedUrl}`;

  try {
    const parsedUrl = new URL(candidate);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return undefined;
    }
    return parsedUrl.toString();
  } catch {
    return undefined;
  }
}

export function createCustomExternalLink(title: string, rawUrl: string): ExternalLinkShortcut | undefined {
  const normalizedTitle = normalizeTitle(title);
  const normalizedUrl = normalizeExternalLinkUrl(rawUrl);

  if (!normalizedTitle || !normalizedUrl) {
    return undefined;
  }

  return {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
    title: normalizedTitle,
    url: normalizedUrl,
    icon: "external"
  };
}

export function updateExternalLinkShortcut(
  link: ExternalLinkShortcut,
  title: string,
  rawUrl: string
): ExternalLinkShortcut | undefined {
  const normalizedTitle = normalizeTitle(title);
  const normalizedUrl = normalizeExternalLinkUrl(rawUrl);

  if (!normalizedTitle || !normalizedUrl) {
    return undefined;
  }

  return {
    ...link,
    title: normalizedTitle,
    url: normalizedUrl
  };
}

function isStoredExternalLink(value: unknown): value is ExternalLinkShortcut {
  if (!value || typeof value !== "object") {
    return false;
  }

  const link = value as Partial<ExternalLinkShortcut>;
  return (
    typeof link.id === "string" &&
    typeof link.title === "string" &&
    typeof link.url === "string" &&
    normalizeExternalLinkUrl(link.url) === link.url
  );
}

function loadStoredExternalLinks(storageKey: string): ExternalLinkShortcut[] {
  const storage = getStorage();
  if (!storage) {
    return [];
  }

  const storedLinks = storage.getItem(storageKey);
  if (!storedLinks) {
    return [];
  }

  try {
    const parsedLinks = JSON.parse(storedLinks) as unknown;
    return Array.isArray(parsedLinks) ? parsedLinks.filter(isStoredExternalLink) : [];
  } catch {
    return [];
  }
}

export function loadLegacyExternalLinks(): ExternalLinkShortcut[] {
  const storedLinks = loadStoredExternalLinks(EXTERNAL_LINKS_STORAGE_KEY);
  if (storedLinks.length > 0) {
    return storedLinks;
  }
  return loadStoredExternalLinks(CUSTOM_EXTERNAL_LINKS_STORAGE_KEY);
}

export function clearLegacyExternalLinks(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.removeItem(EXTERNAL_LINKS_STORAGE_KEY);
  storage.removeItem(CUSTOM_EXTERNAL_LINKS_STORAGE_KEY);
}
