// ui/badge.tsx
import type { PropsWithChildren } from "react";

type BadgeColor = "green" | "red" | "gray";

type BadgeProps = PropsWithChildren<{
  color?: BadgeColor;
}>;

export default function Badge({ children, color = "gray" }: BadgeProps) {
  const map: Record<BadgeColor, string> = {
    green: "bg-green-100 text-green-800 border-green-200",
    red: "bg-red-100 text-red-800 border-red-200",
    gray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${map[color]}`}
    >
      {children}
    </span>
  );
}
