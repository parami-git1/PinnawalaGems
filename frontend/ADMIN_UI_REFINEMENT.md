# Admin workspace refinement

The admin workspace at `/admin` now uses a shared navy, white and champagne design system. Existing admin authentication, resource routes and content fields are retained.

## Screens

- **Overview:** inventory metrics, category composition, available stock, review queue shortcuts and category statistics. Metrics use recorded data.
- **Gem inventory:** search, category/color/shape/certificate/weight/price filters, local sorting and pagination, image previews, grouped create/edit dialog, certificate information and homepage visibility. New gem references are identified as automatically assigned.
- **Operations:** category management, homepage selections, stock categories and stones, event advertisements, and the older gemstone catalog with variations. Includes image uploads, previews, search and pagination.
- **Appointments & notes:** schedule and status management, searchable notes, reminders, pin/archive controls and notifications. Appointment/reminder times use Sri Lanka time.
- **Website settings:** separate homepage and contact editors with grouped fields, editable image lists and structured top-gem entries.
- **Customer reviews:** search, pending/approved views, ratings, dates, approval and confirmed deletion.
- **Workshop posts:** create/edit editor, image previews and searchable posts.
- **Login:** coordinated brand treatment, labelled credentials, password visibility, pending/error states and the existing optional Google login.

## Interaction and data handling

- Mobile navigation, keyboard focus handling and accessible form labels.
- Failed saves retain entered drafts; pending actions prevent duplicate submissions.
- Destructive actions require confirmation.
- Background refreshes preserve active editors and unsaved settings. Resource version checks prevent stale responses from overwriting successful mutations.
- Failed initial loads show a retry state. Failed refreshes retain previously loaded data and display the error.
- The analytics route now reads MongoDB's aggregation facet array correctly, fixing incorrectly empty totals and distributions. Its existing authentication remains in place.

## Source

The workspace shell and gem editor are in `src/AdminInventory.jsx`. Shared styling/components, dashboard and content editors are in `src/admin/`. Operations and Planner retain their separate components and scoped styles. Login uses `src/AdminLogin.css`.

## Validation

- Production build passes with `npm run build`.
- Targeted ESLint passes for all changed admin/login JSX.
- 32 browser checks pass for authentication, CRUD payloads, failed saves, uploads, filters, settings arrays, moderation, keyboard interaction and responsive layouts from 320px through 1440px.
- 12 focused Operations checks pass for search spacing, focus styles and mobile input sizing.
- 6 focused Planner/content checks pass for refresh and write races, reminders, error states and preserved drafts.
- 5 isolated analytics route checks pass for populated/empty results, errors and admin middleware.

Browser verification used a clearly fake token with every API request intercepted and synthetic records. No real sign-in, production writes or database access were used. The fixtures, scripts, reports and screenshots are in the workspace-level `.tmp/` directory.
