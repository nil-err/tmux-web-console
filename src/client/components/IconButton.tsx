import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";

interface IconButtonProps {
  icon: ComponentType<LucideProps>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "ghost" | "primary" | "danger";
}

export function IconButton({ icon: Icon, label, onClick, disabled, variant = "ghost" }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`icon-button icon-button--${variant}`}
      disabled={disabled}
      title={label}
      type="button"
      onClick={onClick}
    >
      <Icon aria-hidden="true" size={17} strokeWidth={2} />
    </button>
  );
}
