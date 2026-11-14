# Petzo local admin and catalog

## Start

Requires Node.js 24 (uses built-in `node:sqlite`). Run `npm.cmd install`, `npm.cmd run setup:local`, then `npm.cmd run dev`. For the production build on this computer: `npm.cmd run build` followed by `npm.cmd run start`.

- User website: http://localhost:3000
- Admin workspace: http://localhost:3000/admin

`setup:local` creates a random admin password and prints it once. It stores only a salted scrypt password hash and session secret in ignored `.env.local`. Re-running setup preserves the existing credentials. Do not commit this file. This is a local environment, not a publicly deployed service.

## Working flows

- Admin sign-in/logout, expiring signed HttpOnly sessions, server-side session revocation, login throttling and same-origin write checks.
- Persistent SQLite pet CRUD, approval/rejection/draft and availability controls.
- Admin image upload with JPEG/PNG/WebP signature and 5 MB checks.
- Public catalog returns only approved, available profiles and active plans. Owner names/emails remain admin-only.
- User homepage, discovery, profile details, hero, membership prices and matching suggestions read the same database.
- Open user pages refresh catalog data every 8 seconds and on focus. Full refresh reads current database values on the server.
- User four-step profile form can download a private draft or submit photos/details to the local admin review queue. User submissions are always pending. Approval makes them public.
- Pet adoption has its own free browse/list/request flow. Owners and rescue organisations submit pet details, vaccination and health information, reason for adoption, photos and private contact details; admin approval is required before public browsing.
- Adoption requests collect applicant contact details, household, pet experience and a care plan. A random private owner access link lets the listing owner review and accept/decline requests; the admin workspace can moderate listings and requests, verify rescue organisations, and mark a pet adopted. Adoption never checks membership or payment status.
- Marketplace has separate type, breed, age, gender and location filters; public pet listings include price, photos, vaccination and health information, and a private seller enquiry. Seller identity/contacts and optional registration/veterinary documents are private; admin verifies the seller and approves the listing before it is visible.
- Seller enquiries are reviewed through a private seller access link or by admin. Admin can verify/unverify sellers, approve/reject/sell/delete listings and accept/decline enquiries. The app does not process checkout, transfer money, or represent that an enquiry completed a sale.
- Private seller documents are signature-checked, stored outside public uploads and downloadable only through an authenticated admin route.
- Website announcement, hero text, support email and subscription-plan configuration.
- Admin activity log with real persisted actions. No fictional revenue/user/payment counts.

Data lives in ignored `.data/petzo.sqlite`; photos in `.data/uploads`. Keep the whole `.data` directory when restarting. Back it up with the server stopped so SQLite and uploaded files stay together. Seed profiles are inserted only on the initial database creation. They are marked as samples; health information is not independently verified.

## Test

With the server running, set `PETZO_TEST_PASSWORD` in your shell to your admin password, then run:

- `npm.cmd run test:admin` — auth, authorization, validation, image upload, moderation, settings, pricing, private-data exclusion and session revocation.
- `npm.cmd run test:browser` — installed Microsoft Edge in headless mode, admin UI and user flow integration including automatic updates and mobile layout.

The tests create temporary records and restore settings/prices in cleanup. Activity-log test entries remain as a record of those actions. Screenshots are saved under `.data/`.

## Local-only limitations

Customer login/password recovery, production email notifications, authenticated seller/owner accounts, live Razorpay checkout and verified subscriptions, mating requests/private chat, and Supabase/R2 integrations are not connected. Adoption and seller review work in the local preview through private access links; owners/sellers follow up directly using the contact details provided. Free/Premium plan prices are editable development configuration; payments and premium activation never pretend to succeed. Favourites persist in SQLite for the current browser workspace and are available at /favourites.

The local submission flow is anonymous, restricted to local host requests and capped per local instance. It is for development, not a substitute for authenticated production pet submission. The admin mode uses one server-configured account and is designed for localhost HTTP. The cookie is not configured for public HTTPS hosting. Do not deploy this mode as a production marketplace.

## Production path

Move storage to Supabase PostgreSQL and R2, implement Supabase Auth with server-verified admin roles and RLS, require authenticated owner submissions, and use a properly configured HTTPS session cookie and deployment allowlist. Configure Razorpay signature-verified orders/webhooks before enabling memberships and messaging. Add email, reporting/blocking, retention policies and operational monitoring. `.env.example` lists integration placeholders; none are connected just by filling a key.

Existing UI notes and older readiness audits describe earlier revisions. `ADMIN-VERIFICATION.md` records the current admin implementation and checks.

## Admin edit/update/delete controls

Pet rows now include Edit, Approve/Reject, Hide/Show, Set draft and Delete. Editing an existing profile uses an explicit Update profile action. Delete opens a named confirmation dialog, and cancelling leaves the record unchanged. Plans support edit, immediate hide/show and confirmed deletion. Visibility changes update only the intended fields; stale pet editors receive a conflict response instead of overwriting a newer change. Mutations are authenticated and logged.

Run `npm.cmd run test:admin-controls` with `PETZO_TEST_PASSWORD` set to test these controls through Microsoft Edge, including the matching changes on the user website. Deleted records are permanently removed; Hide preserves them for later reuse. Uploaded image files are retained locally rather than deleted automatically with a record.

## Pet profile and discovery revision — 9 November 2026

Pet intake now supports photo titles, remove/set-profile-photo controls, age in years/months, a bio, calendar DOB entry and DD/MM/YYYY typing. Unknown DOB can be replaced by manual age. The About & preferences step includes Find anywhere, a 1–100 km slider, preferred pet types and Playdate/Service/Breeding purposes. Preference saving and profile submission persist these fields; photo titles and purposes can also be managed in admin.

Discovery defaults to a large photo-card layout with info, previous/next photos, tap-to-advance, left/right swipe, Accept/Decline, Undo, grid view and a persistent accepted-profiles view. Accept records interest only; it does not send requests, trigger payments or unlock chat.

Discovery preferences and choices are stored in the local SQLite database, isolated by an HttpOnly browser-workspace cookie. They are not customer authentication or ownership verification. Profile discovery preferences are excluded from the public catalog. Distances are explicitly approximate city-centre calculations for supported cities; unknown locations are not assigned a fabricated distance and are excluded when radius filtering is active. Find anywhere includes all locations.

Tests: `npm.cmd run test:discovery` (date/age/distance/purpose helpers), `npm.cmd run test:profile-discovery` (Edge end-to-end form, approval, carousel, preferences, swipe, persistence and mobile checks). Browser tests require `PETZO_TEST_PASSWORD` for the admin approval step.


## Favourites

Tap a heart on a discovery photo, listing card or profile to add/remove a favourite. `/favourites` provides a cart-style shortlist with saved count, photos, details, remove/clear controls and membership navigation. Favourites use the same private HttpOnly browser-workspace cookie as discovery; they survive refresh, are isolated across browsers, and are independent of accepted/declined discovery choices. Only approved, available pets appear. Pet deletion or hiding removes that pet from the visible shortlist. There is no purchase, checkout, or owner request on favouriting.

Run `npm.cmd run test:favourites` for the 11 favourite UI/API scenarios.

## Client UI preview upload

Run `npm.cmd run build:preview` to create an independent static `out` folder for Netlify manual upload. It uses a sanitized public catalog snapshot and browser-local preview interactions, including sample adoption and Marketplace cards with demo listing/request/review steps. No database, environment secrets or live admin routes are exported; preview activity does not publish real pets, verify sellers, store uploaded documents or contact anyone. The normal local app remains server-backed. See NETLIFY-UPLOAD.md for the exact upload path and limitations. Static preview checks: run `node scripts/serve-ui-preview.mjs`, then `node scripts/preview-browser.mjs`.
