# Brand Theme Design Palette Skill

A comprehensive design token system derived from the Obsidian dark theme, structured for building consistent, scalable brand interfaces.

---

## 1. Color System

### 1.1 Base Colors (Neutral Scale)
The neutral palette provides the structural foundation for all surfaces, borders, and non-accented text. Values are theme-dependent.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--base-00` | `#ffffff` | `#1e1e1e` | Deepest background / canvas |
| `--base-05` | `#fcfcfc` | `#212121` | Primary background |
| `--base-10` | `#fafafa` | `#242424` | Elevated surfaces |
| `--base-20` | `#f6f6f6` | `#262626` | Secondary background |
| `--base-25` | `#e3e3e3` | `#2a2a2a` | Subtle borders / dividers |
| `--base-30` | `#e0e0e0` | `#363636` | Borders |
| `--base-35` | `#d4d4d4` | `#3f3f3f` | Hover borders |
| `--base-40` | `#bdbdbd` | `#555555` | Disabled text / icons |
| `--base-50` | `#ababab` | `#666666` | Muted text |
| `--base-60` | `#707070` | `#999999` | Secondary text |
| `--base-70` | `#5a5a5a` | `#bababa` | Primary text (dark mode) |
| `--base-100` | `#222222` | `#dadada` | Primary text (light mode) |

**Rule:** Base colors should only be defined by themes. Components should reference semantic tokens instead.

---

### 1.2 Accent Color
The accent color draws attention to interactive elements: links, primary buttons, active states, and focus rings. It can be overridden by brand settings.

| Token | Default Value | Description |
|-------|--------------|-------------|
| `--accent-h` | `254` | Accent hue |
| `--accent-s` | `80%` | Accent saturation |
| `--accent-l` | `68%` | Accent lightness |

**Derived Usage:** Use CSS `hsl()` calculations to generate tints, shades, and opacities from the accent HSL base.

**Example:**
```css
--accent-muted: hsl(var(--accent-h), var(--accent-s), calc(var(--accent-l) + 10%));
--accent-deep: hsl(var(--accent-h), var(--accent-s), calc(var(--accent-l) - 15%));
```

---

### 1.3 Extended Colors (Functional Palette)
Extended colors communicate status, syntax highlighting, callouts, and data visualization.

| Token | Light Mode | Dark Mode | RGB Light | RGB Dark |
|-------|-----------|-----------|-----------|----------|
| `--color-red` | `#e93147` | `#fb464c` | `233, 49, 71` | `251, 70, 76` |
| `--color-orange` | `#ec7500` | `#e9973f` | `236, 117, 0` | `233, 151, 63` |
| `--color-yellow` | `#e0ac00` | `#e0de71` | `224, 172, 0` | `224, 222, 113` |
| `--color-green` | `#08b94e` | `#44cf6e` | `8, 185, 78` | `68, 207, 110` |
| `--color-cyan` | `#00bfbc` | `#53dfdd` | `0, 191, 188` | `83, 223, 221` |
| `--color-blue` | `#086ddd` | `#027aff` | `8, 109, 221` | `2, 122, 255` |
| `--color-purple` | `#7852ee` | `#a882ff` | `120, 82, 238` | `168, 130, 255` |
| `--color-pink` | `#d53984` | `#fa99cd` | `213, 57, 132` | `250, 153, 205` |

**RGB Suffix Convention:** Each extended color has an `-rgb` variant for opacity control via `rgba()`.

**Example:**
```css
color: var(--color-red);
background-color: rgba(var(--color-red-rgb), 0.2);
```

---

### 1.4 Black & White Masks
Used for creating opacity-based overlays and masks. **Do not override these values.**

| Token | Light Mode | Dark Mode |
|-------|-----------|-----------|
| `--mono-rgb-0` | `255, 255, 255` | `0, 0, 0` |
| `--mono-rgb-100` | `0, 0, 0` | `255, 255, 255` |

---

### 1.5 Semantic Colors
Semantic tokens map base and extended colors to specific UI meanings. Always use these in components rather than raw color values.

#### Surface Colors
| Token | Description |
|-------|-------------|
| `--background-primary` | Primary background |
| `--background-primary-alt` | Surfaces on top of primary background |
| `--background-secondary` | Secondary background |
| `--background-secondary-alt` | Surfaces on top of secondary background |
| `--background-modifier-hover` | Hovered elements |
| `--background-modifier-active-hover` | Active hovered elements |
| `--background-modifier-border` | Border color |
| `--background-modifier-border-hover` | Border color (hover) |
| `--background-modifier-border-focus` | Border color (focus) |
| `--background-modifier-error-rgb` | Error background (RGB) |
| `--background-modifier-error` | Error background |
| `--background-modifier-error-hover` | Error background (hover) |
| `--background-modifier-success-rgb` | Success background (RGB) |
| `--background-modifier-success` | Success background |
| `--background-modifier-message` | Messages background |
| `--background-modifier-form-field` | Form field background |

#### Interactive Colors
| Token | Description |
|-------|-------------|
| `--interactive-normal` | Standard interactive elements |
| `--interactive-hover` | Standard interactive elements (hover) |
| `--interactive-accent` | Accented interactive elements |
| `--interactive-accent-hsl` | Accented interactive elements (HSL) |
| `--interactive-accent-hover` | Accented interactive elements (hover) |

#### Text Colors
| Token | Description |
|-------|-------------|
| `--text-normal` | Normal text |
| `--text-muted` | Muted text |
| `--text-faint` | Faint text |
| `--text-on-accent` | Text on dark accent background |
| `--text-on-accent-inverted` | Text on light accent background |
| `--text-success` | Success text |
| `--text-warning` | Warning text |
| `--text-error` | Error text |
| `--text-accent` | Accent text |
| `--text-accent-hover` | Accent text (hover) |

#### Text Background Colors
| Token | Description |
|-------|-------------|
| `--text-selection` | Selected text background |
| `--text-highlight-bg` | Highlighted text background |

#### Caret
| Token | Description |
|-------|-------------|
| `--caret-color` | Blinking text entry cursor |

---

## 2. Spacing System

### 2.1 4-Pixel Grid (Primary)
All spacing, padding, margin, and dimensions should align to a 4-pixel grid for consistent scaling across DPIs.

| Token | Value | Calculation |
|-------|-------|-------------|
| `--size-4-1` | `4px` | 4 × 1 |
| `--size-4-2` | `8px` | 4 × 2 |
| `--size-4-3` | `12px` | 4 × 3 |
| `--size-4-4` | `16px` | 4 × 4 |
| `--size-4-5` | `20px` | 4 × 5 |
| `--size-4-6` | `24px` | 4 × 6 |
| `--size-4-8` | `32px` | 4 × 8 |
| `--size-4-9` | `36px` | 4 × 9 |
| `--size-4-12` | `48px` | 4 × 12 |
| `--size-4-16` | `64px` | 4 × 16 |
| `--size-4-18` | `72px` | 4 × 18 |

### 2.2 2-Pixel Grid (Fine-Grained)
Use sparingly for micro-adjustments only.

| Token | Value |
|-------|-------|
| `--size-2-1` | `2px` |
| `--size-2-2` | `4px` |
| `--size-2-3` | `6px` |

**Rule:** Prefer 4-pixel grid tokens. Use 2-pixel grid only when finer control is absolutely necessary.

---

## 3. Typography System

### 3.1 Font Families
| Token | Usage |
|-------|-------|
| `--font-interface-theme` | UI elements (buttons, nav, panels) |
| `--font-text-theme` | Editor / body text |
| `--font-monospace-theme` | Code blocks, inline code, data |

### 3.2 Font Sizes

#### Relative Sizes (Editor / Content)
Use for text that must scale with user preferences.

| Token | Default | Context |
|-------|---------|---------|
| `--font-text-size` | `16px` | Base editor size (user-defined) |
| `--font-smallest` | `0.8em` | Captions, metadata |
| `--font-smaller` | `0.875em` | Small body |
| `--font-small` | `0.933em` | Slightly reduced |

#### Fixed Sizes (UI Chrome)
Use for interface elements that should remain consistent regardless of content zoom.

| Token | Default | Context |
|-------|---------|---------|
| `--font-ui-smaller` | `12px` | Badges, tags |
| `--font-ui-small` | `13px` | Compact UI labels |
| `--font-ui-medium` | `15px` | Standard UI text |
| `--font-ui-large` | `20px` | Titles, headers |

### 3.3 Font Weights
| Token | Value | Usage |
|-------|-------|-------|
| `--font-thin` | `100` | Display headings |
| `--font-extralight` | `200` | Light display |
| `--font-light` | `300` | Subheadings |
| `--font-normal` | `400` | Body text |
| `--font-medium` | `500` | Emphasized body |
| `--font-semibold` | `600` | Subheadings, labels |
| `--font-bold` | `700` | Bold text, headings |
| `--font-extrabold` | `800` | Heavy emphasis |
| `--font-black` | `900` | Maximum emphasis |

### 3.4 Text Formatting Modifiers
| Token | Description |
|-------|-------------|
| `--font-weight` | Regular text weight |
| `--bold-modifier` | **Additive** weight for bolded text (recommended: 100–300) |
| `--bold-weight` | Final bold text font weight |
| `--bold-color` | Bold text color |
| `--italic-color` | Italic text color |

**Bold Modifier Pattern:** `--bold-modifier` stacks on existing weights. This allows already-bold text (e.g., headings) to become even heavier when wrapped in bold tags.

```css
/* Example: Heading is 600, bold modifier is 200, final bold weight = 800 */
--bold-weight: calc(var(--font-weight) + var(--bold-modifier));
```

### 3.5 Line Heights
| Token | Default | Usage |
|-------|---------|-------|
| `--line-height-normal` | `1.5` | Default body text |
| `--line-height-tight` | `1.3` | Search results, tree items, tooltips, compact spaces |

### 3.6 Paragraph Spacing
| Token | Description |
|-------|-------------|
| `--heading-spacing` | Spacing above headings |
| `--p-spacing` | Spacing between paragraphs |

---

## 4. Usage Guidelines

### 4.1 Token Priority
1. **Always use semantic tokens** in components (`--text-normal`, `--background-primary`, etc.)
2. **Reference base colors** only when defining new semantic tokens for a theme
3. **Use extended colors** for status, syntax, and data viz only
4. **Never hardcode hex values** in component styles

### 4.2 Spacing Rules
- All padding, margin, gap, width, and height should use `--size-*` tokens
- Prefer multiples of 4 (`--size-4-*`)
- Use 2-pixel grid (`--size-2-*`) only for micro-tuning

### 4.3 Typography Rules
- Use `--font-ui-*` for interface chrome (fixed sizes)
- Use `--font-*` (relative) for editor and user-generated content
- Use `--bold-modifier` (100–300) to create bold stacking rather than overriding `--font-weight`

### 4.4 Accessibility
- Ensure `--text-on-accent` and `--text-on-accent-inverted` provide 4.5:1 contrast against accent backgrounds
- Use `--mono-rgb-*` masks for overlays rather than semi-transparent hex colors to avoid dark-mode inversion bugs
- Test extended colors for colorblind accessibility; do not rely solely on color to communicate status

---

## 5. Quick Reference: Complete Token List

### Colors
Base: `--base-00` through `--base-100`
Accent: `--accent-h`, `--accent-s`, `--accent-l`
Extended: `--color-{red,orange,yellow,green,cyan,blue,purple,pink}` + `-rgb` variants
Mono: `--mono-rgb-0`, `--mono-rgb-100`
Semantic: `--background-*`, `--interactive-*`, `--text-*`, `--caret-color`

### Spacing
4px: `--size-4-1` to `--size-4-18`
2px: `--size-2-1` to `--size-2-3`

### Typography
Fonts: `--font-interface-theme`, `--font-text-theme`, `--font-monospace-theme`
Sizes: `--font-text-size`, `--font-smallest`, `--font-smaller`, `--font-small`, `--font-ui-smaller`, `--font-ui-small`, `--font-ui-medium`, `--font-ui-large`
Weights: `--font-thin` through `--font-black`
Format: `--font-weight`, `--bold-modifier`, `--bold-weight`, `--bold-color`, `--italic-color`
Layout: `--line-height-normal`, `--line-height-tight`, `--heading-spacing`, `--p-spacing`

---

*Compiled from Obsidian Dark Theme documentation. Use this skill to maintain consistency across all brand interfaces and theme implementations.*
