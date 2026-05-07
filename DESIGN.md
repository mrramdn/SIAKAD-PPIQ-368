# DESIGN.md

## Design Direction

Scene: santri membuka aplikasi di laptop sekolah atau HP pribadi setelah sesi bimbingan karir, ruangan terang, suasana tenang, dan pembimbing butuh hasil yang mudah dibaca.

Theme: warm light.

Style: pesantren editorial product UI. The interface should feel measured, grounded, and structured, with a strong green identity from the logo.

## Color System

Use OKLCH tokens in CSS. Do not use raw hex values in new components unless the value comes from the logo asset itself.

Primary green follows the logo:

```css
--brand: oklch(0.44 0.15 147);
--brand-strong: oklch(0.34 0.13 147);
--brand-soft: oklch(0.91 0.05 147);
--accent: oklch(0.82 0.15 84);
--danger: oklch(0.55 0.18 29);
--paper: oklch(0.96 0.018 92);
--paper-deep: oklch(0.91 0.028 92);
--ink: oklch(0.24 0.035 135);
--muted: oklch(0.48 0.035 135);
--line: oklch(0.82 0.035 100);
```

Color strategy: restrained. Green controls primary identity and action. Yellow highlights progress or selected assessment states. Red stays rare for destructive or invalid states.

## Typography

- Use the current Next.js font stack until a dedicated font decision is made.
- Headings use strong weight, tight tracking, and `text-wrap: balance`.
- Body text uses `text-wrap: pretty`, line-height 1.6, and 65 to 75 character measure on desktop.
- Numeric scores, counts, and percentages use tabular numbers.

## Layout

- Mobile-first.
- Minimum interactive height: 44px.
- Use 4px and 8px spacing rhythm.
- Avoid nested cards.
- Use surfaces only when they group a task, not as decoration.
- Admin pages use persistent navigation and tables with clear filters.
- Assessment pages use progressive grouping and visible progress.

## Surfaces

- Prefer soft shadows over heavy borders.
- Keep nested radius concentric: outer radius equals inner radius plus padding.
- Use image outlines for logo or photos: `rgba(0, 0, 0, 0.1)` in light mode.
- Avoid glassmorphism except for a deliberate overlay with a clear purpose.

## Motion

- Use CSS transitions for hover, focus, and active states.
- Never use `transition: all`.
- Use `transition-property: transform, opacity, background-color, color, box-shadow, border-color` as needed.
- Buttons use `active:scale-[0.96]` unless motion would distract.
- Respect `prefers-reduced-motion`.

## Forms

- Labels must remain visible.
- Helper text appears below complex fields.
- Errors appear near the field or form region they describe.
- Submit buttons show loading text and disable while pending.
- Password fields should support reveal/hide when useful.

## Accessibility

- Contrast target: 4.5:1 for normal text.
- Focus rings must be visible.
- All icon-only controls need accessible labels.
- Do not convey state by color alone.
- Keep keyboard tab order aligned with visual order.

## Component Language

- Primary button: green filled, rounded, tactile press scale.
- Secondary button: paper surface with green text and soft shadow.
- Inputs: tall, visible label, green focus ring, clear error region.
- Tables: compact, readable, tabular numbers, sticky or repeated context where needed.
- Badges: text plus color, never color alone.
