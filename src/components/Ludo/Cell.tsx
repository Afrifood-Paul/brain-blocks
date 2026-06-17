import type { ReactNode, CSSProperties } from "react";

interface CellProps {
  col: number;
  row: number;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

export function Cell({ col, row, className = "", style, children }: CellProps) {
  return (
    <div
      data-col={col}
      data-row={row}
      className={`border border-neutral-300 ${className}`}
      style={{ gridColumn: col, gridRow: row, ...style }}
    >
      {children}
    </div>
  );
}
