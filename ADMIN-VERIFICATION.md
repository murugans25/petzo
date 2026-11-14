# Admin verification — 7 November 2026

## Result

Local admin-to-user catalog flow implemented and verified. Production Supabase integration is still pending.

## Checks passed

- Production Next.js build and TypeScript checks.
- 28 HTTP integration checks: authenticated login/logout, signed HttpOnly/SameSite cookie, server-side logout revocation, protected read/write endpoints, foreign-origin denial, invalid payload/file rejection, valid image upload, pet create/edit/approve/reject/delete, private owner field exclusion, availability visibility, homepage settings sync, subscription price/active-state sync, and audit logging.
- 11 Microsoft Edge headless browser flows: login loads persisted stats; admin creates/uploads; approval shows on public page; edit and rejection propagate without reload; hero settings and membership prices update; complete user form enters pending review queue; mobile/tablet overflow checks at 320/360/390/768 px; bundled seed photographs render.
- Saved pet fixture survives a complete server stop/start and is removed after verification.

## Live local flow

User submission -> pending database row -> admin review -> approved + available -> public catalog -> user website. The public client polls every eight seconds and refreshes on focus. Admin owner name and email fields are excluded from public responses. Changes are immediately available on full page reload through server rendering.

Admin UI provides profile editing and moderation, image upload, availability, private owner information, plan pricing/duration/features/visibility, announcement and hero content, support email and recent activity. Plan editing does not activate a paid subscription.

## Storage and scope

- SQLite: `.data/petzo.sqlite`; photos: `.data/uploads`.
- Local seeded photos: `public/pets`; sample profiles remain marked as illustrative.
- Customer accounts, ownership-based customer edits, Supabase RLS/Auth, Razorpay transactions/subscriptions, accepted mating requests/chat and Resend remain unconnected.
- This is an explicitly localhost development admin, not a deployed production backend.
- Automated test records are deleted and settings/plans are restored. Audit history retains test actions.

Do not publish this local mode as a production service. Production requires the Supabase/R2/HTTPS and payment setup documented in README.md.

## Admin edit/update/delete refinement

- Explicit Update profile action for existing records, with disabled buttons during requests.
- Pet visibility PATCH endpoint changes only moderation/availability. Pet updates and deletion use compare-and-swap checks so stale editors cannot overwrite a newer record.
- Pet row controls: Edit, Approve, Reject, Hide/Show, Set draft and Delete.
- Subscription plan controls: edit name/price/duration/features, Hide/Show and Delete.
- Named deletion confirmation with cancellation, keyboard focus handling and error feedback. Cancel preserves the record; confirm permanently deletes it.
- Fixed plan textarea newline parsing so separate feature lines persist separately.
- Production build and TypeScript pass. The 28 HTTP/security integration checks passed after the endpoint changes.
- 11 dedicated Edge browser checks passed for edit/update and public sync, hide/show, draft/approve, stale-edit conflict, cancelled/confirmed pet deletion, plan create/edit/hide/show/delete, and phone layout containment.

Local development scope remains unchanged: SQLite admin/catalog work; live payments, customer authentication and private messaging are not connected.

## Profile/discovery verification — 9 November 2026

- Production build and TypeScript passed.
- 16 date/age/radius/purpose helper assertions passed, including invalid dates, leap day, manual date conversion, year/month formatting, same-city radius and unknown location behavior.
- 14 Edge browser checks passed: manual/calendar DOB synchronization; auto age; photo title editing without invalidating previews; cover/remove/add photos; persisted distance/type/purpose settings; pending/admin submission with new fields; approved discovery listing; tap/arrow photo carousel; persisted accepted view; swipe-left decline; undo; preference reload; Find anywhere; browser isolation; and 320/390/768px containment.
- Existing 28 HTTP/security integration checks passed after the new data fields were added.
- The new discovery card screenshot is saved locally at `.data/discovery-mobile.png`.

Accept/Decline are local interest decisions, not owner request acceptance. Distance is approximate city-centre distance. Customer authentication, live subscriptions and chat remain outside this local implementation.

## Persistent favourites — 9 November 2026

Discovery photo cards now have an independent heart control. Listing and profile hearts share the same persisted favourites. The dedicated /favourites route has a cart-style shortlist, saved count, detail/contact controls, individual removal, clear-all confirmation, empty/loading/error states and mobile badge. Favourites persist in SQLite under the private browser workspace; accepted/declined discovery choices remain separate.

11 Edge browser/integration checks passed: photo heart without card advance, duplicate prevention, direct page and reload persistence, profile/membership navigation, individual removal, unsaved-heart return state, truthful failed-save behavior, grid/discovery-filter independence, phone/tablet containment and badge, confirmed/cancelled clear-all, browser isolation, input validation and foreign-origin denial. Screenshots: .data/favourites-desktop.png and .data/favourites-mobile.png. Production build and TypeScript passed.

## Netlify upload package — 11 November 2026

A separate static Next.js export is ready under `out/`, with `petzo-netlify-ui.zip` containing the same root-level index.html and assets. Eight static-browser scenarios passed on a plain file server: homepage/photos, persistent preview favourites and direct route reload, details/membership navigation, discovery choices/preferences, disabled account sign-in, mobile/tablet layout, informational-only admin route, and zero real backend API requests or JavaScript page errors. Export scanning excludes environment configuration, database files, admin secrets and private owner fields. The full local app and database are not copied into the upload package.

The static preview is not a production backend; publishing it does not enable admin management, account creation, real profile submission, checkout or chat. NETLIFY-UPLOAD.md contains the upload path and rebuild instructions.
