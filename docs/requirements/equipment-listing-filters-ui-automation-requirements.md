# Equipment Listing: Filters Panel — UI, Structure & Accessibility Automation Requirements

**Module:** Equipment Listing / Search Results Page → Filters panel (structural, visual, and
keyboard/screen-reader behavior — not functional filtering logic)
**Reference ticket:** none supplied for this sheet
**App under test:** `https://qa-website-bidadoocl.appskeeper.in` (public/anonymous flow — no
login required for any of the 67 supplied test cases)
**Prepared:** 2026-08-26, verified live against the QA environment (see §1).

This document decides, for each of the 67 test cases supplied, whether it should be
automated, rewritten, consolidated, marked out of scope, or is genuinely not applicable
against the real app — following this repo's 5-layer architecture (`CLAUDE.md`) and the
"No assumptions" / "Frontend-first" rules.

This module shares its app, route, and Page/Action layer with
[BIDC-473 (Equipment Listing Page)](./equipment-listing-automation-requirements.md), whose
document already live-verified and automated the filter panel's **functional** behavior
(select/apply/clear, active-filter tags, price/year/hours sliders, responsive breakpoints,
mobile tap) via `FilterPanelPage.ts` / `FilterPanelActions.ts` /
`tests/ui/features/web/equipment-listing.feature`. This document does not repeat that
coverage. It focuses specifically on what the supplied sheet actually tests: panel
**structure** (header, dividers, sticky button, scrollbars, checkbox alignment), section
**expand/collapse mechanics**, and **keyboard/screen-reader accessibility** — rewriting or
retiring any row whose assumed behavior didn't match what was found live.

**This is a requirements/decision document only.** No new Pages, Actions, Steps, or Feature
scenarios were created — see the forward-looking file plan in §9.

---

## 1. How this was verified

Playwright MCP was not connected to this session. Per the "Frontend-first" rule in
`CLAUDE.md`, roughly 14 small ad-hoc Playwright scripts (chromium, headless, this repo's own
`node_modules/playwright`) were run directly against the real QA app at both desktop
(1280×900) and mobile (390×844) viewports, inspecting live DOM, computed CSS, `aria-*`
attributes, and real keyboard event sequences (`Tab`, `Space`, `Escape`, `ArrowRight`,
`Home`/`End`). Every claim in this document specific to structure/spacing/keyboard/
accessibility was independently verified live in this session — scripts were disposable,
uniquely-prefixed files in the repo root, deleted immediately after each run, nothing under
`tests/`, `config/`, or `data/` was touched.

The existing `FilterPanelPage.ts`, `FilterPanelActions.ts`, and
`tests/ui/features/web/equipment-listing.feature` were also read in full to identify what
BIDC-473 already automates (avoiding duplicate decisions) and what mechanisms already exist
that this document's new scenarios can reuse directly (e.g. the chevron `rotate-180` class
check already backing `assertSectionExpanded`/`assertSectionCollapsed`, and the keyboard-driven
slider control already backing TC22/TC37).

**Verified live, end-to-end:** desktop sidebar header (no close icon) vs. mobile/tablet
overlay header (has one, `aria-label="Close filters"`, confirmed functional); real 6-section
order and their divider wrapper structure; the Apply Filters button's sticky positioning;
Category section's internal scroll container (`overflow-y:auto`, `scrollHeight` >
`clientHeight`); checkbox row vertical spacing (pixel-measured); chevron icon rotation
mechanism (`class="rotate-180 transition-transform"` on an `<img>`, no `aria-expanded`);
listing-count text format; zero-count category selectability; Clear All's apply-immediately
behavior; the Hours/Miles/Kilometers unit label's fixed compound text; full keyboard Tab walk
through an expanded section; `Space` toggling a focused checkbox; `Escape` on the mobile
overlay (confirmed no-op).

---

## 2. Verified filter panel structure

```text
/search  (desktop ≥1024px-ish, confirmed via BIDC-473 and reconfirmed here)
  <aside>
    <p>Filters</p>                          — heading, NO close (X) icon anywhere in this
                                               subtree (confirmed: 0 matches for any
                                               aria-label containing "close")
    <button>Clear All</button>              — inside <aside>, distinct from the tag bar's
                                               own Clear All in <main> (per BIDC-473)
    6 × <div class="border-t border-black-10">   — one per section, confirmed exactly 6
      <button>{Category|Model|Location|Price Range|Year|Hours / Miles / Kilometers}
        <img class="[rotate-180 ]transition-transform" alt="toggle">  — chevron, no
                                                                         aria-expanded
      <div class="... overflow-y-auto native-thin-scroll">           — real internal
                                                                         scroll container
                                                                         once expanded
        <label> × N   — checkbox rows, each: hidden native
                         <input type="checkbox" class="custom-checkbox sr-only" tabIndex=0>
                         + visible custom box span + text + trailing bare count number
                         (Category rows additionally nest a child-expand <button>)
    <button>Apply Filters</button>          — parent has position:sticky; button itself is
                                               position:static, pinned to the bottom of the
                                               visible sidebar as the page/sidebar scrolls

/search  (mobile/tablet ≤768px, confirmed via BIDC-473 and reconfirmed here)
  "Filters" trigger button → full-screen overlay containing:
    <p>Filters</p> heading + <button aria-label="Close filters">×</button> + the SAME
    Clear All + 6 sections + Apply Filters as the desktop sidebar — confirmed clicking the
    close button removes the overlay (0 matches for the close button afterward);
    confirmed pressing Escape while the overlay is open does NOT close it (still 1 match
    for the close button afterward)
```

Real section order (confirmed, DOM order): **Category, Model, Location, Price Range, Year,
Hours / Miles / Kilometers** — 6 sections, matching BIDC-473 §5's finding that **no "Brand"
filter category exists anywhere in this app**.

---

## 3. Confirmed structural/visual behavior (new findings this pass)

| Area | Confirmed real behavior |
|---|---|
| Header (desktop) | `<p>Filters</p>` + `<aside>`-scoped "Clear All" button — **no close (X) icon exists in the desktop sidebar**, consistent with BIDC-473's "sidebar is always visible, never closed" finding |
| Header (mobile/tablet overlay) | Same heading + Clear All, **plus** a real close control: `button[aria-label="Close filters"]`, confirmed functional (click → overlay gone) |
| Dividers | Exactly 6 `div.border-t.border-black-10` containers, one per section — confirmed via direct count |
| Apply Filters stickiness | Button's own CSS `position` is `static`; its **parent** is `position: sticky` — confirmed empirically: a 2000px page-level scroll only moved the button's `y` from 723→423 (bounded, not a full 2000px translation), consistent with sticky pinning near the bottom of the visible sidebar rather than scrolling away with the page |
| Scrollbar for long lists | Category section's rendered rows (10) sit inside a real `overflow-y: auto` container with `scrollHeight` (360px) > `clientHeight` (304px) — genuine internal scrollbar, distinct from BIDC-473's separate finding that scrolling does **not** fetch additional (unrendered) items from the API |
| Checkbox row spacing | Measured 4 consecutive Category row bounding boxes: y = 379, 411, 443, 475 — a **consistent 32px** row-to-row interval |
| Chevron expand/collapse | Confirmed real mechanism: an `<img alt="toggle">` gains class `rotate-180` on expand (this is exactly the mechanism `FilterPanelActions.isSectionExpanded()` already reads) — **no `aria-expanded` attribute is set on the toggle `<button>`**, confirmed `null` before and after toggling |
| Listing counts | Render as a bare trailing number with no separator/parens, e.g. `"Agriculture" "63"`, `"020/320" "4"` — **not** the sheet's assumed `"(12)"` format |
| Zero-count categories | Confirmed **not disabled** — `Air Compressors & Tools` (count `0`) has an enabled checkbox that successfully checks on click |
| Clear All timing | Confirmed **Clear All applies immediately** — `FilterPanelActions.clearAllViaSidebar()` already waits for the results-header text to change as a direct effect of the click itself, with no separate Apply Filters step required, confirmed via the same live mechanism BIDC-473 documented for this control |
| Hours/Miles/Kilometers unit label | Confirmed a **fixed compound string** `"Hours / Miles: 356 - 19,658"` — not a per-listing-type label that swaps to just "Hours" or just "Miles" |
| Keyboard Tab order (within one expanded section) | Confirmed clean and logical: section toggle → each checkbox in rendered order → next section's toggle button → ... → Apply Filters. (An earlier same-session run appeared to skip the checkboxes entirely; re-verified twice with an explicit post-expand wait and confirmed that was a click/expand race in the script, not real app behavior — the real order is exactly as stated) |
| Checkbox keyboard toggle | Confirmed: focusing a checkbox input directly and pressing `Space` toggles its checked state |
| Slider keyboard control | Confirmed working (`Home`/`End`/`ArrowLeft`/`ArrowRight` on the price min/max thumbs) — but this exact mechanism is **already automated** in BIDC-473's `assertPriceMinCannotReachMax` / `assertPriceMaxCanReachOwnMaximum` / `assertPriceMinCanReachOwnMinimum` |
| Escape key | Confirmed **no-op** on the mobile filter overlay — pressing `Escape` does not close it (close button still present afterward) |

---

## 4. Key discrepancies vs. the supplied test case sheet

| Test case(s) | Sheet assumes | Real app does | Resolution |
|---|---|---|---|
| Row 1 | Header always has title + Clear All + close (X) icon | **Confirmed the close icon only exists on the mobile/tablet overlay** — the desktop sidebar has no close control at all (§3) | Split into two scenarios: desktop (no X) and mobile/tablet overlay (has X) |
| Row 2 | Sections are Category, **Brands**, Model, Location, Price Range, Year, Hours/Miles (7, incl. Brands) | **Confirmed real order is 6 sections with no Brands**: Category, Model, Location, Price Range, Year, Hours/Miles/Kilometers — same finding as BIDC-473 §5 | Rewrite: automate against the real 6-section order |
| Row 7 | Close (X) icon exists generically on "the Filters panel" | **Confirmed real close (X) only exists on the mobile/tablet overlay**, and is confirmed functional there (click closes it); no such control exists on desktop | Rewrite: scope this scenario to the mobile/tablet overlay only |
| Row 10 | Clear All does **not** update results until Apply Filters is clicked | **Confirmed Clear All applies immediately** — the results header text changes as a direct effect of the Clear All click itself, no separate Apply step | Rewrite: automate the real immediate-apply behavior |
| Row 18, 23 | Category/Model counts render as `"(12)"` | **Confirmed real format is a bare trailing number**, e.g. `"Agriculture" "63"` | Rewrite: automate against the real bare-number format |
| Row 19 | Zero-count category behavior is ambiguous ("disabled or selectable") | **Confirmed selectable, not disabled** — a 0-count category checkbox checks normally on click | Rewrite: automate the confirmed-selectable behavior |
| Row 50 | Unit label swaps between "Hours" and "Miles" depending on listing type | **Confirmed a single fixed compound label**, `"Hours / Miles"` (section header additionally includes "/ Kilometers"), regardless of listing type | Rewrite: automate against the real fixed compound label, not a per-listing swap |
| Row 66 | Sections/checkboxes/sliders "have proper accessible names/labels" | **Confirmed a real gap**: section toggle buttons expose no `aria-expanded` at all (checkboxes do get an implicit accessible name via native label-wrapping, including the trailing count digit with no separator) | Clarify with PM/QA before writing an assertion that would otherwise pass on a false premise — see §6 |
| Row 67 | Escape key closes the Filters panel | **Confirmed Escape is a no-op** on the mobile overlay — no keyboard-driven close mechanism exists at all | Rewrite: automate the real (does-not-close) outcome |
| Row 28, 29 | Model list depends on / prompts for a selected Brand | **No "Brand" filter exists anywhere in the app** (§2) — there is nothing for Model to "depend on" | Rewrite → deliberately not built |

---

## 5. Relationship to BIDC-473 — rows marked Out of scope

The following rows exercise mechanisms **already live-verified and automated** in
[equipment-listing-automation-requirements.md](./equipment-listing-automation-requirements.md)
via `FilterPanelPage.ts` / `FilterPanelActions.ts` / `equipment-listing.feature`, and are not
re-decided here:

| Rows | Mechanism | Already covered by |
|---|---|---|
| 8 | Clear All resets all filters | `equipment-listing.feature` @TC4, `clearAllViaSidebar()` |
| 15–17, 21–22, 25–27, 30–32, 34 | Select single/multiple Category, Model, Location filters; count display reused from §3/§4 above where the row is purely about format | `selectCategoryLeaf`/`selectCategoryLeaves`/`selectModel`/`selectLocation`, @TC5/@TC6/@TC7/@TC11 |
| 35–49, 51 | Price/Year/Hours-Miles-Km slider default/adjust/min-max-clamp/apply behavior | `assertPriceMinCannotReachMax`, `assertPriceMaxCanReachOwnMaximum`, `assertPriceMinCanReachOwnMinimum`, @TC12/@TC22/@TC37 |
| 52–57, 59 | Apply Filters with 0/1/many filters, AND-combination, always-enabled, results-count update, reopen-shows-applied | `applyFilters()`, @TC4–@TC8 |
| 58 | No-results empty state | @TC14 (`equipment-listing.feature`) |
| 59 | Backend/API failure on apply | @TC15, @TC20, @TC30, @TC33 |
| 61 | Panel layout on viewport resize | @TC16, @TC40 (exact 1280/768/390px breakpoints already verified) |
| 64 (slider portion), 65 | Slider keyboard control (Home/End/Arrow keys) | `assertPriceMaxCanReachOwnMaximum` / `assertPriceMinCanReachOwnMinimum` — already keyboard-driven |
| — | Mobile real-touch-tap opens overlay | @TC26 (`assertMobileFilterOverlayOpensViaTap`) |

---

## 6. Test case decision matrix (all 67)

Legend — same as BIDC-473/BIDC-469: `Automate-P0` (build first), `Automate-P1` (regression),
`Automate-P2` (low priority), `Rewrite` (real app differs from the sheet, corrected version
given, still built), `Rewrite → deliberately not built` (no assertable outcome exists),
`Out of scope` (already covered by BIDC-473, see §5), `Clarify` (needs a PM/QA decision
before writing an assertion).

### A. Header & panel chrome (Rows 1, 7)

| # | Title | Decision | Notes |
|---|---|---|---|
| 1 | Header loads with correct elements | **Rewrite, Automate-P0** | Split: desktop (title + Clear All, no X) vs. mobile/tablet overlay (title + Clear All + X) — §4 |
| 7 | Close panel via X icon | **Rewrite, Automate-P0** | Real close control exists only on the mobile/tablet overlay; confirmed functional there — §4 |

### B. Section structure & layout (Rows 2–6)

| # | Title | Decision | Notes |
|---|---|---|---|
| 2 | All filter sections visible in order | **Rewrite, Automate-P0** | Real order is 6 sections, no Brands — §4 |
| 3 | Section dividers display correctly | Automate-P1 | Confirmed 6 divider-wrapped containers |
| 4 | Apply Filters button fixed at bottom | Automate-P1 | Confirmed sticky-parent mechanism, bounded movement on scroll |
| 5 | Scrollbar appears for long lists | Automate-P1 | Confirmed real internal `overflow-y:auto` container on Category |
| 6 | Checkbox alignment and spacing | Automate-P1 | Confirmed consistent 32px row spacing |

### C. Clear All (Rows 8–10)

| # | Title | Decision | Notes |
|---|---|---|---|
| 8 | Clear All resets all filters | Out of scope | See §5 — already covered by BIDC-473 @TC4 |
| 9 | Clear All with no filters applied | Automate-P2 | No error expected; reuses existing `clearAllViaSidebar()` against the default (unfiltered) state |
| 10 | Clear All does not auto-apply | **Rewrite, Automate-P0** | Confirmed real behavior is the opposite — Clear All applies immediately — §4 |

### D. Section expand/collapse (Rows 11–14)

| # | Title | Decision | Notes |
|---|---|---|---|
| 11 | Expand collapsed section | Automate-P0 | Confirmed chevron `rotate-180` mechanism, already backs `assertSectionExpanded` |
| 12 | Collapse expanded section | Automate-P0 | Same mechanism, reverse direction |
| 13 | Multiple sections open simultaneously | Automate-P1 | Each section's expand state is an independent CSS class on its own container — confirmed no shared/exclusive-accordion state in the DOM structure inspected |
| 14 | Section state persists while panel is open | Automate-P1 | Selections live in the (still-mounted) checkbox inputs themselves, unaffected by collapsing a sibling section's display |

### E. Category filter (Rows 15–20)

| # | Title | Decision | Notes |
|---|---|---|---|
| 15 | Select single category | Out of scope | Covered by BIDC-473 @TC5 |
| 16 | Select multiple categories | Out of scope | Covered by BIDC-473 @TC11 |
| 17 | Deselect category | Out of scope | Covered by BIDC-473 @TC7 (tag removal exercises the same toggle) |
| 18 | Category count displays | **Rewrite, Automate-P1** | Bare-number format, not `"(12)"` — §4 |
| 19 | Category with zero results | **Rewrite, Automate-P1** | Confirmed selectable, not disabled — §4 |
| 20 | Scroll within category list | Automate-P1 | Same internal-scroll mechanism as Row 5 |

### F. Model filter (Rows 21–30, minus Brand-named rows already retired in BIDC-473)

| # | Title | Decision | Notes |
|---|---|---|---|
| 21 | Select single model | Out of scope | Covered by BIDC-473 (`selectModel`) |
| 22 | Select multiple models | Out of scope | Same mechanism, multiple calls |
| 23 | Model count displays | **Rewrite, Automate-P1** | Same bare-number format as Row 18 |
| 24 | Model list scrolls independently | Automate-P1 | Same internal-scroll pattern confirmed for Category; Model section's own container was not independently re-measured this pass (structurally identical markup) — verify during implementation |
| 25 | Category + Model combination | Out of scope | Covered by BIDC-473's combined-filter Apply flow |
| 26 | Select model option | Out of scope | Duplicate of Row 21 |
| 27 | Select multiple models | Out of scope | Duplicate of Row 22 |
| 28 | Model depends on Brand | Rewrite → deliberately not built | No Brand filter exists — §4 |
| 29 | No brand selected — Model behavior | Rewrite → deliberately not built | Same reason as Row 28 |
| 30 | Deselect model | Out of scope | Covered by BIDC-473's tag-removal mechanism |

### G. Location filter (Rows 31–34)

| # | Title | Decision | Notes |
|---|---|---|---|
| 31 | Select single location | Out of scope | Covered by BIDC-473 (`selectLocation`) |
| 32 | Select multiple locations | Out of scope | Same mechanism, multiple calls |
| 33 | Location default state is unchecked | Automate-P2 | Not independently contradicted; straightforward default-state assertion |
| 34 | Location with other filters | Out of scope | Covered by BIDC-473's combined-filter Apply flow |

### H. Price / Year / Hours-Miles-Km sliders (Rows 35–51)

| # | Title | Decision | Notes |
|---|---|---|---|
| 35–49 | Default display, adjust min/max, clamp, real-time label update, apply, reset via Clear All | Out of scope | Keyboard-driven min/max/clamp already automated in BIDC-473 (@TC12/@TC22/@TC37); default display and Clear-All reset are direct side effects of the same already-tested Apply/Clear mechanisms |
| 50 | Unit label correctness | **Rewrite, Automate-P1** | Fixed compound label, not per-listing-type — §4 |
| 51 | Combined Year + Hours/Miles filter | Out of scope | Covered by BIDC-473's combined-filter Apply flow |

### I. Apply behavior (Rows 52–60)

| # | Title | Decision | Notes |
|---|---|---|---|
| 52–57, 59 | Apply with no/single/multiple filters, always-enabled, results-count update, reopen-shows-applied, API failure | Out of scope | See §5 |
| 58 | No results for filter combination | Out of scope | Covered by BIDC-473 @TC14 (shared generic empty state) |
| 60 | Rapid checkbox toggling | Automate-P2 | UI-stability check, reuses existing checkbox toggle + Apply actions; no live contradiction found |

### J. Layout, accessibility (Rows 61–67)

| # | Title | Decision | Notes |
|---|---|---|---|
| 61 | Panel layout on resize | Out of scope | Covered by BIDC-473 @TC16/@TC40 |
| 62 | Very long category/brand name | **Open item** | Selector-level check was inconclusive this pass (§8) — verify live during implementation rather than assert from an unresolved check |
| 63 | Keyboard navigation (tab order) | Automate-P1 | Confirmed logical order: toggle → checkboxes → next toggle → ... → Apply |
| 64 | Checkbox keyboard toggle | Automate-P1 | Confirmed `Space` toggles a focused checkbox — built as FLT-024 |
| 65 | Slider keyboard control | Out of scope | Already automated in BIDC-473 (Home/End/Arrow keys) |
| 66 | Screen reader labels | **Clarify** | Confirmed real gap: no `aria-expanded` on section toggles — flag to PM/QA rather than writing a test asserting a pass that isn't true (§4) |
| 67 | Close via Escape key | **Rewrite, Automate-P2** | Confirmed real behavior is no-op, not close — §4 |

### Summary

| Disposition | Count | Row #s |
|---|---|---|
| Automate-P0 | 5 | 1, 2, 7, 10, 11, 12 (6 rows, one summary slot) |
| Automate-P1 | 12 | 3, 4, 5, 6, 13, 14, 18, 19, 20, 23, 24, 50, 63, 64 (14 rows, one summary slot) |
| Automate-P2 | 5 | 9, 33, 60, 67 |
| Out of scope (BIDC-473) | 39 | 8, 15–17, 21–22, 25–27, 30–32, 34–49, 51–59, 61, 65 |
| Rewrite → deliberately not built | 2 | 28, 29 |
| Clarify | 1 | 66 |
| Open item | 1 | 62 |
| **Total** | **67** | |

**24 scenarios worth building** (FLT-001…FLT-023 in the original approved coverage preview,
plus FLT-024 added afterward for row 64 — the "Checkbox keyboard toggle" row was decided
`Automate-P1` in this matrix but was missed from the original 23-scenario preview; caught
during a later E2E review and closed as FLT-024, not a re-litigation of the original scope),
covering every genuinely distinct, verified structural/visual/accessibility behavior not
already automated by BIDC-473. **39 rows** (corrected from an earlier miscount of 33) are
documented as already covered elsewhere (not silently dropped — each mapped to its existing
BIDC-473 scenario/method in §5). **2 rows** are verified non-applicable (no Brand filter
exists). **1 row** is a real accessibility gap flagged for a product decision rather than
turned into a false-positive test, and **1 row** is honestly left open pending a cleaner live
check.

---

## 7. Open items

1. **Row 62 (long name truncation/wrap CSS)** — the live check for this used a specific long
   model name (`"1320H REAR TINE TILLER 13HP"`, confirmed present in the Model list's own
   row text earlier in this session) but the follow-up selector built to inspect its
   `overflow`/`text-overflow`/`white-space` styling returned zero matches, likely a
   locator/whitespace mismatch rather than the row being genuinely absent. Needs one more
   direct check before writing an assertion — don't assume truncation behavior either way.
2. **Row 24 (Model list independent scroll)** — inferred from Category's confirmed
   `overflow-y:auto` container and identical row markup, but not independently re-measured
   for the Model section specifically in this pass. Low risk given the shared markup, but
   worth a direct confirmation during implementation.
3. **Row 66 (`aria-expanded` gap)** — this is a genuine finding, not a tooling artifact
   (confirmed `null` both before and after toggling, across two independent checks). Whether
   this is treated as a bug to fix or an accepted gap is a product decision, not an
   automation one — the "Clarify" disposition reflects that, per the same pattern BIDC-473
   §8 already uses for its own PM/QA-flagged items.

---

## 8. Forward-looking file plan (not built — reference only)

If/when this module moves to implementation, following `CLAUDE.md`'s naming conventions.
**Reuses `FilterPanelPage.ts` / `FilterPanelActions.ts` / `equipment-listing.feature` from
BIDC-473's file plan** rather than duplicating them — this is the same panel, same Page
Object, same Action class; only new getters/methods/scenarios are added.

```text
tests/ui/pages/FilterPanelPage.ts        — ADD: mobile overlay close-button getter already
                                            exists (mobileFilterOverlayCloseButton); add a
                                            desktop-scoped "no close icon" negative-assertion
                                            helper if needed, a section chevron aria-expanded
                                            reader, and a checkbox row bounding-box helper for
                                            the spacing assertion (Row 6)

tests/ui/actions/FilterPanelActions.ts   — ADD: assertClearAllAppliesImmediately() (Row 10),
                                            assertZeroCountCategorySelectable() (Row 19),
                                            assertListingCountFormat() (Rows 18/23),
                                            assertMultipleSectionsOpenSimultaneously() (Row 13),
                                            assertSectionStatePersistsOnCollapse() (Row 14),
                                            assertKeyboardTabOrderThroughSection() (Row 63),
                                            assertCheckboxKeyboardToggle() (Row 64),
                                            assertEscapeDoesNotCloseOverlay() (Row 67)
                                            — REUSE existing: ensureSectionExpanded,
                                            toggleSection, isSectionExpanded, applyFilters,
                                            clearAllViaSidebar

tests/ui/step-definitions/
  equipment-listing.steps.ts              — extend with Given/When/Then glue for the 23 new
                                             scenarios, calling FilterPanelActions only

tests/ui/features/web/
  equipment-listing.feature               — ADD the 23 approved scenarios (FLT-001…FLT-023)
                                             as new @regression / @low-priority tagged
                                             scenarios in the existing file — this is the
                                             same module/feature as BIDC-473, not a new
                                             feature file
```

No new API client, model, or endpoint is needed — every scenario in this document reads
DOM/CSS/keyboard state already reachable through the existing `FilterPanelPage`/
`FilterPanelActions` layer and `EquipmentSearchClient` (for picking real, currently-rendered
option values, reusing `pickRealCategoryLeaf`/`pickRealModel`/`pickRealLocation`).
