import { motion } from "framer-motion";

interface LogoMarkProps {
  className?: string;
  /**
   * "color"  — navy bg shape + indigo fg shape (use on light backgrounds)
   * "onDark" — white bg shape + indigo fg shape (use on dark/navy backgrounds)
   * "white"  — both shapes white (single-color, any dark bg)
   * "dark"   — both shapes navy (single-color, any light bg)
   */
  variant?: "color" | "onDark" | "white" | "dark";
  /** Disable entrance animation (e.g. inside already-animated parents) */
  animate?: boolean;
}

export function ShipDeskLogoMark({
  className = "w-7 h-7",
  variant = "color",
  animate = true,
}: LogoMarkProps) {
  const bgFill =
    variant === "color"  ? "#0F172A" :
    variant === "onDark" ? "rgba(255,255,255,0.85)" :
    variant === "white"  ? "white" :
    "#0F172A";

  const fgFill =
    variant === "white" ? "white" :
    variant === "dark"  ? "#0F172A" :
    "#6366F1";

  const fgOpacity = (variant === "white" || variant === "dark") ? "1" : "0.92";

  return (
    <motion.svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
      style={{ willChange: "transform" }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.93 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Background rect — draws in first */}
      <motion.rect
        x="36" y="14" width="28" height="72" rx="14"
        transform="rotate(45 50 50)"
        fill={bgFill}
        initial={animate ? { opacity: 0, scale: 0.3 } : false}
        animate={animate ? { opacity: 1, scale: 1 } : undefined}
        transition={{ duration: 0.35, ease: "easeOut" }}
      />
      {/* Foreground rect — follows 0.15s later */}
      <motion.rect
        x="36" y="14" width="28" height="72" rx="14"
        transform="rotate(-45 50 50)"
        fill={fgFill}
        fillOpacity={fgOpacity}
        initial={animate ? { opacity: 0, scale: 0.3 } : false}
        animate={animate ? { opacity: Number(fgOpacity), scale: 1 } : undefined}
        transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      />
    </motion.svg>
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  variant?: LogoMarkProps["variant"];
  gap?: string;
  animate?: boolean;
}

const markVariants = {
  hidden:  { opacity: 0, scale: 0.6, rotate: -15 },
  visible: { opacity: 1, scale: 1,   rotate: 0,
    transition: { type: "spring" as const, stiffness: 260, damping: 20 } },
};

const textVariants = {
  hidden:  { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0,
    transition: { delay: 0.18, duration: 0.28, ease: "easeOut" } },
};

export function ShipDeskLogo({
  className = "",
  markClassName = "w-7 h-7",
  textClassName,
  variant = "color",
  gap,
  animate = true,
}: LogoProps) {
  const defaultTextColor =
    variant === "color"  ? "text-foreground" :
    variant === "onDark" || variant === "white" ? "text-white" :
    "text-[#0F172A]";

  const gapClass = gap ? `gap-${gap}` : "gap-2.5";

  return (
    <motion.span
      className={`flex items-center ${gapClass} ${className}`}
      initial={animate ? "hidden" : false}
      animate={animate ? "visible" : undefined}
    >
      <motion.span variants={animate ? markVariants : undefined}>
        {/* animate=false on mark so the outer stagger drives it, not a second entrance */}
        <ShipDeskLogoMark className={markClassName} variant={variant} animate={false} />
      </motion.span>
      <motion.span
        variants={animate ? textVariants : undefined}
        className={`font-bold tracking-tight ${textClassName ?? defaultTextColor}`}
        style={{ fontFamily: "'Inter', sans-serif" }}
      >
        ShipDesk
      </motion.span>
    </motion.span>
  );
}
