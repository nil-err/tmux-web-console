import { Bot, ChevronLeft, ChevronRight, ExternalLink, Layers, Pencil, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchExternalLinksConfig, saveExternalLinksConfig } from "../api/externalLinksApi.js";
import {
  clearLegacyExternalLinks,
  createCustomExternalLink,
  loadLegacyExternalLinks,
  updateExternalLinkShortcut,
  type ExternalLinkShortcut
} from "../state/externalLinks.js";

const EXTERNAL_LINK_ICONS = {
  bot: Bot,
  external: ExternalLink,
  layers: Layers
};

function openExternalLink(url: string) {
  globalThis.open(url, "_blank", "noopener,noreferrer");
}

interface ExternalLinksGridProps {
  editable: boolean;
}

export function ExternalLinksGrid({ editable }: ExternalLinksGridProps) {
  const [links, setLinks] = useState<ExternalLinkShortcut[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadLinks() {
      try {
        const response = await fetchExternalLinksConfig();
        let nextLinks = response.links;
        const legacyLinks = nextLinks.length === 0 ? loadLegacyExternalLinks() : [];
        if (legacyLinks.length > 0) {
          nextLinks = (await saveExternalLinksConfig(legacyLinks)).links;
          clearLegacyExternalLinks();
        }
        if (!cancelled) {
          setLinks(nextLinks);
        }
      } catch {
        if (!cancelled) {
          setLinks(loadLegacyExternalLinks());
        }
      }
    }

    void loadLinks();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveLinks = async (nextLinks: ExternalLinkShortcut[]) => {
    const previousLinks = links;
    setLinks(nextLinks);
    try {
      const response = await saveExternalLinksConfig(nextLinks);
      setLinks(response.links);
    } catch {
      setLinks(previousLinks);
      globalThis.alert?.("Unable to save external links.");
    }
  };

  const addCustomLink = () => {
    const title = globalThis.prompt?.("Link name") ?? "";
    if (!title.trim()) {
      return;
    }

    const rawUrl = globalThis.prompt?.("Link URL") ?? "";
    const link = createCustomExternalLink(title, rawUrl);
    if (!link) {
      globalThis.alert?.("Enter a valid http(s) URL.");
      return;
    }

    void saveLinks([...links, link]);
  };

  const editLink = (link: ExternalLinkShortcut) => {
    const title = globalThis.prompt?.("Link name", link.title);
    if (title === null || title === undefined) {
      return;
    }

    const rawUrl = globalThis.prompt?.("Link URL", link.url);
    if (rawUrl === null || rawUrl === undefined) {
      return;
    }

    const nextLink = updateExternalLinkShortcut(link, title, rawUrl);
    if (!nextLink) {
      globalThis.alert?.("Enter a valid http(s) URL.");
      return;
    }

    void saveLinks(links.map((item) => (item.id === link.id ? nextLink : item)));
  };

  const moveLink = (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= links.length) {
      return;
    }

    const nextLinks = [...links];
    const [movedLink] = nextLinks.splice(index, 1);
    if (!movedLink) {
      return;
    }

    nextLinks.splice(targetIndex, 0, movedLink);
    void saveLinks(nextLinks);
  };

  return (
    <div className="external-links-grid" aria-label="External links">
      {links.map((link, index) => {
        const Icon = EXTERNAL_LINK_ICONS[link.icon];
        return (
          <div key={link.id} className="external-link-tile">
            <button
              aria-label={`Open ${link.title}`}
              className="external-link-button"
              title={link.title}
              type="button"
              onClick={() => openExternalLink(link.url)}
            >
              <Icon aria-hidden="true" size={18} strokeWidth={2} />
              <span>{link.title}</span>
            </button>
            {editable ? (
              <>
                <button
                  aria-label={`Edit ${link.title}`}
                  className="external-link-edit-button"
                  title={`Edit ${link.title}`}
                  type="button"
                  onClick={() => editLink(link)}
                >
                  <Pencil aria-hidden="true" size={12} strokeWidth={2.2} />
                </button>
                <div className="external-link-reorder-controls">
                  <button
                    aria-label={`Move ${link.title} left`}
                    className="external-link-reorder-button"
                    disabled={index === 0}
                    title={`Move ${link.title} left`}
                    type="button"
                    onClick={() => moveLink(index, -1)}
                  >
                    <ChevronLeft aria-hidden="true" size={13} strokeWidth={2.4} />
                  </button>
                  <button
                    aria-label={`Move ${link.title} right`}
                    className="external-link-reorder-button"
                    disabled={index === links.length - 1}
                    title={`Move ${link.title} right`}
                    type="button"
                    onClick={() => moveLink(index, 1)}
                  >
                    <ChevronRight aria-hidden="true" size={13} strokeWidth={2.4} />
                  </button>
                </div>
              </>
            ) : null}
          </div>
        );
      })}
      {editable ? (
        <button
          aria-label="Add external link"
          className="external-link-button external-link-button--add"
          title="Add external link"
          type="button"
          onClick={addCustomLink}
        >
          <Plus aria-hidden="true" size={18} strokeWidth={2.2} />
          <span>Add</span>
        </button>
      ) : null}
    </div>
  );
}
