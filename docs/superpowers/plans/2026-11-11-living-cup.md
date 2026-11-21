# Living Cup Implementation Plan

> Inline execution using executing-plans, in the current workspace.

**Goal:** Remove challenge gameplay and exhibit a coherently evolving animated cup.
**Architecture:** Pure motion math and stage metadata; articulated R3F ceramic creature; gallery controls with automatic evolution/demo sequencing. Root serves only the gallery.
**Tech Stack:** React, TypeScript, Three.js, R3F, Drei, existing Vite/Express.

## Tasks
- [x] Motion: create `scripts/living-check.ts` for continuous growth, grounded alternating gait, two-link joint lengths and finite states. Run failing; implement `src/living/motion.ts`; rerun.
- [x] Model: create `src/living/LivingCup.tsx` with hollow ceramic lathe body, retracting handle, three articulated feet, two articulated feelers, six opening crown petals. All follow motion functions.
- [x] Gallery: create `src/living/Gallery.tsx` and `gallery.css`; root removes all old mode imports. Stage navigation, 4.5s growth then 7s demonstration, replay, pause, reset, storage; model receives local animation clock and pointer awareness.
- [x] Verify: build, mathematical checks, real browser evolution/replay/pause/persistence and mobile viewport; capture stage screenshots and inspect visually. Update README with current product and commands.
