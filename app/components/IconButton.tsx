import type { ReactNode } from "react";

export interface IconButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  ariaLabel: string;
}

export function IconButton({
  children,
  onClick,
  className,
  ariaLabel,
}: IconButtonProps) {
  return (
    <button className={className} onClick={onClick}>
      <span className="sr-only">{ariaLabel}</span>
      {children}
    </button>
  );
}
