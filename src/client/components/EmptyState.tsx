import { PanelRight, ServerOff } from "lucide-react";

interface EmptyStateProps {
  title: string;
  detail: string;
  kind?: "terminal" | "sessions";
}

export function EmptyState({ title, detail, kind = "terminal" }: EmptyStateProps) {
  const Icon = kind === "sessions" ? ServerOff : PanelRight;
  return (
    <div className="empty-state">
      <Icon aria-hidden="true" size={32} strokeWidth={1.8} />
      <div>
        <div className="empty-state__title">{title}</div>
        <div className="empty-state__detail">{detail}</div>
      </div>
    </div>
  );
}
