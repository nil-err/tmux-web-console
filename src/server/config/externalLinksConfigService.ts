import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import type { ExternalLinkIcon, ExternalLinkShortcut, ExternalLinksResponse } from "../../shared/externalLinkTypes.js";
import { AppError } from "../utils/errors.js";

interface TmuxWebConsoleConfig {
  externalLinks?: ExternalLinkShortcut[];
}

interface ExternalLinksConfigServiceOptions {
  configPath?: string;
}

const allowedIcons = new Set<ExternalLinkIcon>(["bot", "external", "layers"]);

function defaultConfigPath(): string {
  return process.env.TMUX_WEB_CONFIG_FILE ?? path.join(os.homedir(), ".config", "tmux-web-console", "config.json");
}

function normalizeTitle(title: string): string | undefined {
  const normalized = title.trim().replace(/\s+/g, " ");
  return normalized ? normalized.slice(0, 32) : undefined;
}

function normalizeExternalLinkUrl(rawUrl: string): string | undefined {
  const trimmedUrl = rawUrl.trim();
  if (!trimmedUrl) {
    return undefined;
  }

  try {
    const parsedUrl = new URL(trimmedUrl);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return undefined;
    }
    return parsedUrl.toString();
  } catch {
    return undefined;
  }
}

function normalizeExternalLink(value: unknown): ExternalLinkShortcut | undefined {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const link = value as Partial<ExternalLinkShortcut>;
  if (typeof link.id !== "string" || typeof link.title !== "string" || typeof link.url !== "string") {
    return undefined;
  }

  const icon = link.icon && allowedIcons.has(link.icon) ? link.icon : undefined;
  const title = normalizeTitle(link.title);
  const url = normalizeExternalLinkUrl(link.url);
  if (!icon || !title || !url) {
    return undefined;
  }

  return {
    id: link.id.trim().slice(0, 80),
    title,
    url,
    icon
  };
}

function normalizeExternalLinks(value: unknown): ExternalLinkShortcut[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const links = value.map(normalizeExternalLink);
  if (links.some((link) => !link)) {
    return undefined;
  }
  return links.filter((link): link is ExternalLinkShortcut => Boolean(link)).slice(0, 30);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

export class ExternalLinksConfigService {
  private readonly configPath: string;

  constructor(options: ExternalLinksConfigServiceOptions = {}) {
    this.configPath = options.configPath ?? defaultConfigPath();
  }

  async getExternalLinks(): Promise<ExternalLinksResponse> {
    const config = await this.readConfig();
    const links = normalizeExternalLinks(config.externalLinks);
    return { links: links ?? [] };
  }

  async saveExternalLinks(rawLinks: unknown): Promise<ExternalLinksResponse> {
    const links = normalizeExternalLinks(rawLinks);
    if (!links) {
      throw new AppError("INVALID_EXTERNAL_LINKS", "Invalid external link config", 400);
    }

    const config = await this.readConfig();
    config.externalLinks = links;
    await fs.mkdir(path.dirname(this.configPath), { recursive: true });
    await fs.writeFile(this.configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
    return { links };
  }

  private async readConfig(): Promise<TmuxWebConsoleConfig> {
    try {
      const rawConfig = await fs.readFile(this.configPath, "utf8");
      const config = JSON.parse(rawConfig) as unknown;
      return config && typeof config === "object" && !Array.isArray(config) ? config : {};
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return {};
      }
      throw new AppError("CONFIG_READ_FAILED", "Unable to read tmux-web-console config", 500);
    }
  }
}
