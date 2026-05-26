---
name: logo-animation
description: Animate the ShipDesk SVG logo mark and wordmark using Framer Motion. Use when the user asks to add, change, or remove animations on the ShipDesk logo — entrance effects, hover states, idle loops, draw-on effects, stagger sequences, or any motion on the brand mark.
---

# ShipDesk Logo Animation

## Logo Component Location

```
client/src/components/ui/ShipDeskLogo.tsx
```

The logo has two parts:
- **`ShipDeskLogoMark`** — the SVG icon (two overlapping rotated rounded rectangles forming an X/cross)
- **`ShipDeskLogo`** — icon + "ShipDesk" wordmark text side by side

## SVG Structure of the Mark

```svg
<svg viewBox="0 0 100 100" fill="none">
  <!-- Background shape: rotated 45° -->
  <rect x="36" y="14" width="28" height="72" rx="14"
    transform="rotate(45 50 50)" fill={bgFill} />
  <!-- Foreground shape: rotated -45° -->
  <rect x="36" y="14" width="28" height="72" rx="14"
    transform="rotate(-45 50 50)" fill={fgFill} fillOpacity={fgOpacity} />
</svg>
```

Two `<rect>` elements, each a tall rounded pill, rotated ±45° around the center (50,50) to form the cross shape.

## Animation Library

**Framer Motion** is already installed. Use `motion` from `framer-motion`.

```tsx
import { motion } from "framer-motion";
```

Replace SVG elements with `motion.rect`, `motion.svg`, or wrap with `motion.div` as needed.

## Variant Map (color prop values)

| variant   | bgFill                    | fgFill   | Use on       |
|-----------|---------------------------|----------|--------------|
| color     | #0F172A (dark navy)       | #6366F1  | light bg     |
| onDark    | rgba(255,255,255,0.85)    | #6366F1  | dark/navy bg |
| white     | white                     | white    | dark bg      |
| dark      | #0F172A                   | #0F172A  | light bg     |

## Proven Animation Patterns

### 1. Stagger Entrance (mark draws in, then wordmark slides)
Best for: page load, route transitions

```tsx
const markVariants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -15 },
  visible: { opacity: 1, scale: 1, rotate: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 } },
};
const textVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0,
    transition: { delay: 0.15, duration: 0.3, ease: "easeOut" } },
};

// In component:
<motion.div className="flex items-center gap-2.5"
  initial="hidden" animate="visible">
  <motion.div variants={markVariants}>
    <ShipDeskLogoMark className="w-7 h-7" variant={variant} />
  </motion.div>
  <motion.span variants={textVariants} className="font-bold tracking-tight">
    ShipDesk
  </motion.span>
</motion.div>
```

### 2. Hover Pulse / Glow on the Mark
Best for: nav logos, CTAs

```tsx
<motion.div
  whileHover={{ scale: 1.08 }}
  whileTap={{ scale: 0.95 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
>
  <ShipDeskLogoMark className="w-7 h-7" variant={variant} />
</motion.div>
```

### 3. Draw-On (each rect animates in from its pivot)
Best for: hero / splash screens

```tsx
// Use motion.rect and animate pathLength or scale
<motion.svg viewBox="0 0 100 100" fill="none">
  <motion.rect
    x="36" y="14" width="28" height="72" rx="14"
    transform="rotate(45 50 50)"
    fill={bgFill}
    initial={{ scaleY: 0, originY: "50%" }}
    animate={{ scaleY: 1 }}
    transition={{ duration: 0.4, ease: "easeOut" }}
  />
  <motion.rect
    x="36" y="14" width="28" height="72" rx="14"
    transform="rotate(-45 50 50)"
    fill={fgFill} fillOpacity={fgOpacity}
    initial={{ scaleY: 0, originY: "50%" }}
    animate={{ scaleY: 1 }}
    transition={{ duration: 0.4, delay: 0.15, ease: "easeOut" }}
  />
</motion.svg>
```

### 4. Idle Breathing Loop
Best for: loading states, splash screens

```tsx
<motion.div
  animate={{ scale: [1, 1.04, 1] }}
  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
>
  <ShipDeskLogoMark className="w-7 h-7" variant={variant} />
</motion.div>
```

### 5. Slow Spin (both rects rotate together)
Best for: loading indicator

```tsx
<motion.div
  animate={{ rotate: 360 }}
  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
>
  <ShipDeskLogoMark className="w-7 h-7" variant={variant} />
</motion.div>
```

### 6. Cross-Wipe (foreground rect slides in from center)
Best for: app shell mount

```tsx
<motion.svg viewBox="0 0 100 100" fill="none">
  <rect x="36" y="14" width="28" height="72" rx="14"
    transform="rotate(45 50 50)" fill={bgFill} />
  <motion.rect
    x="36" y="14" width="28" height="72" rx="14"
    transform="rotate(-45 50 50)"
    fill={fgFill} fillOpacity={fgOpacity}
    initial={{ opacity: 0, scale: 0 }}
    animate={{ opacity: 0.92, scale: 1 }}
    transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 22 }}
  />
</motion.svg>
```

## Rules

- Keep animations under 600ms total for nav logos — anything longer feels sluggish
- Always preserve the `variant` prop logic (bgFill / fgFill) when converting to motion elements
- Use `will-change: transform` via `style` prop on heavy animations to hint GPU compositing
- Prefer `spring` transitions for interactive (hover/tap), `ease` for entrance, `linear` for loops
- Don't add looping animations to every logo instance — reserve them for hero/splash only
- The `ShipDeskLogoMark` is used in: AppShell sidebar, AppShell mobile topbar, LandingPage nav, LandingPage mobile menu, LandingPage footer

## Where Each Instance Lives

| File | Context | Recommended animation |
|------|---------|----------------------|
| `client/src/components/layout/AppShell.tsx` | Sidebar + mobile topbar | Stagger entrance on mount |
| `client/src/pages/LandingPage.tsx` | Nav + mobile menu + footer | Hover pulse on nav logo |
| `client/src/components/ui/ShipDeskLogo.tsx` | Base component | Add optional `animate` prop |
