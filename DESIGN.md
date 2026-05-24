# Home — Style Reference
> Industrial Print Workshop: stark black, off-white, and **brand red** accents on bold, condensed type.
> Adapted for Udi Harkavot — primary accent color extracted from brand logo (#8B1A1A).

**Theme:** light

## Brand Colors (Udi Harkavot — extracted from logo)

| Name | Value | Role |
|------|-------|------|
| Brand Red | `#8B1A1A` | Primary accent — logo color, replaces Highlight Yellow from base system |
| Midnight Ink | `#151515` | Primary text, borders, button backgrounds |
| Canvas White | `#f3f3f3` | Page backgrounds, large content blocks |
| Pure Black | `#000000` | Fine lines, icons |
| Faded Gray | `#e5e5e5` | Subtle borders, dividers, disabled states |

## Tokens — Colors

| Name | Value | Token | Role |
|------|-------|-------|------|
| Midnight Ink | `#151515` | `--color-midnight-ink` | Primary text, borders, button backgrounds |
| Canvas White | `#f3f3f3` | `--color-canvas-white` | Page backgrounds |
| Brand Red | `#8B1A1A` | `--color-brand-red` | Interactive elements, active states, brand accent |
| Pure Black | `#000000` | `--color-pure-black` | Fine lines, icons |
| Faded Gray | `#e5e5e5` | `--color-faded-gray` | Subtle borders, dividers |

## Tokens — Typography

- **Primary font:** Rubik (Hebrew + Latin support)
- **Weights:** 400, 700, 900
- **Letter spacing:** tight on headings
- **Line height:** compact (0.93–1.1)

## Tokens — Spacing & Shapes

**Base unit:** 4px | **Density:** compact

**Border Radius:**
- buttons: `9999px` (pill) OR `0px` (framed)
- default: `0px` (industrial — sharp angles)

**Layout:**
- Section gap: 48px
- Card padding: 12px
- Element gap: 4px

## Components

### Primary Button
Background: `#8B1A1A` (Brand Red); Text: `#f3f3f3`; 0px border radius.

### Outline Button
Background: transparent; Border: `1px solid #151515`; Text: `#151515`; 0px border radius.

### Card
Background: `#ffffff`; Border: `1px solid #151515`; Padding: 12px; 0px border radius.

### Navigation (Sidebar)
Background: `#151515`; Text: `#f3f3f3`; Active: `#8B1A1A` left border + text.

## CSS Custom Properties

```css
:root {
  --color-midnight-ink: #151515;
  --color-canvas-white: #f3f3f3;
  --color-brand-red: #8B1A1A;
  --color-pure-black: #000000;
  --color-faded-gray: #e5e5e5;
}
```

## Do's and Don'ts

### Do
- Use `#8B1A1A` (Brand Red) exclusively for active states and primary CTAs
- Maintain high contrast: dark text on light bg or light text on dark sidebar
- Use `0px` border radius everywhere except explicit pill buttons
- Use `1px solid #151515` borders for cards and inputs
- Keep typography bold and tight

### Don't
- Do not use gradients (flat colors only)
- Do not use soft shadows
- Do not use rounded corners (except pill buttons)
- Do not introduce additional accent colors
