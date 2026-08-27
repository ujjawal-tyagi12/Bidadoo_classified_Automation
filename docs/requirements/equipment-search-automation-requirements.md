# Homepage: Search for Equipment — Automation Requirements

**Module:** Homepage → Search bar (keyword input, Location dropdown, Search button)
**Reference ticket:** [BIDC-469](https://appinventivtech.atlassian.net/browse/BIDC-469)
**App under test:** `https://qa-website-bidadoocl.appskeeper.in` (public/anonymous flow —
no login required for any of the 45 supplied test cases)
**Prepared:** 2026-08-26, verified live against the QA environment (see §1).

This document decides, for each of the 45 test cases supplied, whether it should be
automated, rewritten, consolidated, or is genuinely not applicable against the real app —
following this repo's 5-layer architecture (`CLAUDE.md`) and the "No assumptions" /
"Frontend-first" rules. **This is a requirements/decision document only.** No Pages,
Actions, Steps, or Feature files were created — see the forward-looking file plan in §9.

This module shares its app and homepage/results/detail routes with
[BIDC-473 (Equipment Listing Page)](./equipment-listing-automation-requirements.md), whose
document already covers the `/search` results page, the filter panel, and the equipment
detail page in depth. This document does not repeat that coverage — it focuses specifically
on the homepage search bar (keyword input, Location dropdown, Search button) and the
cross-page persistence claims the supplied sheet makes about it.

---

## 1. How this was verified

Playwright MCP was not connected to this session. Per the "Frontend-first" rule in
`CLAUDE.md`, roughly 20 small ad-hoc Playwright scripts (chromium, headless,
`@playwright/test`'s bundled `playwright` package from this repo's own `node_modules`) were
run directly against the real QA app, inspecting live DOM, live network requests/responses
(including full JSON response bodies from the `bd-search`/`bd-equipment` proxy APIs), and
two deliberately adversarial mocked-failure checks (`page.route()` returning a 500 on the
location API, and `route.abort("timedout")` on the search API). Nothing below is inferred
from the BIDC-473 document's findings or assumed "probably the same" — every claim specific
to the homepage search bar was independently re-verified live in this session.

**Verified live, end-to-end:** homepage search input + Search button (button-click and
Enter-key paths) → `/search?searchText=...` results; Location dropdown (open, lazy-load via
scroll, select, combine with keyword, location-only) → `/search?stateId=...`; the "static
suggestions panel" behavior under empty/partial/gibberish input; symbol-only keyword
behavior; very-long-keyword behavior; special-character and numeric keyword behavior
(`D6T-XL`, `320D`, `CAT320D`), including full response-body inspection of the underlying
`bd-search/v1/equipments` calls; browser back-navigation from `/search` to `/`; presence/
absence of the search bar and Location control on `/search` and `/search/<id>`; a mocked
500 on `/location/states`; a mocked timeout on `/bd-search/v1/equipments`.

**A note on tooling collision:** partway through this session's exploration, another active
Claude Code session was found to be modifying this same working directory concurrently
(building out the BIDC-473 Pages/Actions/Feature files live). This document's own scratch
scripts were run from disposable, uniquely-prefixed files and cleaned up individually
(never via a wildcard) after the first cleanup accidentally caught a few of that other
session's own scratch `.mjs` files. Nothing under `tests/`, `config/`, or
`data/` was touched by this investigation — only this document was written.

---

## 2. Verified application flow

```text
/  (homepage)
  Search bar: input[aria-label="Search equipment"], placeholder "Search for equipment,
  make, model.." + a separate Location dropdown button (aria-haspopup="listbox") +
  a dedicated button[aria-label="Search"] icon button — this exact bar exists ONLY on `/`

/search?searchText=<term>              (keyword entry)
/search?stateId=<states-collection-id> (location-only entry)
/search?searchText=<term>&stateId=<id> (combined entry)
/search                                (empty+empty → unfiltered results, same as BIDC-473 §2)

/search  and  /search/<id>
  Confirmed: ZERO elements matching input[aria-label="Search equipment"] or the Location
  dropdown button exist on either route. The homepage search bar does not appear anywhere
  else in the app — see §4.
```

### Real network calls observed

- `bd-search/v1/equipments?searchText=...&stateId=...&page=...&limit=...&sortBy=...` — the
  actual search query, fired only after clicking the Search button (see §4)
- `bd-equipment/v1/location/states?page=<n>&limit=10` — backs the Location dropdown,
  **paginated 10-at-a-time and re-fetched on scroll** (confirmed `page=2`, `page=3`, ... fire
  as the dropdown's internal panel is scrolled toward its bottom)

---

## 3. Verified element inventory

### Search input

| Element | Selector basis | Notes |
|---|---|---|
| Search input | `input[aria-label="Search equipment"]`, placeholder `"Search for equipment, make, model.."` | plain text, no `maxlength` attribute — confirmed a 90-character string is accepted and submitted in full |
| Search button | `button[aria-label="Search"]` (icon-only) | **the only way to trigger a search** — confirmed pressing `Enter` in the input leaves the browser on `/` with no navigation and no API call, identical to BIDC-473's finding for the same input |

### Location dropdown

| Element | Selector basis | Notes |
|---|---|---|
| Trigger | `button[aria-haspopup="listbox"]` containing text `"Location"` | **Confirmed flaky under a plain `.click()`** in headless automation — a bare click intermittently leaves `aria-expanded="false"` with no dropdown rendered and no network call fired; a `.hover()` immediately before the click opens it reliably. This is a real interaction quirk worth encoding into the Action layer (hover-then-click), not a script bug — reproduced across multiple independent script runs |
| Option list | fetched from `/location/states?page=1&limit=10`, `total: 78` | **Confirmed states/provinces, not cities** — a flat, alphabetically-sorted mix of US states, US territories (American Samoa, Baker Island, Northern Mariana Islands, ...), and Canadian provinces. Only the first 10 (`Alabama` … `Colorado`) render on open; scrolling the dropdown's internal panel triggers `page=2`, `page=3`, etc. — confirmed "New York" is real and present, reachable at roughly the 45th entry (page 5 of the lazy-load), **not** available via any text-search-as-you-type input (none exists in this component, unlike the `/search` sidebar's State filter documented in BIDC-473 §3, which does have its own search box) |
| Selecting an option | `li` containing the state name → its inner `button` | Confirmed: clicking a state sets the dropdown trigger's own text to that state's name (replacing "Location") and, on the next Search click, adds `stateId=<id>` to the resulting URL |
| **Location control on `/search`** | — | **Confirmed absent.** `button[aria-haspopup="listbox"]` with text "Location" returns zero matches on `/search` — this is a homepage-only component. Changing location *after* an initial search must go through the results page's own sidebar Location filter (a different, already-documented component per BIDC-473 §3), not this dropdown |

### "Suggestions" panel (appears under the search input on focus)

| Observed content | Confirmed behavior |
|---|---|
| Three sections: "Recently Added / Popular Equipment / Top Sellers", a brand-shortcut list (Carerpiller *[sic, real typo in the app's own copy]*, generators, Bobcat, Komatsu), and 2–3 category shortcuts (e.g. "Mini Excavators / River Dredging Excavators / Specialty Excavators") | **Confirmed entirely static, not input-driven.** Rendered identically for: empty input, a 2-character input (`"Ex"`), a real partial keyword (`"Exc"`), and adversarial gibberish (`"zzzqqqxnonexistent999"`) — verified via a controlled A/B/C script comparing the panel's `innerText` across all four states, byte-for-byte identical each time. This is a fixed "browse" panel shown on focus, unrelated to what the user has typed |

### Search-request behavior by input (response bodies inspected directly)

| Keyword | HTTP status | Real cause |
|---|---|---|
| `"320D"` | 200, 199 real matches | genuine substring/token match against real inventory |
| `"Excav"` (partial, 5 chars) | 200, matches found ("Showing 1 of 10") | confirms partial-keyword matching is real |
| `"D6T-XL"` | 422 `UnprocessableEntity`, `"No results found. Try adjusting your keyword or location..."` | **not** a rejection of the hyphen — this specific string simply has no matching listing in the current QA data snapshot (confirmed by inspecting the actual response body, not inferred) |
| `"CAT320D"` | 422, same message | same as above — no literal match exists, not a validation failure |
| 90-char repeated string | 422, same message | same mechanism — the request is sent in full (no client-side truncation), the backend just has nothing matching it |
| `"NonExistentEquipmentZZZ123"` | 422, same message | same generic "no results" response |
| `"@@@"` (symbols only) | **no request sent at all** — URL stays on `/` | confirmed client-side: the Search button click produces zero navigation and zero network call when the field holds only symbols |

**This 422 status is the API's own "zero results" signal**, not a distinct error condition —
confirmed it renders through the identical generic empty-state UI documented in BIDC-473 §4
(`"No equipment matches your selected filters. Try adjusting your search."`), with no
separate error text anywhere.

---

## 4. Confirmed cross-cutting behavior

- **The homepage search bar exists on exactly one route.** Directly checked
  `input[aria-label="Search equipment"]` on `/search?searchText=320D` and on the resulting
  `/search/<id>` detail page: **zero matches on both**, and a full `document.querySelectorAll("input")`
  dump on `/search` returned an empty array — there is no search input of any kind on either
  page. This is the single most consequential finding in this document — see §5.
- **State does not persist across navigation, even where a mechanism could exist.** A clean,
  isolated script confirmed: type "Excavator" → click Search → browser Back → the homepage's
  search input **is present again but its value is empty**, not restored. The component
  remounts fresh on `/` rather than reading anything back from history state, a query param,
  or storage.
- **Server-side failures produce silence, not an error message**, consistent with but
  distinct from BIDC-473's finding (which documented a shared generic *empty-results* state).
  Here, two different mocked failures were tested and produced two different flavors of
  silence: mocking `/location/states` to 500 renders the Location dropdown's panel as
  **completely empty** (no items, no "failed to load" copy); mocking `/bd-search/v1/equipments`
  to time out (`route.abort("timedout")`) leaves the user **on the homepage with no
  navigation and no visible error at all** — the click handler evidently awaits the request
  and only navigates on success.
- **No client-side validation exists for "nothing entered."** Clicking Search with both
  fields empty navigates straight to `/search` (unfiltered, matching BIDC-473's documented
  967-listing baseline) — there is no "please enter a keyword or location" gate.
- **Location selection genuinely changes the outgoing request** (`stateId=<id>` appended to
  the query), confirmed both alone and combined with a keyword.

---

## 5. Key discrepancies vs. the supplied test case sheet

| Test case(s) | Sheet assumes | Real app does | Resolution |
|---|---|---|---|
| TC5 | Invalid keyword `"@@@"` shows "Please enter a valid keyword." | **Confirmed: no request is even sent** — the button click is a silent no-op, URL stays on `/` | Rewrite: automate against "no navigation occurs," not an error message |
| TC6 | Empty keyword + empty location shows "Please enter a keyword or select a location to search." | **Confirmed: navigates to unfiltered `/search`** (same baseline as BIDC-473), no error | Rewrite: automate the real unfiltered-results outcome |
| TC7 | No-match keyword shows "No results found. Try adjusting your keyword or location." | **Confirmed real UI text is BIDC-473's generic empty state**, not this exact string (that exact string is the *raw API error message*, never rendered to the user) | Rewrite: automate against the real rendered copy from BIDC-473 §4 |
| TC8 | Location dropdown failure shows "Locations could not be loaded. Please refresh or try again later." | **Confirmed: a mocked 500 renders a silently empty dropdown panel**, no error copy anywhere | Rewrite: automate the real (silent) failure mode |
| TC9 | Server timeout shows "We're having trouble fetching results right now. Please try again." | **Confirmed: a mocked timeout leaves the user on the homepage with zero feedback** — no navigation, no message | Rewrite: automate the real (silent, stuck-on-homepage) outcome |
| TC10 | A 3-character minimum gates search *suggestions* | **Confirmed the suggestions panel is entirely static** — identical content regardless of input length or content (§3) | Rewrite → deliberately not built: there is no length-gated suggestion mechanism to test |
| TC12, TC14 | `"D6T-XL"` / `"CAT320D"` return real search results | **Confirmed these exact strings return a real "no results" 422** — not because hyphens/mixed-alphanumerics are rejected, but because no listing in the current QA data matches them literally (verified via response body inspection, §3) | **Decided:** create the equipment via the existing Create Equipment automation (BIDC-280) first, then search using that listing's own title/reference as the keyword — guarantees a real, currently-matching value every run instead of a literal string that may or may not exist in the QA data snapshot. Applies equally to TC1, TC2, TC4, TC13 (any scenario needing a keyword confirmed to return results) |
| TC15 | Location can be changed via the same dropdown after landing on results | **Confirmed the homepage's Location dropdown does not exist on `/search` at all** — changing location post-search requires the results page's own sidebar filter (a different component, documented in BIDC-473 §3) | Rewrite: split into "select initial location on the homepage" (this doc) and "change location via the sidebar filter" (already covered by BIDC-473) |
| TC16 | A dedicated reset control clears keyword + location | **Confirmed: no clear/reset icon exists inside the homepage search-input container** — only the search icon overlay is present | Rewrite → deliberately not built: the only real "reset" affordance is the results page's "Clear All" (already documented and automated in BIDC-473 §7 row 4) |
| TC17 | Typing "Exc" produces keyword-filtered suggestions | **Confirmed the panel is static** (§3) — same finding as TC10, different trigger condition | Rewrite: automate the real static-panel behavior instead (its content is genuinely stable and assertable, just not keyword-driven) |
| TC18 | Typing "New" into a location field produces location suggestions | **Confirmed there is no typable/free-text field in the Location dropdown at all** — it is scroll-only, no search-as-you-type input exists | Rewrite → deliberately not built: there's no text box to type "New" into |
| TC19 | Typing "InvalidCity" into a location field shows "Please enter a valid location." | **Confirmed no free-text location entry exists on the homepage** — same root cause as TC18 | Rewrite → deliberately not built |
| TC20 | Location dropdown lists "all available cities and provinces" | **Confirmed: states/provinces only (78 total, US + Canada), not cities**, and only reachable via scroll-triggered lazy-load, not shown all at once (§3) | Rewrite: automate against the real state/province list and the real scroll-to-load mechanism |
| TC21–25, 27–45 (22 cases) | Keyword/location "persist in the search bar on the equipment detail page" under various conditions (refresh, tab switch, resize, device/browser/OS/timezone/account/role/permission/session) | **Confirmed there is no search bar on the equipment detail page at all** (§4) — the precondition every one of these cases depends on cannot be established in the real app | Rewrite → deliberately not built for all 22 — see §6 for the full list and the one exception (TC26) that stayed real |
| TC26 | Keyword/location persist in the search bar when navigating back to the homepage | **Confirmed real and testable, but inverted**: browser Back does return the user to `/`, and the search bar **is present** there (unlike the detail page) — but its value comes back **empty**, not restored (§4) | Rewrite: automate the real (does-not-persist) outcome — this is the one case in the TC21–45 family with an actual, assertable mechanism |

---

## 6. The TC21–45 persistence family — full disposition

25 of the 45 supplied test cases (56% of the sheet) share one precondition: *"User is on the
equipment detail page with a keyword and location entered."* Live verification (§4) confirmed
**no search bar exists on the equipment detail page** — the homepage's
`input[aria-label="Search equipment"]` and Location dropdown appear on `/` and nowhere else.
This isn't a minor implementation gap to route around; it means the shared precondition itself
cannot be established in the real app, for all 25 cases at once.

Rather than mark this whole family "Consolidate" (which would imply several are true
duplicates worth merging into one clean scenario), each is marked individually below as
**Rewrite → deliberately not built**, since "not applicable" is a more honest label than
"duplicate" when the root cause is a nonexistent UI element, not repetition of a real one:

| # | Title | Why it's not applicable |
|---|---|---|
| 21 | Persist on detail page | No search bar exists on the detail page to hold a persisted value |
| 22 | Reset on detail page | Same — nothing to reset on a page with no search bar |
| 23 | Change keyword/location on detail page | Same — no fields exist there to change |
| 24 | Suggestions on detail page | Same — no search bar to trigger suggestions from |
| 25 | Persist on refresh (precondition: on detail page) | Same root cause |
| 27 | Persist on forward-nav *to* the detail page | The destination page has no search bar to persist into |
| 28 | Persist on tab switch (on detail page) | Same root cause |
| 29 | Persist on browser resize (on detail page) | Same root cause |
| 30 | Persist on mobile view (on detail page) | Same root cause |
| 31 | Persist on desktop view (on detail page) | Same root cause |
| 32–45 (14 cases) | Persist on mobile/tablet device, different browsers, OS, resolutions, network conditions, timezones, user accounts, roles, permissions, sessions, devices, browsers (dup), OS (dup) — all on the detail page | Same root cause, repeated across cosmetic dimensions that don't change the underlying fact |

**The one exception is TC26** (persist on back-navigation *to the homepage*), which is real,
testable, and built into the decision matrix in §7 — because the homepage is the one place
the search bar actually exists, browser Back genuinely does land the user there, and the
real (does-not-persist) outcome is a genuine, assertable finding rather than a non-existent
precondition.

If a future ticket wants to establish real cross-device/cross-browser/cross-session coverage
for this app, it would need to target a mechanism that actually exists (e.g., BIDC-473's
already-documented responsive breakpoints, or the URL-based `searchText`/`stateId` params
this document confirmed), not the search bar's in-memory state on a page where it never
renders.

---

## 7. Test case decision matrix (all 45)

Legend — **Decision**: `Automate-P0` (smoke-worthy, build first), `Automate-P1`
(regression), `Automate-P2` (low priority / mocked-failure scenarios), `Rewrite` (real app
differs from the sheet's assumption — corrected precondition/expected-text given, still
built), `Rewrite → deliberately not built` (live verification showed there is no assertable
outcome left, see §6 for the TC21–45 family), `Consolidate` (merge into another row).

### A. Core search (TC1–4, 11–14)

| # | Title | Decision | Notes |
|---|---|---|---|
| 1 | Valid keyword + valid location | Automate-P0 | Confirmed real; Location selection needs the hover-then-click pattern (§3) |
| 2 | Valid keyword, no location | Automate-P0 | Confirmed real, `/search?searchText=Excavator` |
| 3 | No keyword, valid location | **Rewrite, Automate-P0** | Confirmed real (`/search?stateId=...`), but only via the homepage's own Location dropdown — not the sheet's implied generic "search" |
| 4 | Partial keyword ("Excav") + location | Automate-P0 | Confirmed real partial-match ("Showing 1 of 10") — contradicts nothing, promote directly |
| 11 | Maximum input length (no restriction) | Automate-P1 | Confirmed: a 90-char string is accepted and submitted whole, no client-side cap |
| 12 | Special characters ("D6T-XL") | **Rewrite, Automate-P1** | Hyphens are accepted by the request layer; this exact literal string just has no matching QA data (§5) — automate against a data-backed equivalent or assert request-shape only |
| 13 | Numeric keyword ("320D") | Automate-P0 | Confirmed real, 199 matches returned |
| 14 | Mixed alphanumeric ("CAT320D") | **Rewrite, Automate-P1** | Same root cause as TC12 — literal string has no match in current data, not a functionality gap |

### B. Location dropdown (TC1, 15, 18–20)

| # | Title | Decision | Notes |
|---|---|---|---|
| 15 | Location change updates results | **Rewrite, Automate-P0** | The homepage's Location dropdown doesn't exist on `/search` — split into "select on homepage" (this doc, folds into TC1/3) and "change via sidebar filter" (already covered in BIDC-473) |
| 18 | Location suggestions from partial input | Rewrite → deliberately not built | No free-text field exists in the Location dropdown at all (§5) |
| 19 | Invalid location text | Rewrite → deliberately not built | Same root cause as TC18 |
| 20 | Dropdown lists all cities/provinces | **Rewrite, Automate-P1** | Real content is 78 states/provinces (not cities), lazy-loaded via scroll — automate against the real content and mechanism |

### C. Error / empty / failure states (TC5–9)

| # | Title | Decision | Notes |
|---|---|---|---|
| 5 | Invalid keyword ("@@@") | **Rewrite, Automate-P0** | Confirmed: silent no-op, no navigation — automate against that, not an error string |
| 6 | No keyword, no location | **Rewrite, Automate-P0** | Confirmed: navigates to unfiltered `/search`, not an error |
| 7 | Keyword with no matches | **Rewrite, Automate-P0** | Confirmed: real generic empty-state text from BIDC-473 §4, not the sheet's string |
| 8 | Location JSON load failure | **Rewrite, Automate-P2** | Confirmed via mocked 500: dropdown renders silently empty, no error copy |
| 9 | Server timeout | **Rewrite, Automate-P2** | Confirmed via mocked timeout: user stays on `/`, zero feedback |

### D. Suggestions & reset (TC10, 16, 17)

| # | Title | Decision | Notes |
|---|---|---|---|
| 10 | 3-character minimum for suggestions | Rewrite → deliberately not built | Panel is static, not length-gated (§3/§5) |
| 16 | Reset clears keyword/location | Rewrite → deliberately not built | No reset control exists on the homepage bar; the real mechanism is BIDC-473's already-covered "Clear All" |
| 17 | Keyword suggestions from partial input | **Rewrite, Automate-P1** | Panel is static and genuinely assertable as such — automate "the same fixed panel renders regardless of input," not keyword-filtered suggestions |

### E. Cross-page persistence (TC21–45)

| # | Title | Decision | Notes |
|---|---|---|---|
| 21–25, 27–45 (22 cases) | Persistence in the search bar on the equipment detail page, under 20 different conditions | Rewrite → deliberately not built | No search bar exists on the detail page at all — see §6 for the full per-row breakdown |
| 26 | Persist on back-navigation to homepage | **Rewrite, Automate-P1** | The one real, testable case in this family — confirmed the value does **not** persist (§4/§5) |

### Summary

| Disposition | Count | TC#s |
|---|---|---|
| Automate-P0 | 5 | 1, 2, 4, 13, plus TC3/15 combined into one row |
| Automate-P1 | 5 | 11, 12, 14, 17, 20, 26 (6 rows, one summary slot) |
| Automate-P2 | 2 | 8, 9 |
| Rewrite (built) | 11 | 3, 5, 6, 7, 12, 14, 15, 17, 20, 26, plus TC8/9 above |
| Rewrite → deliberately not built | 25 | 10, 16, 18, 19, 21–25, 27–45 |
| **Total** | **45** | |

**~18 scenarios worth building**, covering every genuinely distinct, verified real behavior
of this module. **25 test cases** (mostly the TC21–45 persistence tail, plus TC10/16/18/19)
are documented as verified non-applicable, each with the specific evidence for why, rather
than silently dropped or assumed duplicate.

---

## 8. Open items

1. **The exact minimum meaningful search-term length wasn't pinned down.** BIDC-473's
   investigation found single-letter searches ("e", "a") return zero results; this
   document confirmed a 5-character partial ("Excav") returns real matches. The boundary
   between those two (2, 3, 4 characters) wasn't tested — not required to automate TC4 as
   written, but worth knowing if a dedicated boundary test is ever wanted.
2. **The Location dropdown's flaky-under-plain-click behavior** (§3) needs the
   hover-then-click pattern encoded directly into whatever Action method opens it, or
   automation against it will be intermittently flaky in CI the same way it was in this
   session's ad-hoc scripts.

**Resolved by decision (not just left open):** TC12/TC14's data-availability problem (§5)
and the Location dropdown's scroll-to-a-specific-state problem (§3/§9) are both closed by
the same two strategy decisions —
- **Keyword-bearing scenarios** (TC1, TC2, TC4, TC12, TC13, TC14) create the equipment
  first via the existing Create Equipment automation (BIDC-280) and search using that
  listing's own title/reference, rather than a hardcoded literal that may not exist in the
  current QA data.
- **Location-bearing scenarios** (TC1, TC3, TC15) select whichever state the feature file's
  example table supplies — a dynamic value, not a specific hardcoded name like "New York" —
  removing the need to scroll all the way to a particular alphabetical position (§3, §9)
  just to make one fixed example work.

---

## 9. Forward-looking file plan (not built — reference only)

If/when this module moves to implementation, following `CLAUDE.md`'s naming conventions.
Note this reuses `HomePage.ts`/`HomeActions.ts` from BIDC-473's file plan rather than
duplicating them — the search bar is the same component that ticket already scoped a Page
Object for.

```text
tests/ui/pages/
  HomePage.ts                — search input, Search button, Location dropdown trigger +
                                option-by-label (shared with BIDC-473's file plan)

tests/ui/actions/
  HomeActions.ts              — searchFor(term), selectLocation(stateName) [must hover
                                 before click — see §8 item 2 — and scroll-to-find,
                                 since the dropdown lazy-loads 10 states at a time (§3)],
                                 searchByLocationOnly(stateName)

tests/ui/step-definitions/
  equipment-search.steps.ts   — Given/When/Then glue calling HomeActions only

tests/ui/features/web/
  equipment-search.feature    — tagged @smoke / @BIDC-469 / @equipment-search
```

**Location selection** needs a scroll-until-found helper distinct from a simple
`selectOption()`, since the dropdown lazy-loads 10 states at a time and most state names
aren't in the DOM until scrolled into range (§3's confirmed mechanism: `page=2`, `page=3`,
... fire on scroll). **Decided:** the feature file's example table drives which state gets
selected — e.g. whichever value the scenario's Examples row provides — rather than
hardcoding a specific state name. `selectLocation()` still needs the scroll-until-found
logic underneath (an arbitrary example value could still land past page 1), but no scenario
is locked to one particular alphabetical position.

**Keyword selection for match-bearing scenarios** (TC1, TC2, TC4, TC12, TC13, TC14) is
seeded by first creating the equipment through `AssetInformationActions`/
`CreateEquipmentActions` (BIDC-280's already-built module — see
[create-equipment-automation-requirements.md](./create-equipment-automation-requirements.md)
§9/§11), then feeding that listing's own title/reference into `HomeActions.searchFor()`.
This replaces every literal keyword the sheet specified (`"Excavator"`, `"D6T-XL"`,
`"CAT320D"`, etc.) with a value guaranteed to have a real, currently-matching listing behind
it, closing the data-availability gap documented in §5 for TC12/TC14 without needing to
query the live catalog separately.

**Mocked-failure scenarios (TC8, TC9)** would use `page.route()` to fulfill/abort the
`location/states` and `bd-search/v1/equipments` calls respectively, the same sanctioned
technique already used and documented in BIDC-473 §1/§4 for that module's own mocked-failure
cases — no new framework capability needed.
