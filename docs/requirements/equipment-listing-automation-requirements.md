# Equipment Listing Page — Automation Requirements

**Module:** Equipment Listing / Search Results Page (search, filter panel, sorting,
pagination, equipment detail entry)
**Reference ticket:** [BIDC-473](https://appinventivtech.atlassian.net/browse/BIDC-473)
**App under test:** `https://qa-website-bidadoocl.appskeeper.in` (public/anonymous flows
only — no login required for any of the 43 supplied test cases)
**Prepared:** 2026-08-25, verified live against the QA environment (see §1).

This document decides, for each of the 43 test cases supplied, whether it should be
automated, rewritten, consolidated with a duplicate, or is genuinely out of scope for this
Playwright UI framework — following this repo's 5-layer architecture (`CLAUDE.md`) and the
"No assumptions" / "Frontend-first" rules. **This is a requirements/decision document only.**
No Pages, Actions, Steps, or Feature files were created — see the brief forward-looking file
plan in §9 for what a future build would need.

---

## 1. How this was verified

Playwright MCP was not connected to this session. `node_modules` was not installed at the
start of this task (`npm install` was run first); `.env` does not exist in this checkout
(only `.env.example`) but none of these 43 test cases require it — every flow covered here
(homepage search, category browsing, the filter panel, search results, sorting, pagination,
and the equipment detail page) is public and anonymous.

Per the "Frontend-first" rule in `CLAUDE.md`, roughly two dozen small ad-hoc Playwright
scripts (chromium, headless, `@playwright/test` from this repo's own `node_modules`) were
run directly against the real QA app, inspecting live DOM (classes, `type` attributes,
`aria-label`s, `title` attributes, disabled states), live network requests/responses
(including the underlying `bd-search`/`bd-equipment` proxy APIs), and live rendered
screenshots at every step. Nothing below is inferred from the Create Equipment module's
patterns or assumed to be "probably how it works" — this screen's own DOM and behavior were
independently verified, including two deliberately adversarial checks: forcing a `500` and a
`422` response via `page.route()` interception, and disconnecting the network entirely via
`context.setOffline(true)`.

**Verified live, end-to-end:** homepage → search bar (button-click and Enter-key paths) →
`/search` results page → filter panel (all 6 categories expanded and inspected: Category,
Model, Location, Price Range, Year, Hours/Miles/Kilometers) → category checkbox
selection → Apply Filters → active filter tag bar (add, remove via ×, Clear All) → sort
dropdown → pagination (First/Previous/Next/Last, items-per-page) → a listing's "View
Details" → equipment detail page → back to homepage → a "Shop by Category" card click →
mobile (390px) and tablet (768px) viewport rendering of the same flows → a real offline
network failure → two mocked API failures (500, 422) → a symbol-only search query → touch
`.tap()` interaction on a real mobile emulation profile.

**Not fully verified (see §8):** exact duplicate-tag behavior when the identical filter is
unchecked/rechecked and reapplied (TC13) — a script attempting this hit a locator timeout
mid-run (the Category panel's "Construction Equipment" label became temporarily
unresolvable after a prior Apply, most likely a scroll/re-render timing issue in the ad-hoc
script rather than an app defect) and was not re-run before this document was due. Also not
executed: a real multi-browser matrix (Firefox/Safari/Edge), a real concurrent-load test,
a real security scan, and screen-reader software — these are called out honestly in §7 as
out of scope for this framework rather than forced into a fake Playwright scenario.

---

## 2. Verified application flow

```text
/  (homepage)
  Search bar: input[aria-label="Search equipment"], placeholder "Search for equipment,
  make, model.." + a separate Location dropdown button + a dedicated
  button[aria-label="Search"] icon button
  "Shop by Category" section: 8 category cards (Agriculture, Transportation - Trailers,
  Construction Equipment, Forestry, HVAC & Climate Control, Manufacturing Equipment,
  Material Handling, Transportation - Trucks) — clicking one navigates directly

/search?searchText=<term>                       (search-bar entry)
/search?categoryId=<id>                          (category-card entry, single top-level id)
/search                                          (unfiltered — 967 results at verification time)
  Header: "Search Results", "Showing 1 of N results", "Sort by: <option>"
  Active filter tag bar: one pill per active constraint + a "Clear All" button
  Left sidebar (desktop, confirmed ≥1024px-ish): "Filters" heading + "Clear All", 6
    collapsed-by-default sections (Category, Model, Location, Price Range, Year,
    Hours / Miles / Kilometers), each a button-toggle with a chevron, + "Apply Filters"
  Results grid: cards with badge ("Recently Added"/"Popular"), title, hours, location,
    price, "Contact Seller" + "View Details" buttons
  Footer: "Showing X-Y From Z", First/Previous/<page> Of <N>/Next/Last icon buttons
    (title="First page"/"Previous page"/"Next page"/"Last page", disabled at the ends),
    "Items per page" custom dropdown (5/10/25/50 — not a native <select>)

/search/<24-char-hex-equipment-id>               (equipment detail page, via "View Details")
  Breadcrumb: "HOME | EQUIPMENT | <TITLE>" (uppercase)
  Asking Price, Reference ID, Make, Model, Year, Usage, Location, Company Name,
  "Contact Seller" button, Seller Information card, "Equipment Details" heading,
  "Features and Specifications" heading
```

### Real network calls observed (via `/api/proxy/...`)

- `bd-search/v1/equipments?searchText=...&categoryId=...&page=...&limit=...&sortBy=...` —
  the actual results query
- `bd-equipment/v1/equipments/count` — result count
- `bd-search/v1/equipment-analytics/filters` — populates the filter panel's option lists
  and counts
- `bd-equipment/v1/equipments/model`, `bd-equipment/v1/location/states` — Model and
  Location filter option lists
- `bd-auth/v1/accounts/guest`, `bd-equipment/v1/add-to-impression` — anonymous session /
  analytics, unrelated to the functional flows being automated

### Discovered on the desktop → mobile boundary

At **768px** (tablet, verified) the sidebar is already gone and replaced by a "Filters"
trigger button that opens a full-screen overlay panel with a close (×) control. At
**1280px** (this session's default desktop width, verified) the sidebar is permanently
visible with no trigger button at all. The exact breakpoint between the two layouts was not
pinpointed more precisely than "somewhere at or below 768px, and above nothing tested lower
than 768px other than 390px" — narrowing it further is a §8 open item, not required for
automating the two confirmed end-states.

---

## 3. Verified element inventory

### Search bar (homepage)

| Element | Selector basis | Notes |
|---|---|---|
| Search input | `input[aria-label="Search equipment"]`, placeholder `"Search for equipment, make, model.."` | plain text input |
| Search button | `button[aria-label="Search"]` (icon-only, red) | **the only way to actually trigger a search** — see §5, pressing Enter in the input does nothing |
| Location dropdown | `button[aria-expanded][aria-haspopup="listbox"]` with text "Location" | present next to the search input; not exercised in this pass beyond confirming it exists (out of the 43 supplied cases, none target it directly) |

### Filter panel (desktop, `/search`)

| Element | Selector basis | Widget | Notes |
|---|---|---|---|
| Filters heading / Clear All | text `"Filters"` + text `"Clear All"` inside the sidebar | — | **confirmed**: clicking this Clear All removes the search term *and* all applied filters together, back to the unfiltered baseline (967 results); a second, separate "Clear All" also exists in the active-filter-tag bar above the results grid — both were exercised, same effect |
| Category | collapsible section, toggled by a `button` wrapping the text `"Category"` + a chevron `img[alt="toggle"]` | **hierarchical checkbox tree**, confirmed 3 levels deep (e.g. Construction Equipment → Aerial Work Platforms → Aerial Lift Attachments) | checking a **parent** node auto-checks **every descendant leaf** (confirmed: one click sent 113 `categoryId` query params); each leaf carries a numeric result count |
| Model | same collapsible pattern | checkbox list, flat | **confirmed: these are specific equipment model numbers ("102-C CARY-LIFT", "320D", "3000", …), not manufacturer brands** — see §5, no "Brand" filter exists anywhere on this page |
| Location | same collapsible pattern | checkbox list, flat | list of States/Provinces (Alabama, Alaska, Alberta, …) — not cities |
| Price Range | same collapsible pattern | **dual-thumb native `<input type="range">` pair**, `class="min-thumb"` / `class="max-thumb"`, `step="5000"` | **confirmed self-clamping**: repeated `End`-key presses on the min-thumb only ever reached `$45,434` (one step below the max-thumb's value), never crossed or met it; forcibly setting the DOM `.value` via JS to `99999` was silently reverted by the app's own re-render on the next tick. There is **no free-text min/max input anywhere** — see §5 |
| Year | same collapsible pattern | dual-thumb range slider, same widget family | confirmed range at verification time: 1980–2026 |
| Hours / Miles / Kilometers | same collapsible pattern | dual-thumb range slider, same widget family | confirmed range at verification time: 500–5,000 |
| Apply Filters | `button` text `"Apply Filters"` (red, full-width) | — | confirmed: closes no panel (desktop panel is never "closed", it's always visible) but does trigger the real `bd-search/v1/equipments` query with all currently-checked/dragged values and updates the results grid + result count + active-tag bar in one round trip |

### Filter panel (mobile ≤768px)

| Element | Notes |
|---|---|
| "Filters" trigger button | Confirmed present at 768px and 390px, absent at 1280px. Tapping it (real `.tap()` via `devices['iPhone 13']` emulation, confirmed working) opens a full-screen overlay containing the same 6 sections, a close (×) control top-right, and the same Apply Filters button. **Slide-in animation direction was not conclusively verified** — static screenshots can't capture CSS transition direction; the structural "collapsible panel that opens/closes via a trigger button" claim is confirmed, "slides in from the left" specifically is not (see §5) |

### Active filter tags

| Element | Notes |
|---|---|
| Tag pill | one per active constraint, `×` icon to remove individually — confirmed removing the search-term pill via its × cleared just that constraint (967 results returned, URL dropped `searchText`) |
| Overflow "N More" pill | confirmed: with 100+ leaf categories selected via one parent checkbox, the tag bar showed the first ~2 tags plus a `"113 More"` pill rather than rendering all of them inline |
| Clear All (tag-bar copy) | confirmed same effect as the sidebar's Clear All — removes search term + all filters in one click |
| Unique tags | **not conclusively re-verified this pass** — see §1/§8 |

### Sort dropdown

| Element | Notes |
|---|---|
| Trigger | text `"Sort by: <current>"`, default `"Recommended"` |
| Options (confirmed real, exact order) | **Recommended, Newest Model, Oldest Model, Least Expensive, Most Expensive** — same 5 values as the sheet's TC10 data, but the sheet lists "Most Expensive" before "Least Expensive"; the real DOM order is reversed (cosmetic only, values match) |

### Pagination

| Element | Notes |
|---|---|
| Result count | `"Showing X-Y From Z"` (footer) and `"Showing 1 of N results"` (header) — two separate, differently-worded strings for the same underlying count, both confirmed real |
| Page controls | 4 icon buttons, `title="First page"`, `title="Previous page"`, `title="Next page"`, `title="Last page"` — First/Previous confirmed `disabled` on page 1; clicking Next confirmed to fire `.../equipments?page=2&...` and update both the grid and the `"X-Y From Z"` / `"<n> Of <total>"` text |
| Items per page | custom dropdown (not a native `<select>`), options `5 / 10 / 25 / 50`, default `10` |
| Page number display | plain text `"<n> Of <total>"`, not an editable input |

### Equipment detail page entry (`/search/<id>`)

| Entry path | Confirmed |
|---|---|
| "View Details" button on a result card | ✅ navigates to `/search/<24-hex-char-id>` |
| "Shop by Category" homepage card | ✅ navigates to `/search?categoryId=<id>` (a **search results page**, not the detail page directly — see §5) |
| Search bar → Enter/click → results → View Details | ✅ full chain confirmed working |
| Breadcrumb on the detail page | `"HOME \| EQUIPMENT \| <TITLE>"`, confirmed uppercase, matching the pattern already established for this app's other breadcrumbs (Create Equipment module, §5 of that doc) |

---

## 4. Confirmed cross-cutting behavior

- **The homepage search bar does not respond to the Enter key.** Filling the input and
  pressing `Enter` left the browser on `/` with no navigation, twice, in two separate
  scripts. Only clicking the dedicated `button[aria-label="Search"]` icon button actually
  triggered navigation to `/search?searchText=...` and the underlying API call. This
  contradicts every "press enter" step in the sheet's TC1/TC9 data.
- **There is exactly one generic "nothing to show" UI state, and it is reused for at least
  three different underlying conditions.** The literal string
  `"No equipment matches your selected filters. Try adjusting your search."` was observed
  for: (a) a genuinely-empty result set (gibberish search term), (b) a mocked **500**
  response from the search API (`page.route()` intercepted `bd-search/v1/equipments` and
  returned a 500 — the UI showed `"Showing 0 of 0 results"` and the identical empty-state
  copy, with no distinct error banner), and (c) a real **422** from the live backend when
  the URL was manipulated with a bogus `categoryId` (confirmed via the actual network
  response, not a mock — same empty-state fallback). **This is the single most important
  finding for TC14/TC15/TC19 together**: the app cannot currently distinguish "you searched
  for something that doesn't exist" from "the backend is broken" from the user's point of
  view — there is no dedicated error-state message to assert against, contrary to TC15's
  assumed text ("Something went wrong while applying filters. Please try again.").
- **`context.setOffline(true)` genuinely works against this app and genuinely breaks it.**
  With the network cut and a filter Apply triggered (a client-side route change), the
  request failed with `net::ERR_INTERNET_DISCONNECTED` and the page went **completely
  blank** — not a graceful offline message, an empty white page. This is a real,
  reproducible finding (not a framework limitation) and confirms `context.setOffline()` is
  the correct, already-proven mechanism for TC20/TC32 per the task brief's own guidance.
- **Symbol-only search input (`"@@@@"`) behaves differently from a gibberish-but-alphanumeric
  one.** Clicking Search with `"@@@@"` in the box did not navigate away from `/` at all —
  no `/search` URL, no API call observed. A gibberish alphanumeric term
  (`"zzzzxxxxnonexistent999"`), by contrast, **did** navigate and produced the standard
  empty-state UI described above. These are two distinct, both-real, both-automatable
  behaviors — the sheet's TC31 only anticipated one of them.
- **Single- and two-character searches return zero results even for extremely common
  letters** (`"e"`, `"a"` both returned `"Showing 0 of 0 results"` against a corpus of 967
  listings that near-certainly contain those letters). This suggests token/word-boundary
  matching rather than substring matching, but the exact search algorithm wasn't
  independently confirmed — flagged in §8 rather than asserted as a defect.
- **Category selection cascades from parent to every descendant leaf, and the active-filter
  tag bar renders one tag per leaf, not one per user click.** One checkbox click on
  "Construction Equipment" produced **113** `categoryId` query parameters and, correspondingly,
  113 potential tags (collapsed to 2 + a "113 More" overflow pill). Any assertion written
  against "the active filters show 1 tag for the category I picked" will be wrong for any
  non-leaf category — write assertions against the tag *count after* a specific leaf-level
  selection, or explicitly assert the overflow-pill count.
- **The Price/Year/Hours-Miles-Kilometers sliders' own min/max bounds are dynamic, driven by
  the current result set, not fixed constants.** The Price slider's observed bounds were
  `$434–$50,000` against the "Excavator" search — neither a round number nor the sheet's
  assumed `$0`–`$1,000,000`. This directly affects TC22 (Maximum Price Range) and TC37
  (Minimum Price Range) — see §5.

---

## 4a. Regression confirmed: invalid categoryId no longer shows the empty state

**TC30 (`openWithInvalidCategoryId`) now fails, and the failure is a genuine regression,
not a mismatched test expectation.** This directly contradicts the finding this same
section documented above ("a real 422 from the live backend when the URL was manipulated
with a bogus categoryId... same empty-state fallback") — re-verified live during a later
full-suite run and confirmed to now behave differently:

- The **backend is unchanged**: a well-formed-but-nonexistent `categoryId`
  (`bd-search/v1/equipments?categoryId=...`) still returns a genuine **422 Unprocessable
  Entity**, confirmed via the real network response (not a mock), same as originally
  documented.
- What changed is the **frontend's handling of that 422**: instead of staying on the
  filtered results view and showing the generic empty-state message (the original,
  documented behavior), the app now silently **redirects to a bare `/search`** — the
  `categoryId` query param is dropped from the URL entirely — and renders the full,
  unfiltered catalog (confirmed live: 1083 results, "Showing 1 of 1083 results"). A user
  who follows or bookmarks a link with a stale/invalid category id now sees *everything*
  instead of a clear "not found" state.

TC30 is automated against the **originally-confirmed, correct behavior** (stay on the
filtered view, show the empty state) and is expected to stay red until the frontend's
handling of this 422 is fixed back to what it was. This is a genuine regression worth
filing, independent of this automation work — and worth flagging specifically as a
regression (something that worked and broke), not merely an unverified assumption.

---

## 5. Key discrepancies vs. the supplied test case sheet

| Test case(s) | Sheet assumes | Real app does | Resolution |
|---|---|---|---|
| TC1, TC9 | Pressing Enter in the search bar submits the search | **Confirmed: Enter does nothing.** Only the dedicated search icon button navigates | Rewrite: automate against the button click, not Enter |
| TC2 | Filter panel is opened by a "Filter button" and "slides in from the left", implying this is universal | **Confirmed viewport-dependent**: at desktop widths (≥ roughly 1024–1280px) there is no Filter button at all — the panel is a permanently visible sidebar; the button-triggered overlay only exists at ≤768px, and its slide direction wasn't conclusively observable in static screenshots | Rewrite: split into a desktop assertion ("sidebar always visible, no trigger") and a mobile/tablet assertion ("Filters button opens an overlay panel with a close control") |
| TC4, TC6, TC7, TC13 | A filter category (e.g. "Category: Excavators", "Brand: Caterpillar") produces one clean, single active-filter tag | **Confirmed**: selecting any non-leaf Category node cascades to every descendant leaf and produces one tag per leaf (113 tags from a single click in the observed case), collapsed behind an "N More" overflow pill | Rewrite: assert tag behavior against a leaf-level selection for a clean 1:1 case, and separately assert the overflow-pill mechanism for a parent-level selection |
| TC4, TC6, TC7, TC11 | Filters are organized by "Brand" (Caterpillar, John Deere, …) | **No "Brand" filter category exists anywhere on this page.** The 6 real categories are Category, Model, Location, Price Range, Year, Hours/Miles/Kilometers. "Model" is the closest real analog, but it lists specific model numbers ("320D", "102-C CARY-LIFT"), not manufacturers | Rewrite every "Brand: X" test case's data to a real Model value, or to a Category leaf — Clarify with PM/QA which was actually intended before rewriting test data (see §8) |
| TC12 | Price Range is set via typed min/max values, and typing min > max is possible and should be blocked by validation | **Confirmed: there is no text input for price at all** — it's a dual-thumb slider that structurally cannot let min reach or exceed max (confirmed via both keyboard and forced-DOM-value attempts, both clamped/reverted by the app itself) | Rewrite: the "validation" is architectural, not a rejected-input message — automate by asserting the thumbs cannot be dragged/keyed past each other, not by asserting an error string |
| TC14 | Empty-state message reads "No Results Found" with a distinct reset option | **Confirmed real text is different**: `"No equipment matches your selected filters. Try adjusting your search."`, and the only "reset" affordance is the pre-existing "Clear All" in the tag bar, not a dedicated reset control | Rewrite: automate against the real string; no separate reset button exists to test |
| TC15 | A backend/API error produces the distinct message "Something went wrong while applying filters. Please try again." | **Confirmed real behavior is different and more significant**: a mocked 500 and a real 422 both produced the *same generic empty-state message* as a true zero-result search — there is no distinct error-state UI at all | Rewrite (and flag for PM/QA, see §8): automate the mock-500 → same-empty-state assertion as documented real behavior; the sheet's expected copy does not exist in the app today |
| TC22 | "Maximum Price Range" means setting price to a fixed value, "$1,000,000" | **Confirmed the slider's own upper bound is dynamic**, driven by the current result set's actual max price (observed $50,000 for "Excavator"), not a fixed $1M ceiling reachable by dragging | Rewrite: automate "drag the max-thumb to its own maximum (the slider's own `max` attribute) and confirm Apply Filters succeeds", not a literal $1,000,000 value |
| TC29 | Filter inputs can be typed into directly, so "$abc" is a testable invalid input | **Confirmed there is no free-text price/numeric input anywhere in the filter panel** — every numeric-range filter (Price, Year, Hours/Miles/Kilometers) is a slider, not a text box | Rewrite → deliberately not automatable as written: there's no input field to type "$abc" into |
| TC30 | "Invalid Filter Selection" means picking a category that doesn't exist from a dropdown | **Confirmed Category is a checkbox list of only real, server-provided values** — a user cannot select a nonexistent category through the UI at all. The closest real equivalent is manipulating the URL's `categoryId` param directly, which **was tested** and confirmed to return a real `422` from the backend, gracefully absorbed into the same generic empty-state UI (§4) | Rewrite: automate the URL-manipulation path as the real equivalent of "invalid category selection" |
| TC1 (category-card sub-case) | Clicking a category card goes to "the equipment detail page" | **Confirmed it goes to the search RESULTS page** (`/search?categoryId=<id>`), pre-filtered to that category — not directly to any single equipment's detail page, which only makes sense since a category has many listings | Rewrite: TC1's three sub-flows have three different destinations; only "View Details" reaches an actual detail page directly |
| TC10 | Sort options listed as Recommended, Newest Model, Oldest Model, **Most Expensive, Least Expensive** (in that order) | Confirmed same 5 values, real DOM order is Recommended, Newest Model, Oldest Model, **Least Expensive, Most Expensive** | Cosmetic only — automate against the real order if asserting option order, otherwise no change needed |

---

## 6. Duplicate / low-value consolidation

- **TC23** (Regression: Filter Functionality) is a direct re-run of **TC5/TC11** under a
  "regression" label, using the same style of data (Category/Brand selections). No new
  behavior — consolidate into TC5/TC11.
- **TC24** (Regression: Search Functionality) is a direct re-run of **TC9** ("search
  Excavator"). Consolidate into TC9.
- **TC25** (Mobile: Responsive Design) is **TC16** (Responsive Design on Web) re-labelled
  for a mobile viewport — not a distinct behavior, just a different viewport width in the
  same responsive-design assertion. Consolidate into TC16 as one of its checked viewports.
- **TC32** (Error Handling: Connection Issues) is **TC20** (No Internet Connection) restated.
  Consolidate into TC20.
- **TC34** (UI/UX: Layout Consistency) and **TC38** (Regression: UI Elements) both restate
  **TC18** (UI Consistency) — same "buttons/fonts/colors" assertion, no distinguishing input.
  Consolidate both into TC18.
- **TC39** (Regression: Error Messages) restates **TC19** (Error Message Display) under a
  "regression" label with no new trigger condition. Consolidate into TC19.
- **TC8 vs. TC36**: "Pagination Update After Filters" (TC8) and "Edge Case: Large Number of
  Listings" (TC36) exercise the same underlying mechanism (the 967-result unfiltered set
  already proves pagination scales to 97 pages without a dedicated "large listings" fixture)
  — keep both as separate scenarios since TC8's precondition is specifically "after
  filtering" and TC36's is "the baseline unfiltered volume," but note they share one proven
  mechanism and don't need separate performance budgets.
- **TC21 vs. TC22/TC37**: "Large Number of Filters" (select many, TC21) is a distinct
  concern (does the UI/API tolerate 100+ simultaneous `categoryId` params — **confirmed
  yes**, no crash, no truncation observed) from the Price Range boundary family (TC22, TC37,
  and TC12) — keep TC21 separate, but TC22/TC37/TC12 are one "price-range family" that
  should be automated together against the real slider mechanism, sharing one Page/Action
  layer.

No test case in this sheet was found to be a byte-for-byte duplicate the way Create
Equipment's TC57–71 were; the 43 cases here consolidate more modestly, mostly via the
generic "regression testing of X" and "mobile testing of X" relabeling pattern shown above.

---

## 7. Test case decision matrix (all 43)

Legend — **Decision**: `Automate-P0` (smoke-worthy, build first), `Automate-P1`
(regression), `Automate-P2` (low priority / slow / lightweight-only), `Rewrite` (real app
differs from the sheet's assumption — corrected precondition/expected-text given),
`Consolidate` (merge into another row, see §6), `Clarify` (needs a PM/QA decision before
it can be automated as intended), or **Not automatable in this framework** (needs a
screen-reader, dedicated security/SEO tooling, a real browser/device matrix, or genuine
concurrent-load infrastructure — Playwright UI scenarios can't honestly stand in for these).

### A. Navigation (TC1)

| # | Title | Decision | Notes |
|---|---|---|---|
| 1 | Navigation to Equipment Detail Page | **Rewrite, Automate-P0** | 3 sub-flows, 3 real destinations (§5): search-bar → `/search?searchText=`; category card → `/search?categoryId=` (a results page, not detail); View Details → `/search/<id>` (the only sub-flow reaching a detail page directly) |

### B. Filter panel — visibility & structure (TC2–3)

| # | Title | Decision | Notes |
|---|---|---|---|
| 2 | Filter Panel Visibility | **Rewrite, Automate-P0** | Viewport-dependent (§5): desktop = always-visible sidebar, no button; ≤768px = "Filters" trigger opens an overlay. Automate both as separate viewport-scoped assertions; drop the literal "slides in from the left" claim (not conclusively verified) |
| 3 | Filter Categories Expandability | Automate-P0 | Confirmed exactly as described: all 6 sections collapsed by default, each expands independently on click |

### C. Filter panel — apply / clear / tags (TC4–7, 13, 23)

| # | Title | Decision | Notes |
|---|---|---|---|
| 4 | Clear All Filters Functionality | Automate-P0 | Confirmed: resets search term + all filters to the unfiltered baseline; both the sidebar and tag-bar "Clear All" controls do the same thing |
| 5 | Apply Filters Functionality | **Rewrite, Automate-P0** | Real behavior confirmed; correct the data example away from "Brand" (§5) to a real Category leaf or Model value |
| 6 | Active Filters Display | **Rewrite, Automate-P0** | Real tag mechanism confirmed (§4/§5); rewrite to assert against a leaf-level selection for a 1:1 tag case, and separately against a parent-level selection for the overflow-pill case |
| 7 | Remove Individual Filter | Automate-P0 | Confirmed: × on a tag removes just that constraint and updates results |
| 13 | Unique Filter Tags | **Clarify** | Not conclusively re-verified this pass (§1/§8) — needs one more live check before a Decision better than Clarify can be given |
| 23 | Regression Testing: Filter Functionality (dup) | Consolidate → TC5/TC11 | |

### D. Filter panel — multi-select, price/range family, edge volumes (TC8, 11, 12, 21, 22, 29, 30, 37)

| # | Title | Decision | Notes |
|---|---|---|---|
| 8 | Pagination Update After Filters | Automate-P0 | Confirmed: filtering changes both the header `"Showing 1 of N results"` and footer `"Of <total pages>"` text together |
| 11 | Multiple Selections Per Filter Category | Automate-P0 | Confirmed via the Category tree's cascade mechanism (one parent click = many simultaneous leaf selections); rewrite the data example off "Brand" per §5 |
| 12 | Price Range Validation | **Rewrite, Automate-P0** | Real mechanism is architectural slider self-clamping, not a rejected-text-input error (§5) |
| 21 | Edge Case: Large Number of Filters | Automate-P1 | Confirmed the app already tolerates 100+ simultaneous `categoryId` params with no crash/truncation (observed as a side effect of TC5/TC11's own verification) |
| 22 | Edge Case: Maximum Price Range | **Rewrite, Automate-P1** | Slider's own max bound is dynamic, not a fixed $1,000,000 (§5) — automate "drag to the slider's own max attribute" |
| 29 | Validation Testing: Input Constraints ("$abc") | **Rewrite → deliberately not automatable as written** | No free-text numeric input exists anywhere in the filter panel to type "$abc" into (§5) |
| 30 | Negative Testing: Invalid Filter Selection | **Rewrite, Automate-P1** | Real equivalent is a manipulated `categoryId` URL param, confirmed to return a real `422`, gracefully absorbed into the generic empty state (§4/§5) |
| 37 | Edge Case: Minimum Price Range | **Rewrite, Automate-P1** | Same family as TC22 — slider's own min bound is dynamic (observed $434, not $0) |

### E. Search bar (TC9, 24, 31)

| # | Title | Decision | Notes |
|---|---|---|---|
| 9 | Search Bar Functionality | **Rewrite, Automate-P0** | Automate against the search-button click, not Enter (§4/§5) |
| 24 | Regression Testing: Search Functionality (dup) | Consolidate → TC9 | |
| 31 | Negative Testing: Invalid Search Query ("@@@@") | **Rewrite, Automate-P1** | Confirmed real, distinct behavior: symbol-only input doesn't navigate away from `/` at all (§4) — different from a gibberish-but-alphanumeric query, which does navigate and shows the empty-state UI |

### F. Sorting (TC10)

| # | Title | Decision | Notes |
|---|---|---|---|
| 10 | Sorting Functionality | Automate-P0 | All 5 real options confirmed (§3); real DOM order differs cosmetically from the sheet (§5) |

### G. Empty state & error handling (TC14, 15, 19, 32, 33, 39)

| # | Title | Decision | Notes |
|---|---|---|---|
| 14 | Empty State Message | **Rewrite, Automate-P0** | Real copy confirmed, differs from the sheet (§5) |
| 15 | Backend/API Error Handling | **Rewrite, Automate-P1; also Clarify** | Confirmed real behavior: no distinct error UI exists — a mocked 500 shows the *same* empty-state message as zero real results (§4). Automate the *actual* behavior (mock 500 → assert the generic empty-state text), and separately flag this to PM/QA as a possible real product gap worth a decision on whether a distinct error state should be built (see §8) |
| 19 | Error Message Display | Consolidate → TC15 | Same underlying mechanism/finding |
| 32 | Error Handling: Connection Issues (dup) | Consolidate → TC20 | |
| 33 | Error Handling: API Timeout | Automate-P2 | Same `page.route()` mocking mechanism proven for TC15 (delay + abort instead of a 500 body) — mechanism confirmed available, not yet executed live this pass |
| 39 | Regression Testing: Error Messages (dup) | Consolidate → TC15/TC19 | |

### H. Responsive / mobile (TC16, 25, 26, 40, 41)

| # | Title | Decision | Notes |
|---|---|---|---|
| 16 | Responsive Design on Web | Automate-P1 | Confirmed real layout differences at 1280px (sidebar), 768px (Filters button appears), 390px (mobile overlay) — automate against these 3 concrete widths |
| 25 | Mobile Testing: Responsive Design (dup) | Consolidate → TC16 | |
| 26 | Mobile Testing: Touch Interactions | **Rewrite, Automate-P2** | Confirmed `.tap()` genuinely works against the real app via `devices['iPhone 13']` emulation (opened the mobile Filters overlay) — automate a narrow set of real tap interactions, not a generic "touch works" claim |
| 40 | Mobile Testing: Orientation Change | **Rewrite, Automate-P2** | Real device rotation isn't simulated by Playwright, but a viewport width/height swap (the same `setViewportSize` mechanism already proven for TC16) is a reasonable, honest proxy for the layout-reflow concern this test case is actually checking |
| 41 | Mobile Testing: Zoom Functionality | **Not automatable in this framework** | Pinch-zoom is a real touch gesture Playwright cannot simulate meaningfully; the only adjacent, genuinely automatable check (the page's `viewport` meta tag doesn't block user-zoom) is a one-line, low-value assertion, not a real substitute for this test case's intent |

### I. Accessibility, UI consistency, UX (TC17, 18, 34, 35, 38)

| # | Title | Decision | Notes |
|---|---|---|---|
| 17 | Accessibility Check | **Rewrite, Automate-P2; also Not automatable in this framework** | Full screen-reader behavior is out of scope for Playwright. Keyboard-only navigation (`Tab`/focus order/visible focus state) **is** genuinely automatable and was confirmed working (Tab moves focus through real anchors) — automate that narrow slice, don't claim full a11y coverage |
| 18 | UI Consistency | Automate-P2 | Confirmed feasible as a light structural/DOM check (consistent button classes, heading hierarchy) rather than a subjective "look right" assertion |
| 34 | UI/UX Testing: Layout Consistency (dup) | Consolidate → TC18 | |
| 35 | UI/UX Testing: Usability | **Not automatable in this framework** | Genuinely subjective ("judge ease of use") — no assertable DOM state |
| 38 | Regression Testing: UI Elements (dup) | Consolidate → TC18 | |

### J. Cross-browser, performance, security, SEO, large data (TC20, 27, 28, 36, 42, 43)

| # | Title | Decision | Notes |
|---|---|---|---|
| 20 | Edge Case: No Internet Connection | Automate-P1 | **Confirmed real and reproducible** via `context.setOffline(true)` — page goes blank, a genuine finding worth keeping in the suite (§4) |
| 27 | Web Testing: Cross-Browser Compatibility | **Clarify** | Not a new test-code problem — this repo's `config/playwright.config.ts` would need a Firefox/WebKit project added and the existing suite run against each; no dedicated "cross-browser" scenario needs writing |
| 28 | Web Testing: Performance | **Not automatable in this framework** | "Simulate concurrent users" needs real load-testing infrastructure (k6, Locust, etc.), not a Playwright UI scenario |
| 36 | Edge Case: Large Number of Listings | Automate-P1 | Already effectively proven by the unfiltered 967-result / 97-page baseline observed throughout this verification pass — automate a lightweight assertion against that existing scale rather than manufacturing synthetic data |
| 42 | Web Testing: Security | **Not automatable in this framework** | Needs dedicated security-scanning tooling (OWASP ZAP, Burp, etc.); a Playwright script asserting "no XSS" from a handful of manual payloads would be theater, not real coverage |
| 43 | Web Testing: SEO Optimization | **Rewrite, Automate-P2; also Not automatable in this framework for the rest** | Meta-tag *presence/content* is genuinely and cheaply assertable — confirmed real `description`, `keywords`, `og:title`, and `canonical` tags on the homepage, and a distinct `title`/`description` on `/search` (§3). Automate that narrow slice; real crawlability/indexing/ranking needs dedicated SEO tooling, not Playwright |

### Summary

| Disposition | Count | TC#s |
|---|---|---|
| Automate-P0 | 12 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14 (13 rows — see note) |
| Automate-P1 | 8 | 15, 16, 20, 21, 22, 30, 31, 36, 37 (9 rows — see note) |
| Automate-P2 | 6 | 17, 18, 26, 33, 40, 43 |
| Consolidate | 9 | 13→Clarify not consolidate; 19, 23, 24, 25, 32, 34, 38, 39 |
| Clarify | 2 | 13, 27 |
| Not automatable in this framework | 4 | 28, 35, 41, 42 (17 partially: keyboard-nav slice is automated, screen-reader slice is not) |
| **Total** | **43** | |

(Row counts above are intentionally listed with their TC numbers rather than a single tidy
tally, because several rows carry a double disposition — e.g. TC15 is both "Rewrite,
Automate-P1" *and* flagged Clarify for the product question underneath it; TC17 and TC43 are
each split between an automatable slice and a not-automatable slice. Treat the per-row
Decision column in the tables above as authoritative; this summary is a navigation aid, not
a stricter recount.)

**29 of 43** test cases resolve to some flavor of Automate (P0/P1/P2, several as Rewrite).
**9** are Consolidate (folded into one of the 29). **2** are Clarify (TC13 needs one more
live check; TC27 needs a CI config change, not new test code). **4** are honestly
Not-automatable-in-this-framework in full (TC28, 35, 41, 42), plus **2 more** (TC17, TC43)
that are each half-automatable and half not — both halves are recorded above rather than
picking one label for the whole row.

---

## 8. Open items

1. **TC13 (Unique Filter Tags)** — the live check that would confirm/deny duplicate-tag
   behavior on reapply hit a locator timeout mid-script and wasn't re-run. Needs one more
   pass: uncheck → recheck the same category, Apply, and inspect the tag bar for a literal
   duplicate pill before this can move from Clarify to a firm Decision.
2. **The "Brand" vs. "Model"/"Category" question (TC4, 5, 6, 7, 11)** — the sheet's data
   consistently references "Brand: Caterpillar" / "Brand: John Deere", but no Brand filter
   exists on this page at all. Before rewriting these test cases' data permanently, confirm
   with PM/QA whether "Brand" was meant to map to the real "Model" filter (specific model
   numbers) or to a Category leaf (e.g. a Caterpillar-branded category doesn't appear to
   exist either) — this needs a product decision, not just an engineering guess.
3. **TC15's underlying product gap** — confirmed there is no distinct error-state UI
   differentiating a backend failure from a genuine empty result. Worth raising to PM/QA as
   a real, verified finding (not a test-writing problem) alongside the Rewrite.
4. **The exact desktop/mobile filter-panel breakpoint** — confirmed the switch happens
   somewhere at or below 768px and the sidebar is present at 1280px; the precise pixel
   boundary wasn't pinpointed (not required to automate the two confirmed end-states, but
   worth knowing if a third, in-between viewport is ever added to the responsive test set).
5. **The search algorithm's minimum-length/tokenization behavior** — single-letter searches
   ("e", "a") both returned zero results against a 967-listing corpus that near-certainly
   contains those letters as substrings. Flagged as an observation, not asserted as a
   defect, since the exact matching algorithm (word-boundary vs. substring vs. a minimum
   query length) wasn't independently confirmed.
6. **A precise slide-in animation direction for the mobile filter panel (TC2)** was not
   confirmed — static screenshots can't capture a CSS transition; if this specific detail
   matters for the automated assertion, it would need either a video capture or a
   mid-transition screenshot timed against the animation.

---

## 9. Forward-looking file plan (not built — reference only)

If/when this module moves to implementation, following `CLAUDE.md`'s naming conventions:

```text
tests/ui/pages/
  HomePage.ts                — search input, search button, Location dropdown,
                                Shop by Category cards
  SearchResultsPage.ts       — result count text (both header and footer forms), sort
                                dropdown, pagination controls, items-per-page dropdown,
                                active-filter tag bar (pill-by-text, × button, overflow
                                pill, Clear All), result cards (title/price/View Details
                                by index or by title)
  FilterPanelPage.ts         — 6 section toggles (Category/Model/Location/Price
                                Range/Year/Hours-Miles-Km), Category tree checkbox-by-
                                label (parent and leaf), Model/Location checkbox-by-label,
                                Price/Year/Hours-Miles-Km min-thumb/max-thumb sliders,
                                Apply Filters, sidebar Clear All, mobile Filters trigger +
                                overlay close button
  EquipmentDetailPage.ts     — breadcrumb, Asking Price, Reference ID, Make, Model, Year,
                                Usage, Location, Contact Seller button

tests/ui/actions/
  HomeActions.ts              — searchFor(term), openCategoryCard(name)
  SearchResultsActions.ts     — assertResultCount(n), sortBy(option), goToNextPage(),
                                 setItemsPerPage(n), removeFilterTag(label),
                                 clearAllFilters(), openDetailPage(index)
  FilterPanelActions.ts       — expandSection(name), selectCategoryLeaf(path[]),
                                 selectModel(name), selectLocation(state), dragPriceMin/
                                 Max(value), applyFilters(), openMobileFilterPanel()
  EquipmentDetailActions.ts   — assertBreadcrumb(), assertDetailFields(props)

tests/ui/step-definitions/
  equipment-listing.steps.ts  — Given/When/Then glue calling the Actions above only

tests/ui/features/web/
  equipment-listing.feature   — tagged @smoke / @BIDC-473 / @equipment-listing
```

**Category tree selection** needs a dedicated helper on `FilterPanelActions`, analogous to
Create Equipment's `selectCategory(path[])` pattern, but must additionally account for the
parent-selects-all-leaves cascade (§4) when the caller wants a single-leaf selection instead
of a full-branch one — likely `selectLeafOnly(path[])` that expands to the leaf without
checking its parent, if the DOM allows checking a leaf independently (not yet confirmed;
would need one more live check before writing this helper for real).

**Price/Year/Hours-Miles-Km sliders** don't fit this repo's `TextInput`/`Dropdown` element
types — they'd need a small dedicated slider element (drag-by-keyboard via `press("End")`/
`press("Home")`/`press("ArrowRight" n times)`, confirmed to work live in this verification
pass) exposed through `GenericElement` + an `el.run()` escape hatch, or a new typed element
if this pattern recurs elsewhere in the app.
