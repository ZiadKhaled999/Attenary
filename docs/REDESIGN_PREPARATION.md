# Attenary Redesign Preparation

## Scope
This document is a structured redesign reference for the Attenary React Native app. The purpose is to lock in the design intent, assets, and current implementation details before any pixel-level changes begin.

## 1. Codebase Summary

- Entry: `App.tsx` → `Navigation.tsx` (`expo` + `react-navigation`).
- Screens live under `src/screens/`.
- Shared UI primitives are in `src/components/`.
- State is split between:
  - `src/context/AppContext.tsx` (local attendance data + backup/restore).
  - `src/context/SupabaseContext.tsx` (profile + sync + auth-adjacent state).
  - `src/context/LanguageContext.tsx` (i18n + RTL).
  - `src/theme/ThemeContext.tsx` (light/dark toggle, currently stub).

## 2. Navigation Map

- TimeClock
- DailyLog
- MonthlyReport
- History
- Analytics
- Profile
- More
  - About, BuyMeCoffee, Languages, Feedbacks, Backup, RestoreBackup
- Modals/Stacks:
  - CheckInModal
  - CheckOutModal
  - SessionDetails
  - Onboarding (initial gate)

## 3. Existing Design Tokens

File: `src/theme/colors.ts`

Current palette is a neon-green-on-dark obsidian glassmorphism theme:

- Primary green: `#00FF88`
- Accent cyan: `#00E5FF`
- Danger: `#FF3366`
- Backgrounds: `#0A0A0F`, `#12121A`, `#1A1A24`
- Text: `#FFFFFF`, `#B8B8C8`, `#6B6B7B`
- Card/glass greys with rgba white/black variants.
- Existing Navbar colors are defined under `colors.navbar {...}`.

Spacing scale: `xs:4, sm:8, md:12, lg:16, xl:20, xxl:24, xxxl:32, huge:40, massive:48`

Border radius: `xs:6 ... full:9999, glass:20, button:14, card:20`

Typographic scale: `xs:11 ... hero:44, massive:52`

## 4. Design Style Guidance (from system references)

Applicable library: `.claude/skills/ui-ux-pro-max/data/styles.csv`

Recommended styles for this app type:
- Glassmorphism (Modern SaaS, dashboard-style)
- Bento Box / Bento Grid
- Dimensional Layering
- Motion-Driven / Micro-interactions

Recommended color trends (library `colors.csv`):
- Deep space black + vivid neon accent
- Pharmaceutical/wellness palette: calm blues and greens

## 5. Reference Assets

High-fidelity redesign references to study before pixel work:
- `src/context/refrance/5922568977462791287.jpg`
- `src/context/refrance/onboarding.webp`

These files contain the target visual direction and should be reviewed for spacing, component shapes, iconography style, and typography.

## 6. Current Component Inventory

Key components and line references:
- `src/components/CustomTabBar.tsx`
- `src/components/CheckInModal.tsx`
- `src/components/CheckOutModal.tsx`
- `src/components/BarChartComponent.tsx`
- `src/components/ProgressTracker.tsx`
- `src/components/CompactTimeStats.tsx`
- `src/components/CircularProgressChart.tsx`

## 7. Risks / Constraints

- RTL support (Arabic) is active via `LanguageContext`.
- Many screens rely on glassmorphism (`bgCard`, `border`, `shadows`).
- Charts use `react-native-chart-kit` with custom wrappers.
- Update flow is in `Navigation.tsx` and `src/utils/updateService.ts`.
- Backup/restore logic is centralized in `src/utils/backup.ts`.

## 8. Target Output

1. Approved design reference -> shapes, radius, shadows, motion curves.
2. Token updates in `src/theme/colors.ts` plus `spacing`, `borderRadius`, `fonts`.
3. Component restyle pass per screen.
4. Animation pass (`react-native-reanimated`) to replace static JS styles where expected.
