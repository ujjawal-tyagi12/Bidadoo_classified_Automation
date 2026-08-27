# Custom Attributes — Automation Requirements

- **Module:** Seller Dashboard → Custom Attributes
- **Tickets:** BIDC-475 (Create and View, 52 cases, primary spec) + BIDC-474 (Table Format, 68
  cases, folded in — see §1)
- **App:** QA Fleet Exchange (`qa-website-bidadoocl.appskeeper.in`)
- **Prepared:** 2026-08-26, verified live via Playwright MCP against the real app (same method
  as the Listings modules — see `docs/requirements/listings-automation-requirements.md`)

## 1. Why 474 is folded into 475, not built separately

BIDC-474 ("Table Format") and BIDC-475 ("Create and View") describe the same feature. 474 is
generic (create/edit/activate/deactivate/paginate/view, styled with placeholder values like
"Weight"/"20kg"); 475 covers the same ground with the real field names, the real navigation
path ("My Profile → Custom Attributes"), and specific real error text. Confirmed live: 475's
detail is accurate (see §2), so it's the spec of record. 474 contributes exactly one thing 475
doesn't: an explicit "empty attributes list" case (474 #25) — folded in below. Every other 474
case duplicates a 475 case one-for-one, or is one of the same UI-consistency/out-of-scope
categories triaged out in every prior module of this project (button styles, icon styles, font
sizes/styles, spacing, hover effects, color scheme — 474 #9, #27, #30, #37, #47, #50, #53, #56,
#59, #62, #65, #68 — plus browser/mobile/network/performance/simulated-failure categories, see
§5).

## 2. Verified application flow

Confirmed live via Playwright MCP (navigating, clicking, reading real DOM/network state — not
inferred from the sheet).

- **Navigation:** Seller Dashboard's left sidebar has a direct "Custom Attributes" button/link
  (`/dashboard?tab=attributes`) — not nested under a Profile menu as 475's precondition text
  ("My Profile → Custom Attributes") implies. Page heading: "Custom Attributes"; a description
  line reads "Create internal attributes to assist in inventory tracking and integrations.
  These fields are for your organization's use only and are never visible to the public."
- **List table columns:** ATTRIBUTES ID, ATTRIBUTE NAME, CREATED ON (sortable), STATUS, ACTION
  — no "Type" column in the list (Type only shows on the detail/view page). Matches 474's
  expected columns; 475's own case #6 expectation of a Type column is on the *detail* page,
  confirmed correct there.
- **Pagination:** "Rows per pages" dropdown defaults to 10, same `<select>` pattern as
  Listings' pagination.
- **Create flow:** "+ New Custom Attribute" button navigates to a dedicated page
  (`/dashboard/custom-attributes/new`), not a modal. Fields: "Attribute Name" (text input,
  `#attributeName`), "Attribute type" (a custom dropdown, same `div[role="button"]` +
  `role="option"` pattern as Listings' Status filter — confirmed live to share the same
  toggle-click race documented extensively in the Listings modules, see §3). Real type options
  are **Text Field, Number, Dropdown, Text Area, Hyperlink, Checkbox** — the sheet's "Dropdown
  List" is actually just **"Dropdown"**, and "Hyperlink"/"Checkbox" aren't mentioned in the
  sheet at all.
- **Values (Dropdown type only):** confirmed live this is **not** a single comma-separated
  field as the sheet's "Values: 'Good, Average'" data implies — it's one text input per value
  ("Value 1", "Value 2", ...) added one at a time via a "+ Add More" button (disabled until the
  current value is non-empty). "Create Custom Attribute" stays disabled until Name + Type (+ at
  least one Value, for Dropdown) are filled — same client-side-disable pattern as Login and the
  Listings filter Apply button.
- **Field validation (confirmed live):**
  - Attribute Name: a real `role="alert"` reading exactly **"Attribute Name is required"**
    appears on blur when empty — a genuine accessible error, unlike most of this app's
    disabled-button-only validation. Confirmed via blur, not submit.
  - Attribute Name length: no HTML `maxlength`, but typing >25 characters and blurring shows a
    real `role="alert"`: **"Attribute Name must not exceed 25 characters."** (the sheet's case
    11/26/34/48/51 expectations are directionally right, exact text now confirmed).
  - Attribute type empty: **no alert text** — only the disabled Create button gates it (unlike
    Name). Confirmed by filling Name only and clicking Create: nothing happens, no new alert.
  - Values — **confirmed real bug, matches BIDC-475 #14 but not its expected behavior:** a
    value **over 15 characters** silently keeps Create disabled, with **no error shown
    anywhere** — verified precisely at the boundary (15 chars: enabled; 16 chars: disabled),
    confirmed via real Playwright clicks/fills (an earlier pass at this investigation used
    `page.evaluate` + synthetic DOM events to test faster, which gave false results — this
    form's validation doesn't react the same way to synthetic events as to genuine
    interaction, so anything tested that way needed live re-confirmation with real clicks).
    Special characters, mixed case, numbers, spaces, and multi-word values are all otherwise
    accepted normally — the sheet's #20/#28/#47 (special characters allowed) is directionally
    correct, just not the actual length-related failure this investigation first suspected.
    Same "silently gates the user with zero feedback" pattern as the duplicate-name bug below —
    a real, separate finding, not built as a second red scenario for the same signal-to-noise
    reason (see §6), but the "Values field accepts varied content" scenario (§4) uses content
    confirmed to stay under the real 15-character ceiling.
- **Duplicate name — confirmed real bug:** creating a second "Net Horsepower" + Dropdown
  attribute (same name+type as an existing one) is rejected by the backend (`POST
  .../attributes` returns **422 Unprocessable Entity**, confirmed via console network log) but
  the **frontend shows no visible error whatsoever** — no alert, no toast, no inline text; the
  page just silently stays put and no duplicate is created. The sheet's expected message ("This
  Attribute Name already exists...") does not appear anywhere. This is the same class of
  confirmed, reproducible app bug as the Listings sort-button issue — documented and left
  deliberately red rather than worked around (see §4, §6).
- **View flow:** clicking an Attribute ID, or "View" from the row's action menu, opens
  `/dashboard/custom-attributes/<id>` (no query param). Shows Attribute ID, Attribute Name,
  Attribute Type (rendered as "DropDown" — note the capitalization differs slightly from the
  create form's "Dropdown" label), Value 1, Created on, and **Status: "Activated"** (the list
  column shows "Active"/"Deactivated" but the detail page's own Status field reads "Activated"/
  "Deactivated" — a real, minor terminology difference between the two views, confirmed live).
  Two buttons here: "Deactivate" (or "Activate" once deactivated) and "Edit".
- **Deactivate/Activate:** clicking "Deactivate" on the detail page opens a real confirmation
  dialog — "Deactivate / Are you sure you want to deactivate? / Cancel, Deactivate" — confirmed
  live, and unlike the Listings "Sell with bidadoo" dialog, this one is fully reversible
  (re-activatable) test data with no real-world side effect, so **both directions are safe to
  automate through completion**, confirmed by deactivating and reactivating the same test
  attribute live. Confirming redirects back to the list (`?tab=attributes`) with the row's
  status updated.
- **Row action menu:** "More" on a list row opens a 2-item menu — **View, Edit** only. No
  Activate/Deactivate here (that's detail-page-only, per above) and no Delete option exists
  anywhere in this app (BIDC-474 #48/#54/#57/#60 negative-testing-on-invalid-ID cases for
  delete/deactivate/activate/edit/preview of a non-existent ID are not reachable through the
  UI, since there's no way to construct an invalid ID through normal navigation — same
  reasoning as the Listings module's "can't construct an invalid state through the UI" cases).
- **Edit flow:** reached via the row menu's "Edit" or the detail page's "Edit" button, both land
  on `/dashboard/custom-attributes/new?edit=1&id=<id>` (reuses the create page's route/shell),
  pre-filled with the existing Name/Type/Values, save button reads "Save Changes" instead of
  "Create Custom Attribute".
- **Empty state:** with zero attributes, the table shows one row reading "No Custom Attributes
  Found" (confirmed live — this seller account started with none) — folds in BIDC-474 #25.
- **Search — confirmed broken:** the search input updates its own value and the URL's `search`
  query param, but confirmed via network trace it never fires a new request — the table simply
  never changes, for any query including one with zero matches. Unlike Listings (where search
  is real and used to reach empty-state), there is no working search here at all. This means
  the empty-state case (474 #25) can't be reached on demand via a no-match search the way it
  was for Listings — it only holds while the account has zero attributes, which stops being
  true after the first Create scenario runs. Given there's also no delete function to reset
  state, this case is **not practically automatable** in an order-independent suite and is
  dropped rather than built as an order-dependent (flaky-by-design) scenario. Search itself
  (474 #66, "Invalid Attribute Search") is likewise not automatable as described — the real
  behavior isn't "no results found", it's "search does nothing at all", confirmed as a real bug
  but not built as a dedicated red scenario (one flagship documented bug per module, matching
  the sort-button precedent in Listings, keeps the suite's signal-to-noise reasonable — see §6).

## 3. Confirmed shared risk: the toggle-click race

The Attribute type dropdown uses the exact same `div[role="button"]` + `role="option"` pattern
already confirmed (via isolated debug scripts, not guesswork) to have a real, probabilistic
click-registration race throughout this app's custom dropdowns/menus/steppers (see
`listings-automation-requirements.md` §10/§11). `CustomAttributesActions` will apply the same
bounded-retry-with-verification pattern from the start for this dropdown and the row action
menu, rather than discovering it through failed test runs a second time.

## 4. Test case decision matrix

Given the scale (120 cases across both tickets after the fold-in), cases are grouped rather
than listed individually where the disposition is identical and mechanical.

### Automate (real, distinct behavior confirmed live)

| Cases | Behavior |
|---|---|
| 475 #1 | Create with valid Name + Dropdown type + one value → appears Active in the list |
| 475 #2, #43 | Empty Name → "Attribute Name is required" alert (dup, one scenario) |
| 475 #3, #13, #44 | Empty Type → Create stays disabled, no alert (dup, one scenario) |
| 475 #4, #45 | Dropdown type with no values → Create stays disabled (verified live during build) |
| 475 #6 | View details by clicking Attribute ID / row → all fields shown correctly |
| 475 #7, #30, #31 | Edit → change Name and/or Values → persists (dup, one scenario per distinguishing field) |
| 475 #8, #22, #32 | Deactivate (with confirmation) → status becomes Deactivated, persists |
| 475 #9, #24 | Reactivate a deactivated attribute → status becomes Active again |
| 475 #10 | Cancel during creation → discarded, not added to list |
| 475 #11, #26, #34, #48, #51 | Attribute Name > 25 chars → real alert text (dup boundary, one scenario using the confirmed real message) |
| 474 #7 | Pagination — same mechanism as Listings, one scenario with created test attributes |
| 474 #14 | Unauthorized direct access → redirected to Login (same pattern as Listings' TC22, reusing `loginActions.logout()`) |
| 474 #26 | SQL-injection-style string in Attribute Name → page doesn't crash (same treat-as-inert-text pattern as Listings' search) |
| 474 #36 | `<script>` XSS-style string in Attribute Name/Value → treated as inert text, not executed |
| 475 #19, #20, #23, #27, #28, #35, #36, #37, #38, #40, #41, #42, #47, #49, #50, #52 | All test "does creation succeed with values of characteristic X" (special chars, numbers-only, letters-only, duplicate values, mixed case, leading/trailing spaces, min/max length, mixed lengths, empty-values-for-a-non-value type) — confirmed live the Values field is unrestricted free text, so these exercise the identical code path. Consolidated into **one** "Values field accepts varied content" scenario covering the representative extremes (special characters, max length, duplicate values) rather than 16 near-identical ones. |
| 475 #21 | Creating a new attribute doesn't change an existing, unrelated one — create two, verify the first is untouched |
| 475 #29 | Changing Attribute Type during Edit — live behavior (whether Type is even editable post-creation) to be confirmed during build before finalizing the assertion |

### Rewrite → deliberately not built (confirmed real app bug, left red)

| Cases | Reason |
|---|---|
| 475 #5 | Duplicate Name+Type creation — confirmed live the backend correctly rejects it (422) but the frontend shows **no error message at all** (§2). Built as a scenario asserting the sheet's expected behavior (a visible duplicate error) so it fails and documents the bug, same precedent as the Listings sort-button issue — **not** silently worked around. |

### Not automatable as described (sheet vs. confirmed real UI mismatch)

| Cases | Reason |
|---|---|
| 475 #12 | "Only specific special characters allowed" in Name — no such restriction observed; the create-with-special-characters case (475 #20/#28/#47) already covers what really happens (accepted) |
| 475 #39 | Values of only whitespace rejected with an error — not verified to exist as a distinct validation; low value to chase given the duplicate-error precedent already found |
| 475 #25 | "Deactivate an already-deactivated attribute" — confirmed live not constructible through the UI: the trigger button always shows the *opposite* of the current status (once Deactivated, the button reads "Activate", never "Deactivate" again), so there's no way to click Deactivate a second time without first reactivating |
| 475 #14 | Value length limit — confirmed live at exactly the sheet's 15-character boundary, but the real behavior is a **silent** disabled-Create with no error text (see §2), not the alert-text pattern the sheet and the Name-length case both expect. Documented as a confirmed bug in §2 rather than built as its own scenario, for the same signal-to-noise reason as the other silent-failure bugs (see §6) — the "Values field accepts varied content" scenario's test data now respects this real 15-char ceiling instead of asserting against it. |

### Out of scope for this framework (same categories as every prior module)

| Cases | Category |
|---|---|
| 474 #9,15,16,17,21,23,27,30,31,33,37,40-43,47,49,50,53,55,56,58-62,64-68 / 475 #17-19 | UI/visual consistency (button/icon/font/spacing/hover/color), browser compatibility, mobile responsiveness/touch/orientation, performance/load/stress, simulated infrastructure failures (network disconnection, server timeout, API rate limiting/auth/version/corruption/endpoint-not-found), accessibility, simultaneous-user conflict resolution — all require tooling (visual regression, network mocking, device emulation, multi-session orchestration) this framework doesn't have, consistent with every prior module's triage |
| 475 #15, #16 | Simulated server timeout / network issue during creation — no fault-injection capability in this framework |
| 474 #38,45,48,51,54,57,60 / (invalid-ID negative cases) | No way to construct an invalid Attribute ID through the UI (no delete function exists, no way to guess a stale ID) — same reasoning as Listings' equivalent cases |
| 475 #46 | Maximum number of attributes — no documented/discoverable limit to test against |
| 475 #33 | "Historical data in past equipment" preserved after deactivation/reactivation — requires linking a custom attribute to an actual equipment listing (cross-module integration); not practical to verify meaningfully in this pass |
| 474 #25 | Empty attributes list — confirmed not reachable on demand (search is broken, no delete function exists), only true before any Create scenario runs; not built as an order-dependent scenario |
| 474 #66 | "Invalid Attribute Search shows no results" — confirmed the real behavior is search does nothing at all for any query, not "no results found"; documented as a bug in §2 rather than built as a second red scenario |

**Corrected tally:** 52 (475) + 68 (474) = 120 total.

| Disposition | 475 | 474 | Total |
|---|---|---|---|
| Automated (real, distinct coverage) | 41 | 4 | **45** |
| Deliberately red (documents a real bug) | 1 | 0 | **1** |
| Not automatable as described | 4 | 0 | **4** |
| Out of scope | 6 | 64 | **70** |
| **Total** | **52** | **68** | **120** |

**46 of 120 cases (38%) map to a real, built scenario** (45 automated + 1 deliberately red),
consolidated into roughly 18 distinct scenarios — most of the reduction from 120 → ~18 comes
from BIDC-475's own internal padding (the ~20 value-variant edge cases folding into one
scenario) rather than the 474/475 overlap alone. Three real app bugs were found (duplicate-name
silent failure, non-functional search, Values silently rejecting content over 15 characters
with zero feedback); only the first is built as a deliberately-red scenario, the other two are
documented in §2 as findings worth reporting to the ticket owner (see §6).

## 5. File plan

New: `tests/ui/pages/CustomAttributesPage.ts`, `tests/ui/actions/CustomAttributesActions.ts`,
`tests/ui/step-definitions/custom-attributes.steps.ts`,
`tests/ui/features/web/custom-attributes.feature`, `data/props/custom-attributes.props.ts`,
`data/testdata/custom-attributes.json`. Reused: `LoginActions` (logout/unauthorized-access
pattern), `SellerDashboardActions`-style patterns for pagination assertions (mirrors
`ListingsActions`).

## 6. Open items / judgment calls

- Three real app bugs were confirmed live during this triage: the duplicate-name silent failure
  (built as a deliberately-red scenario), the non-functional search box, and Values over 15
  characters silently disabling Create with zero feedback (both documented in §2, not built as
  additional red scenarios — kept to one flagship red test per module for signal-to-noise, same
  as Listings' sort bug). All three are worth flagging to the ticket owner, including whether
  any should block a PR.
- BIDC-474 and BIDC-475 are very likely duplicate tickets tracking the same feature (see §1) —
  worth a one-line flag to whoever owns them, independent of this automation work.

## 7. Implementation status

Built and passing. New files: `tests/ui/pages/CustomAttributesPage.ts`,
`tests/ui/actions/CustomAttributesActions.ts`,
`tests/ui/step-definitions/custom-attributes.steps.ts`,
`tests/ui/features/web/custom-attributes.feature`, `data/props/custom-attributes.props.ts`,
`data/testdata/custom-attributes.json`. `CustomAttributesActions` is registered in
`tests/ui/support/action.fixture.ts`.

Full suite run (`npx playwright test --grep "@custom-attributes" --project=bdd`):
**17 passed, 1 failed.** The one failure is the duplicate-name scenario (BIDC475-5) — see §2 —
left deliberately red since it documents a real, reproducible app bug rather than working
around it.

Two real, reproducible app-level races were found and fixed with explicit state-waits (not
arbitrary timeouts) during implementation, confirmed live via MCP before being treated as real:

- **Status toggle trigger button** — right after the detail page's route lands, the
  Activate/Deactivate trigger button briefly renders a default label (observed as "Activate")
  before the real Status value arrives and the label syncs to it; clicking during that window
  opens the wrong confirmation dialog (mismatched with the actual current status).
  `CustomAttributesActions.toggleStatus` now waits for the Status field to show one of its two
  real values before touching the trigger. Separately confirmed: confirming a toggle redirects
  the browser to the list page rather than leaving it on the detail page, so the real outcome
  can only be read after re-opening the detail page — `toggleStatus` does that explicitly
  instead of asserting on a locator from a page the app has already navigated away from.
- **Edit form fields** — the Edit form's fields populate asynchronously after the route change
  lands (same shape of race as above); editing the Name field before that fetch resolves can
  have the original value silently arrive afterward and overwrite the edit.
  `CustomAttributesActions.updateName` now waits for the field to hold its original (non-empty)
  value before clearing and re-filling it.

One locator bug was also found and fixed (not an app bug): `detailStatusToggleButton`'s regex
(`/^(De)?activate$/`) only matched lowercase "activate", so it never matched the real
"Activate" label (capital A) shown when reactivating — corrected to
`/^(De)?[Aa]ctivate$/`. A second own-code bug (not app, not locator) was also corrected: the
reactivate scenario compared the resulting status text against `"Active"`, but the detail page
renders it as `"Activated"` (matching the convention already established for BIDC475-6) — both
the Action's expected-status literal and the feature file's asserted string were corrected.
