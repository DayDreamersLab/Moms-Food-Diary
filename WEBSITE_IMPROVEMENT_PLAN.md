# Website Improvement Plan

## Visual attractiveness

1. Replace placeholder food cards in the landing page with real photos and social proof snippets.
2. Add responsive breakpoints for hero mosaic and navbar so mobile does not feel cramped.
3. Improve interaction polish with reusable hover/focus states (not inline mouse event handlers).
4. Add stronger empty states and skeleton loading components to reduce visual jumps.
5. Introduce accessibility-focused improvements: visible keyboard focus, semantic controls for star/mood selectors, and better contrast checks.

## Reusability and maintainability

1. Move repeated inline style patterns into reusable UI primitives (`PageHeader`, `PrimaryButton`, `Card`, `EmptyState`, `SectionContainer`).
2. Convert repeated auth/session/profile fetch logic into shared hooks (`useRequireSession`, `useProfile`).
3. Extract post fetch/enrichment logic into `lib/posts.ts` service helpers.
4. Replace `any` in shared form field components with typed props.
5. Centralize constants like search suggestions and mood/reactions into `lib/constants.ts`.

## Suggested implementation order

1. Build design tokens + utility classes and migrate major controls.
2. Create shared hooks/services for auth/profile/posts.
3. Refactor pages (`feed`, `diary`, `search`, `profile`) to use shared building blocks.
4. Add accessibility pass and visual QA (mobile + desktop).
