interface LogoMarkProps {
  className?: string;
  /**
   * "color"  — navy bg shape + indigo fg shape (use on light backgrounds)
   * "onDark" — white bg shape + indigo fg shape (use on dark/navy backgrounds)
   * "white"  — both shapes white (single-color, any dark bg)
   * "dark"   — both shapes navy (single-color, any light bg)
   */
  variant?: "color" | "onDark" | "white" | "dark";
}

export function ShipDeskLogoMark({ className = "w-7 h-7", variant = "color" }: LogoMarkProps) {
  const bgFill =
    variant === "color" ? "#0F172A" :
    variant === "onDark" ? "rgba(255,255,255,0.85)" :
    variant === "white" ? "white" :
    "#0F172A";

  const fgFill =
    variant === "white" ? "white" :
    variant === "dark" ? "#0F172A" :
    "#6366F1";

  const fgOpacity = (variant === "white" || variant === "dark") ? "1" : "0.92";

  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="36" y="14" width="28" height="72" rx="14"
        transform="rotate(45 50 50)"
        fill={bgFill}
      />
      <rect
        x="36" y="14" width="28" height="72" rx="14"
        transform="rotate(-45 50 50)"
        fill={fgFill}
        fillOpacity={fgOpacity}
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  variant?: LogoMarkProps["variant"];
  gap?: string;
}

export function ShipDeskLogo({
  className = "flex items-center gap-2.5",
  markClassName = "w-7 h-7",
  textClassName,
  variant = "color",
  gap,
}: LogoProps) {
  const defaultTextColor =
    variant === "color" ? "text-foreground" :
    variant === "onDark" || variant === "white" ? "text-white" :
    "text-[#0F172A]";

  return (
    <span className={`${className}${gap ? ` gap-${gap}` : ""} flex items-center`}>
      <ShipDeskLogoMark className={markClassName} variant={variant} />
      <span
        className={`font-bold tracking-tight ${textClassName ?? defaultTextColor}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        ShipDesk
      </span>
    </span>
  );
}
