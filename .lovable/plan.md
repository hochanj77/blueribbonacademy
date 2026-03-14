

# UI Aesthetic Overhaul Plan

After reviewing every page, here are the improvements I'll make to bring a cohesive, modern, sleek feel across the entire site.

---

## Issues Found

1. **Inconsistent page heroes** -- Courses, Schedule, Contact, Social, Catalog all use a flat `bg-muted` hero with basic text. The homepage has a cinematic full-bleed hero but the rest feel like afterthoughts.
2. **Programs page is bare** -- Cards are just icon + title with no description or visual richness. The "Programs" and "Contests" section headers are plain.
3. **Schedule page looks like a spreadsheet** -- Tables are functional but visually flat. No color coding, no visual hierarchy.
4. **Social page is underwhelming** -- Only 2 cards in a 3-column grid, lots of empty space. No page hero.
5. **Contact page hero is plain** -- Info cards are small and cramped. Form lacks visual polish.
6. **Footer logo uses the old non-transparent image** -- Still imports `blue-ribbon-logo.jpg` instead of the transparent PNG.
7. **Catalog Request page has no hero section** -- Jumps straight into the form.
8. **No smooth scroll-reveal animations** on inner pages (only About has `useInView`).
9. **Button variants inconsistent** -- Some pages use `variant="hero"` while homepage uses `variant="accent"`.

---

## Changes

### 1. Unified Page Hero Component
Create a reusable `PageHero` component with the same cinematic gradient treatment as the homepage (navy gradient background, accent lines, dot pattern overlay). Apply to: Courses, Schedule, Contact, Social, Catalog Request.

### 2. Programs Page Polish
- Add subtle descriptions under each program card title
- Add a gradient accent border on hover
- Replace the plain "Programs" / "Contests" section headers with accent-line styled headings matching the homepage pattern

### 3. Schedule Page Refinement
- Style table headers with rounded corners and accent highlights
- Add subtle left-border color coding per section
- Improve mobile cards with accent-colored top border

### 4. Social Page Enhancement
- Add the unified PageHero
- Switch to a centered 2-column layout (no awkward 3-col gap)
- Make cards taller with larger icons and a subtle gradient background on hover

### 5. Contact Page Upgrade
- Use PageHero
- Give info cards accent-colored left borders and more breathing room
- Add rounded corners and subtle shadows to the form card
- Style the submit button consistently with `variant="accent"`

### 6. Catalog Request Page
- Add PageHero
- Wrap form in a card with subtle border and shadow matching other pages

### 7. Footer Logo Fix
- Switch import to `blue-ribbon-logo-transparent.png`

### 8. Global Animation System
- Extract the `useInView` hook from About.tsx into a shared `src/hooks/useInView.ts`
- Add fade-in-up animations on section entry across all pages

### 9. Consistency Pass
- Standardize all CTA buttons to `variant="accent"` with rounded-full styling
- Ensure all page content starts with proper `pt-24 md:pt-28` spacing for the larger header

---

## Files to Create/Edit

| File | Action |
|------|--------|
| `src/components/PageHero.tsx` | Create reusable cinematic hero |
| `src/hooks/useInView.ts` | Extract shared intersection observer hook |
| `src/pages/Courses.tsx` | Apply PageHero, polish cards |
| `src/pages/Schedule.tsx` | Apply PageHero, refine tables |
| `src/pages/Social.tsx` | Apply PageHero, improve layout |
| `src/pages/Contact.tsx` | Apply PageHero, upgrade form/cards |
| `src/pages/CatalogRequest.tsx` | Apply PageHero, wrap form in card |
| `src/components/layout/Footer.tsx` | Fix logo import |
| `src/pages/Portal.tsx` | Apply consistent styling |

