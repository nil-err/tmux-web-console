import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ExternalLinksConfigService } from "../../src/server/config/externalLinksConfigService.js";

describe("ExternalLinksConfigService", () => {
  let tempDir: string;
  let configPath: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "tmux-web-console-config-"));
    configPath = path.join(tempDir, "config.json");
  });

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it("returns an empty external link list when the config file does not exist", async () => {
    const service = new ExternalLinksConfigService({ configPath });

    await expect(service.getExternalLinks()).resolves.toEqual({ links: [] });
  });

  it("persists external links to the server config file", async () => {
    const service = new ExternalLinksConfigService({ configPath });

    await expect(
      service.saveExternalLinks([
        {
          id: "docs",
          title: "Docs",
          url: "https://docs.example.com/",
          icon: "external"
        }
      ])
    ).resolves.toEqual({
      links: [
        {
          id: "docs",
          title: "Docs",
          url: "https://docs.example.com/",
          icon: "external"
        }
      ]
    });

    await expect(service.getExternalLinks()).resolves.toEqual({
      links: [
        {
          id: "docs",
          title: "Docs",
          url: "https://docs.example.com/",
          icon: "external"
        }
      ]
    });
    await expect(JSON.parse(await fs.readFile(configPath, "utf8"))).toEqual({
      externalLinks: [
        {
          id: "docs",
          title: "Docs",
          url: "https://docs.example.com/",
          icon: "external"
        }
      ]
    });
  });

  it("rejects invalid external link config instead of writing it", async () => {
    const service = new ExternalLinksConfigService({ configPath });

    await expect(
      service.saveExternalLinks([
        {
          id: "bad",
          title: "Bad",
          url: "javascript:alert(1)",
          icon: "external"
        }
      ])
    ).rejects.toThrow("Invalid external link config");

    await expect(fs.stat(configPath)).rejects.toThrow();
  });
});
