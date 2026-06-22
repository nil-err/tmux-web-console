export type ExternalLinkIcon = "bot" | "layers" | "external";

export interface ExternalLinkShortcut {
  id: string;
  title: string;
  url: string;
  icon: ExternalLinkIcon;
}

export interface ExternalLinksResponse {
  links: ExternalLinkShortcut[];
}
