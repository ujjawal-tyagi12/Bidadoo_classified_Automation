# Create Equipment (Single Listing) — Automation Requirements

**Module:** Seller Dashboard → Listings → Create New Listing (single-listing wizard)
**Reference ticket:** [BIDC-280](https://appinventivtech.atlassian.net/browse/BIDC-280)
**App under test:** `https://qa-website-bidadoocl.appskeeper.in` (already wired in `.env` as `BASE_URL`)
**Test user:** `khushi1+78@appinventiv.com` (already wired in `.env` as `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
**Prepared:** 2026-08-24, verified end-to-end live against the QA environment (see §1).
**Last updated:** 2026-08-25 — Phase 1 build complete; §2a's persistence bug confirmed
resolved (see §2a) and TC14/TC15/TC42 built on that basis; §2b's navigation race mitigated
in the automation with a state-based wait (see §2b).

This document decides, for each of the 71 test cases supplied, whether it should be
automated now, automated later, rewritten, or dropped — and lays out the concrete
page/action/step/feature file plan for the module, following this repo's 5-layer
architecture (`CLAUDE.md`) and the `playwright-bdd-automation` skill.

**Update (Phase 1 build, now complete):** Pages/Actions/Steps/Feature for all 5 wizard
steps plus Submission were built and run against the live app (not just type-checked).
That process surfaced two real bugs: §2b (a navigation race, still a real app defect —
see §2b for why the suite no longer fails on it) and an originally-confirmed persistence
failure in §2a that was later found, on new evidence, to be resolved — see §2a for the
full history of that correction. See §11 for the current, final implementation status.

---

## 1. How this was verified

Playwright MCP was not actually connected to this Claude Code session (only the VS Code
extension's own `.vscode/mcp.json` references it). Per the "Frontend-first" rule in
`CLAUDE.md`, an ad-hoc Playwright script (chromium, headless) was run against the real QA
app instead — same effect, same source of truth: it logged in, drove every step of the
Create New Listing wizard end-to-end in a single continuous session, filled every field
with valid data, opened the Category tree modal, uploaded a real image, added a video
link, and triggered both the Submit confirmation dialog and Save as Draft — inspecting the
live DOM (ids/names/roles, disabled states) and live network responses at each point.
Screenshots and DOM dumps are on disk in this session's scratchpad, not committed to the
repo.

**Verified end-to-end:** login → Seller Dashboard → Listings tab → New Listing entry →
all 5 wizard steps (Asset Information, Location, Pricing & Contact Details, Description &
Details, Media Upload) → Submit confirmation modal. Every field below was actually filled
and driven, not inferred from a screenshot.

**Initially found broken, later confirmed resolved (see §2a for the full timeline):**
persisting the listing. Early testing found "Save as Draft" failing against the live API
with a 400 validation error, with no draft appearing in Listings afterward — documented
at the time as a confirmed bug. New evidence (a real successful creation, captured
independently) prompted an immediate re-test: 4/4 repeat attempts succeeded, the full
Submit → Ok flow succeeded, and the resulting listing was confirmed visible in Listings.
TC14 and TC15/TC42 were then built on that basis and pass live — see §11.

**Verified in a second pass (closing out the open items from the first draft):** inline
validation UX (confirmed: none, except Description's minimum-length check — see §4), the
"Use Previous Location" and "Use Company Contact Details" checkboxes' actual effect (§3),
Description's character limit (confirmed: a 20-character minimum, no maximum),
City/State's picklist nature (confirmed: both are constrained pickers, not free text), and
video-link domain validation (confirmed: real, see §3 Media Upload).

**Still not verified:** Reference ID uniqueness behavior (TC7/TC16). Now that persistence
works, this is a normal "go check it" gap rather than a blocked one — it just hasn't been
done yet. Create two listings with the same Reference ID and observe what happens.

---

## 2. Verified application flow

```text
/login?callbackUrl=%2Fdashboard
  → fill #email, #password → submit → redirects to /dashboard

/dashboard (Seller Dashboard)
  tabs: Dashboard | Brand Info | Listings | Security | Settings | Access Control
        | Custom Attributes | API and Integrations | My Inquiries
  → "Listings" tab → /dashboard?tab=listings
      "Listing Management" panel has two SEPARATE buttons: [Bulk Upload]  [+ New Listing]
      → click "New Listing" → /dashboard/create-equipment?status=asset-information

/dashboard/create-equipment?status=asset-information
  Breadcrumb (aria-label="Breadcrumb"): "HOME | LISTINGS | CREATE NEW LISTING"
  Back control: <img alt="Go back"> → navigates to /dashboard
  Stepper (5 steps, each a clickable button "0N <Step Name>", ticks green as completed):
    01 Asset Information | 02 Location | 03 Pricing & Contact Details
    | 04 Description & Details | 05 Media Upload
  Footer actions: [Save as draft]  [Next]  (final step: [Save as draft]  [Submit])
  Next/Submit is disabled until the current step's required fields are valid.
  Wizard state lives in client memory only — reloading the page resets to step 1.
```

### 2a. Resolved: persistence was broken on QA, now confirmed fixed

**Status: RESOLVED as of 2026-08-25 — do not treat this as a current blocker.** This
section originally documented an open bug; it's kept as history rather than deleted,
because the correction process is itself worth having on record.

**What was originally found:** early in this module's build, both "Save as Draft"
attempts (free-typed Make/Model, and a properly selected autocomplete suggestion)
produced a 400 with no error shown in the UI:

```
POST https://bidadoo-qa-services.azure-api.net/bd-equipment/v1/equipments → 400
{"statusCode":400,"error":"ValidationError","message":"isSuggestion must be a boolean value",
 "reasons":[{"field":"isSuggestion","message":"isSuggestion must be a boolean value"}]}
```

Searching Listings for the draft's title afterward returned "No Equipments found,"
confirming nothing was actually saved. This was documented as a confirmed, reproducible
bug blocking TC14/TC15/TC40-42's end-state assertions, and TC15/TC42 were deliberately
left unbuilt on that basis.

**What changed:** the user shared a browser devtools network capture from their own
manual testing showing a real, successful equipment creation on this same QA
environment — `POST .../bd-equipment/v1/equipments` returning `200
{"message":"Equipment successfully created"}`, with `"isSuggestion": false` correctly
sent as a JSON boolean. That directly contradicted the "confirmed, always fails" claim
on record, so it was re-tested immediately rather than left standing:

- The exact automated flow that previously failed was re-run **4 times in a row** —
  all 4 returned `200`, not the earlier `400`.
- The full wizard was driven end-to-end through **Submit → Ok**, which also returned
  `200 {"message":"Equipment successfully created"}`.
- The resulting listing was confirmed **actually visible in the Listings table**
  (Reference ID, title, location, price, "Active" status all populated correctly) —
  not just a 200 status code taken on faith.
- `TC14` (Save as Draft) and `TC15`/`TC42` (Submit → Ok → published) were then built
  and passed on the **first live run**, using the same `assertListingVisible()` pattern.

**Why it was likely wrong the first time:** almost certainly a transient state on the
QA backend at the time of the original test — a temporarily-misbehaving service, a
since-deployed fix, or similar — rather than anything about the request payload itself,
since the later payload capture showed the same `isSuggestion: false` shape that had
been sent (and rejected) before. The lesson isn't "the bug was fake" — it was real and
reproducible *at the time it was found and reported*, four separate ways (two field-input
variants, checked via direct API response, checked via UI absence in Listings). The
lesson is that a "confirmed" finding about a live, actively-developed environment has a
shelf life, and new contradicting evidence is a re-test trigger, not something to
dismiss because a prior pass already called it settled. If this resurfaces, re-verify the
same way — don't assume either the original bug report or this resolution is permanent.

### 2b. Resolved in the automation: a second consecutive client-side navigation race, mitigated with a state-based wait

Discovered while actually running the built Phase 1 automation against the live app (not
during manual exploration, which never happened to chain two client-side transitions in a
row). **This is the literal user journey TC1 describes** — land on the Seller Dashboard,
click the Listings tab, then click New Listing:

- **Login → click "Listings" tab → click "New Listing" immediately** (two consecutive
  client-side route transitions, back-to-back with no gap): the URL updates to
  `/dashboard/create-equipment?status=asset-information`, but the page content stays
  frozen on the Listings table. The breadcrumb still reads "Home \| Listings" (not
  "...\| Create New Listing"), `#title` never appears. **100% reproducible** with zero
  gap between the two clicks.
- **Hard-load `/dashboard?tab=listings` → click "New Listing"** (a single client-side
  transition from a fresh page load): works correctly every time.

**Root cause, isolated after the user reported testing this manually and seeing it work.**
Re-verified live, using the identical click sequence and account: with a ~1 second pause
between the "Listings" click and the "New Listing" click, the flow renders correctly 3/3
runs; with zero pause it fails 3/3 runs, reproducing the exact frozen-page symptom above.
Binary-searching the boundary live (100ms/300ms/500ms/700ms, 2 runs each) showed the race
window closes somewhere under 500ms: 100ms and 300ms were flaky, 500ms+ was reliable. **A
human clicking manually never reliably triggers this** — there's always a natural gap
between clicks (reading the page, moving the mouse) — which is exactly why manual testing
sees it working fine while an automated flow, which clicks as fast as the page allows,
hits it every time. Most likely cause: a Next.js router race where the second route change
fires before the router has settled from the first, so the page component doesn't remount.

**Mitigated in the automation, not hidden.** `SellerDashboardActions.startNewListing()`
now calls `WaitHelper.waitForElementStable(newListingButton, { interval: 600 })` — the
framework's sanctioned composite-wait helper (`core/ui/wait/wait-helper.ts`, listed in
CLAUDE.md's cheat-sheet) — before clicking. This is a real actionability check (the button
must hold a stable position across two consecutive polls 600ms apart, ~630ms of real wall
time in practice, confirmed live 7/7), not an arbitrary `page.waitForTimeout()` (which
`lint:rules` forbids anywhere in this codebase). The distinction matters: this waits for a
genuine UI-stability condition that happens to require enough real time to clear the race,
rather than papering over the underlying defect with a blind sleep. **The bug is still
real** — the underlying router race is a legitimate app-side defect worth filing, since it
does affect any user or script that clicks fast enough to hit it — but the automated suite
now reflects normal usage instead of failing on a condition a human essentially never
triggers.

**A second, previously-unseen discrepancy surfaced once this scenario could finally
render.** TC1 had never successfully completed before this fix, so its breadcrumb had
never actually been inspected in a passing run. Once fixed, the live DOM text read
literally uppercase — `"HOME|LISTINGS|CREATE NEW LISTING"` — not the mixed-case
`"Home|Listings|..."` that every other scenario's `openDirectly()` (a hard page load) had
established as the DOM's real casing (see §11's implementation gotcha #3). Both are real:
the two routes render genuinely different DOM text for the same visual breadcrumb — mixed
case via `openDirectly()`'s hard page load, literal uppercase via the Listings tab → New
Listing client-side navigation. `assertBreadcrumb()` was updated to match case-insensitive
regexes (`/home/i`, `/listings/i`, `/create new listing/i`) instead of a fixed-case string,
so it's correct for either entry route rather than assuming one.

---

## 3. Verified element inventory — all 5 steps

### Step 1 — Asset Information

| Field (UI label) | selector | Widget | Notes |
|---|---|---|---|
| Reference ID *(Optional)* | `input[name="referenceId"]` | plain text | explicitly optional |
| Listing Title * | `#title` | plain text, `maxlength="100"` | required |
| Make * | `#make` | **autocomplete combobox** | typing filters suggestions (`button[role="option"]`) plus a `+ Add "<value>"` create option; selecting a real suggestion vs. free-typing affects the `isSuggestion` field sent to the API (see §2a) |
| Model * | `#model` | **autocomplete combobox** | same pattern as Make |
| Category/Type * | button `"Select Equipment Category"` | **modal, multi-level tree picker** | opens a "Select Category" dialog. Each row has a `button[aria-label="toggle"]` chevron that expands to child categories — verified **3 levels deep** (e.g. Construction Equipment → Aerial Work Platforms → Boom Lifts - Articulating). Leaf nodes are `button` elements containing `img[alt="check"]` (radio-style, single-select) with the parent chain shown as "A -> B -> C" once picked. `Submit` inside the modal stays disabled until a leaf is picked. **The "Select Equipment Category" button itself is disabled until both Make and Model have a value** — confirmed via DOM inspection, no network call gates it, so it's a pure client-side cascade |
| Model Year * | `#year` | plain text, `type="text"` (not `type="number"` — unlike Price/Usage Hours, so it can actually hold non-numeric input for validation to reject) | required. **Confirmed real app-level range check**, not just "numeric or not": `"abcd"` → Next disabled; `"1900"` → Next enabled (matches TC44's boundary exactly); `"3000"` → Next disabled (an upper bound too — not in the original sheet, found as a bonus while confirming the lower one) |
| Serial # | `#serial` | plain text | not marked required |
| Usage Hours/Miles | `#usageHr` | plain text (`type="number"`) | not marked required |
| Usage Type | `select#usage-type-select` | **native `<select>`**, options: Select Type / Hours / Miles / Kilometers | only native select on this step — use `.asDropdown()`. **Confirmed genuinely required** despite no visible red asterisk — Next stays disabled without a selection |

### Step 2 — Location

| Field | selector | Widget | Notes |
|---|---|---|---|
| Use Previous Location | custom checkbox (real `input` is `sr-only`; click the adjacent `span` text) | checkbox | **Confirmed:** checking it reveals an additional button, `"Select from previous locations"`, which opens a picklist of the seller's previously saved locations. It's additive — the Country/State/City fields stay visible alongside it, not replaced. Confirms TC34 is real |
| Country * | button `"Select Country"` | flat dropdown, **only 2 options**: Canada, United States | |
| State/Province * | button `"Select State/Province"` | **searchable, paginated list** — has its own `input[placeholder="Search"]` and a `"Load more states"` button | type into the search box, then click the matching result |
| City | button `"Select City"` | **searchable picklist** (has its own `input[placeholder="Search"]`, same pattern as State) | not marked required; **confirmed not free text** — "invalid city/province name" test cases (TC46/47) don't apply as written since users can only pick from a constrained list |

### Step 3 — Pricing & Contact Details

| Field | selector | Widget | Notes |
|---|---|---|---|
| Price * | `#price` | `type="number"` | required. **Confirmed:** the browser blocks non-numeric keystrokes at the input level — typing `"abc"` leaves the field empty (`value === ""`), it never reaches app-level validation. Automate TC21 as "field stays empty / Next stays disabled after typing non-numeric input," not "an error message appears" |
| Currency | `select[name="currency"]` | **native `<select>`**, options: Select Currency / USD ($) / CAD (C$) | use `.asDropdown()` |
| Use Company Contact Details | custom checkbox (click the adjacent `span` text, real input is `sr-only`) | checkbox | **Confirmed:** auto-fills Contact Name with the seller's company name (from Brand Info) and Contact Email with the logged-in user's email; Contact Phone is left blank (none on file for this test account); Contact Name becomes `disabled` while checked |
| Contact Name * | `#contactName` | plain text | required. **Confirmed no format validation** — `"John123"` and `"John@Doe"` were both accepted (Next stayed enabled), contrary to TC31's assumption of letters/spaces/dots only |
| Contact Phone * | `#contactPhone` | plain text | required |
| Contact Email * | `#contactEmail` | `type="email"` | required |

### Step 4 — Description & Details

| Field | selector | Widget | Notes |
|---|---|---|---|
| Description * | 1st `[contenteditable="true"]` in the step | **rich-text editor** (Quill — `class="ql-editor"`; toolbar: paragraph-style dropdown, Bold, Italic, Underline, Link, Ordered list, Bullet list, Clear formatting) | required — confirms TC36 is real. **No maximum length**: 3000 characters typed and retained in full, no counter, no `maxlength` attribute. **But a real minimum length exists and was missed in the first verification pass** — a 19-character value ("Valid description.") produced a genuine, visible inline error, **"Please enter at least 20 characters."** directly under the field, and `Next`/`Submit` stayed disabled until it was corrected to 20+ characters. Caught by accident debugging an unrelated Media Upload check, not by a dedicated re-test — see §11 |
| Features | 2nd `[contenteditable="true"]` | same rich-text editor | optional |
| Specifications | 3rd `[contenteditable="true"]` | same rich-text editor | optional |

This is a genuine WYSIWYG editor, not a `<textarea>`. It doesn't fit this repo's
`TextInput` element (`fill`/`clear`/`value`/`press`) — driving it needs
`element.click()` + `page.keyboard.type()` (or an `el.run()` escape hatch per
`CLAUDE.md`), exposed through `GenericElement`.

### Step 5 — Media Upload

| Field | selector | Widget | Notes |
|---|---|---|---|
| Media Upload * | `input[type="file"]` (visually hidden behind a drag-and-drop zone) | file input | On-page copy states the exact constraint: **"Supported: JPG, PNG (≤15MB each), MP4 (≤150MB). Max 50 images."** — confirms TC28/53/54's numbers exactly. Use `.asFileInput()` / `setFiles()` |
| Uploaded thumbnail | dynamically added `<div>` per file, with a delete (×) icon | — | confirms TC39 |
| Video Link | `#video-link`, placeholder `"YouTube or Vimeo URL"` | plain text | Helper copy says *"such as YouTube, Vimeo, and other video site"*, but **behavior is stricter than the copy suggests**: confirmed via a controlled A/B check (image present in both cases) that `Submit` is **enabled** with the field left empty, but becomes **disabled** when filled with either an unsupported-domain URL (`https://www.tiktok.com/...`) or garbage non-URL text (`"not-a-url-at-all"`). No visible error text appears — the only signal is the disabled Submit button. This confirms TC56's domain-restriction premise is real; automate against the disabled-button state |
| Add Link | button `"Add Link"` | — | adds another Video Link row — needed for TC38 (max 5) |
| Delete video link | trash-icon button next to each row (present even on the first row) | — | confirms TC39 works from the very first row |

### Submit confirmation modal (final step)

Triggering `Submit` opens a modal with this exact copy, confirmed verbatim:

> "By submitting this form, the listing will be published live on the website"
> **Cancel** | **Ok**

This matches TC40/41/42 precisely — no rewrite needed. Clicking "Ok" is now confirmed to
succeed (§2a) and is built as TC15/TC42.

---

## 4. Confirmed cross-cutting behavior

- **Next/Submit is disabled-until-valid on every step, and for most fields that's the
  *only* feedback** — not just an untested gap. On Asset Information, an empty `#title`
  was inspected directly after blur: `border-color` stayed neutral gray
  (`rgb(232,232,232)`, no red), `aria-invalid` stayed `"false"`, and pressing Enter in the
  empty field changed nothing. The Media Upload video-link validation (§3) behaves the
  same way — disabled Submit, no inline text. **Description & Details is the one
  confirmed exception**: it shows a real inline error ("Please enter at least 20
  characters") below a too-short value — see §3 and §11. Don't generalize "no inline
  errors anywhere" from the fields already checked; check each field's own behavior before
  writing its assertion, the same way this one was found by accident rather than assumed
  clean.
- **`#serial` (Serial #) accepts any characters with no format validation** — confirmed by
  typing `"123@#$abc"` and blurring: value was retained as-is, border stayed neutral,
  `aria-invalid` stayed `null`. TC43 ("invalid serial number format") does not apply
  against real behavior — there is no format rule to violate.
- **Wizard state is client-side only** — a full page reload resets progress back to step
  1, even though the URL keeps a `status=asset-information` query param that never
  actually updates as you advance. Don't rely on the URL to assert wizard position; use
  the stepper's checkmarks instead.
- Category, Make, and Model selections all funnel into an `isSuggestion` boolean sent to
  the backend — this was the field implicated in the persistence bug documented (and later
  resolved) in §2a. Worth remembering for any Action that fills these fields, even though
  it's no longer an active blocker.

---

## 5. Key discrepancies vs. the supplied test case sheet

| Test case(s) | Sheet assumes | Real app does | Resolution |
|---|---|---|---|
| TC3, TC30 | A dropdown defaulting to "New Listing" / "Single Listing" | Two separate buttons on the **Listings tab**: `Bulk Upload` and `+ New Listing`; no in-wizard Single/Bulk toggle | Rewrite TC3 as "Listings tab shows Bulk Upload and New Listing actions"; redefine TC30 around the two entry points |
| TC4 | Breadcrumb "Home > Dashboard > Create New Listing" | "HOME \| LISTINGS \| CREATE NEW LISTING" | Automate against the real string |
| TC7, TC16 | Reference ID validated as alphanumeric + unique | **Confirmed true, exactly as the sheet describes** — "(Optional)" just means the field isn't required, not that duplicates are allowed. Real error, verbatim: "Reference ID must be alphanumeric and unique." | No rewrite needed — automate directly, built and passing |
| TC8/TC18/TC38 (Category empty) | Category can be left empty and Next clicked | Category button is disabled until Make+Model are filled — can never be "empty" in isolation | Rewrite precondition: Make+Model filled, Category left unset |
| TC14, TC15, TC40-42 | Draft/listing persists successfully | **Confirmed true, after an initial false negative** — early testing hit a 400 error on the persistence API (§2a), later re-tested and found resolved (4/4 successful retries, full Submit→Ok flow confirmed, listing verified visible in Listings) | Automate against the real success path — built and passing as TC14 and TC15/TC42 |
| TC27, TC52 | Description enforces a character limit, with an error message when the text is too long | **Inverted, not absent**: no maximum exists (3000 chars typed and retained), but a real **minimum of 20 characters** does, with a genuine inline error — "Please enter at least 20 characters." — found by accident while debugging an unrelated check, not by the original targeted test | Rewrite as a minimum-length check, not a maximum — the sheet's premise ("exceeds the limit") is backwards, but the underlying feature (length validation + inline error) is real and now has exact copy to assert |
| TC36 | Rich text formatting supported | **Confirmed true** — 3 separate rich-text editors (Description/Features/Specifications) | No longer "Clarify" — promote to Automate |
| TC43 | Serial # has a format rule that rejects invalid values | **Confirmed no format validation** — special characters accepted and retained as-is | Not applicable as written |
| TC46, TC47 | City/Province are free-text fields that can hold an "invalid" string | **Confirmed both are constrained picklists** (searchable, like State) — there is no free text to be invalid | Rewrite or drop; picklists can't hold an arbitrary invalid value |
| TC56 | Only YouTube and Vimeo domains allowed | **Confirmed real**, and stricter than the helper copy suggests: a controlled check (image present, video-link empty vs. filled) showed Submit goes from enabled → disabled when the link is an unsupported domain or non-URL text | No longer "Clarify" — promote to Automate; assert against the disabled-Submit state, since no inline error text appears |
| Many "click Next → read inline error text" cases (17,18,19,20,21,22,25,26,31,32,33,45,48,49,50,51) | A specific inline error string per field | **Confirmed for every field actually checked**: no inline error text, no red border, no `aria-invalid` change on blur — disabled-button is the observed feedback mechanism, **except Description (TC27/52), which does show real inline text**. None of the TC numbers in this row are Description-related, so the correction doesn't move any of them, but it means "disabled-button only" is a per-field finding, not a blanket rule to extend to fields not yet checked | Automate the disabled-state behavior for these specific fields; there is no error copy to assert for them |

---

## 6. Duplicate / low-value test cases (consolidate)

TC57–TC71 (15 cases) are near-duplicate, templated variations of "add/delete an
(in)valid video URL placeholder, with/without a confirmation message" — several are
internally inconsistent (TC57 says deleting a **valid** URL shows "no error", TC61 says
adding an **invalid** one should error, TC62-71 layer on a delete "confirmation message"
no earlier case establishes exists in the UI, and none was observed during verification).
Recommend collapsing to **3 representative scenarios**:
1. Add a valid video URL, then delete it → placeholder removed, no error.
2. Add an invalid/unsupported video URL → validation error shown, Submit blocked.
3. Add an invalid video URL, then delete that placeholder → error clears, Submit unblocked.

Also duplicates, folded into their primary row in §7: TC35/TC48 → TC22 (currency
required), TC49 → TC31 (contact name), TC50 → TC25 (contact email), TC51 → TC26 (contact
phone), TC52 → TC27 (description length), TC55 → TC29 (video URL format), TC37 → TC24
(media required), TC42 → TC15 (confirm submission).

---

## 7. Test case decision matrix (all 71)

Legend — **Decision**: `Automate-P0` (smoke, build first — all now field-verified),
`Automate-P1` (regression), `Automate-P2` (low priority / slow), `Rewrite` (real app
differs, needs new preconditions/expected text — built where the rewritten version still
carries real, distinguishing behavior; `Rewrite → deliberately not built` where live
verification showed the rewritten version has no assertable outcome left, same as
`Deliberately not built`), `Consolidate` (merge, see §6), `Clarify` (needs a PM/QA
decision or one more manual check before automating).

### A. Page shell / navigation (TC1–5)

| # | Title | Decision | Notes |
|---|---|---|---|
| 1 | Navigation to Create New Listing | Automate-P0 | Via Listings tab → New Listing button |
| 2 | Back Button Functionality | Automate-P0 | `img[alt="Go back"]` → `/dashboard` |
| 3 | Default Dropdown Selection | **Rewrite, built (done)** | No such dropdown exists (see §5), but the underlying intent — the Listings tab offers both a single-listing and a bulk path — is real and now automated as "Listings tab shows New Listing and Bulk Upload actions." Zero new Page/Action code needed; both button locators already existed |
| 4 | Breadcrumb Navigation | Automate-P0 | Assert `HOME \| LISTINGS \| CREATE NEW LISTING` |
| 5 | Stepper Progress Indicator | Automate-P0 | 5 steps confirmed; stepper ticks green as each step completes |

### B. Asset Information (TC6–8, 16–20, 32–33, 43–45)

| # | Title | Decision | Notes |
|---|---|---|---|
| 6 | Asset Information Entry (happy path) | Automate-P0 | Fully verified field-by-field |
| 7 | Reference ID uniqueness validation | **Automate-P0 (done)** | Confirmed real, exact error text matches the sheet — built and passing |
| 8 | Mandatory fields (Title, Category) | **Automate-P0 (done)** | Title-empty already covered by TC17; the Category half is rewritten and built here — Category button is disabled at page load and stays disabled until Make+Model are both filled, then becomes enabled. Reused the `assertCategoryButtonDisabled/Enabled()` methods that already existed from early exploration but had never been wired into a scenario |
| 16 | Reference ID duplicate error | **Automate-P0 (done)** | Same scenario as TC7 — one test covers both |
| 17 | Asset Title empty → error | **Automate-P0 (done)** | Next stays disabled — built and passing |
| 18 | Category empty → error | **Automate-P0 (done)** | Same scenario as TC8 — one test covers both |
| 19 | Make empty → error | **Automate-P0 (done)** | Built and passing |
| 20 | Model empty → error | **Automate-P0 (done)** | Built and passing |
| 32 | Model Year non-numeric | **Automate-P0 (done)** | `#year` is `type="text"`, so non-numeric input actually reaches the app (unlike Price) — confirmed Next disables. Built and passing |
| 33 | Usage field non-numeric | Deliberately not built | Same proven pattern as Price (TC21): `#usageHr` is `type="number"`, so the browser blocks non-numeric keystrokes before the app ever sees them, and the field is optional besides — a dedicated scenario would just re-prove TC21's already-confirmed mechanism, not add coverage |
| 43 | Serial # invalid format | Rewrite → deliberately not built | **Confirmed no format validation exists** — special characters are accepted and retained as-is, so there's no invalid-input outcome left to assert; same no-op mechanism as TC21/TC33, just on a text field instead of a number field |
| 44 | Model Year boundary value (1900) | **Automate-P0 (done)** | Confirmed accepted exactly as the sheet describes; also found the app enforces an *upper* bound too (3000 → rejected) — a bonus finding not in the original sheet. Built and passing |
| 45 | Usage Type required | **Automate-P0 (done)** | **Confirmed genuinely required**, contrary to the earlier note — no visible red asterisk, but Next stays disabled without it and enables once selected. The UI's lack of an asterisk isn't reliable evidence of optionality; the disabled-button state is |

### C. Location (TC9, 34, 46–47)

| # | Title | Decision | Notes |
|---|---|---|---|
| 9 | Location Entry (happy path) | Automate-P0 | Fully verified: Country (2 options) → State (search) → optional City |
| 34 | Previously saved locations | Automate-P0 | **Confirmed**: checking "Use Previous Location" reveals a "Select from previous locations" picklist button, additive alongside Country/State/City |
| 46 | Invalid city name | Rewrite → deliberately not built | **Confirmed City is a searchable picklist, not free text** — "invalid city name" as written doesn't apply; there's no text box to type an invalid value into, so there's nothing distinct left to automate beyond the happy-path picklist selection TC9 already covers |
| 47 | Invalid province name | Rewrite → deliberately not built | **Confirmed State/Province is a searchable picklist, not free text** — same as above |

### D. Pricing & Contact Details (TC10, 21–22, 25–26, 31, 35, 48–51)

| # | Title | Decision | Notes |
|---|---|---|---|
| 10 | Pricing & Contact Details Entry (happy path) | Automate-P0 | Fully verified field-by-field |
| 21 | Price non-numeric | Deliberately not built | Same proven mechanism as TC33 (Usage Hours): `#price` is `type="number"`, browser blocks non-numeric keystrokes before the app sees them — nothing left to test beyond what TC33's writeup already establishes |
| 22 | Currency required | **Automate-P0 (done)** | Confirmed: empty Currency → Next disabled. Built and passing |
| 25 | Invalid email format | **Automate-P0 (done)** | Confirmed: `"not-an-email"` → Next disabled. Built and passing |
| 26 | Phone <10 digits | **Automate-P0 (done)** | Confirmed: 5-digit phone → Next disabled. Built and passing |
| 31 | Contact name invalid chars | Rewrite → deliberately not built | **Confirmed no format validation exists** — `"John123"` and `"John@Doe"` were both tested directly and Next stayed *enabled* both times. The sheet assumes letters/spaces/dots only; the real app accepts anything — same no-op mechanism as TC43 (Serial #), nothing left to assert |
| 35, 48 | Currency required/invalid (dup) | Consolidate | Merge into TC22 |
| 49 | Invalid contact name (dup) | Consolidate | Merge into TC31 |
| 50 | Invalid contact email (dup) | Consolidate | Merge into TC25 |
| 51 | Invalid contact phone (dup) | Consolidate | Merge into TC26 |

### E. Description & Details (TC11, 23, 27, 36, 52)

| # | Title | Decision | Notes |
|---|---|---|---|
| 11 | Description & Details Entry (happy path) | Automate-P0 | Fully verified: 3 rich-text editors |
| 23 | Description required | **Automate-P0 (done)** | Genuinely missing until a final audit caught it — empty Description keeps Next disabled, same proven pattern as TC17/19/20. Built and passing |
| 27 | Description character limit | **Rewrite, built (done)** | **Real constraint, wrong direction**: no maximum (3000 chars accepted), but a genuine 20-character *minimum* with a real inline error, "Please enter at least 20 characters." — rewritten to assert the minimum instead of a maximum, and built. The exact-text locator initially missed the DOM's trailing period on the error string; the live run against the real app caught it immediately, fixed by adding the period |
| 36 | Rich text formatting supported | Automate-P0 | **Confirmed real** — promoted from Clarify |
| 52 | Description length (dup of 27) | Consolidate | Merge into TC27 (both Rewrite/not-applicable) |

### F. Media Upload (TC12–13, 24, 28–29, 37–39, 53–71)

| # | Title | Decision | Notes |
|---|---|---|---|
| 12 | Media Upload (images/videos) | Automate-P0 | Fully verified: file input + video link both work |
| 13 | Video links addition | Deliberately not built | Already exercised byte-for-byte as a step inside TC12's happy path — a standalone scenario would duplicate it, not add coverage |
| 24 | Media required (empty → error) | **Automate-P0 (done)** | Field carries a red asterisk, confirmed required. Built and passing |
| 28 | Max image upload limit (50) | **Automate-P0 (done)** | Confirmed exact real error, distinct from the format-rejection one: "Only 50 images are allowed. 1 image(s) not added." Built efficiently — the same small test image repeated 51× in one `setFiles()` call (confirmed live the app counts entries, doesn't dedupe by content), so no need to generate 51 distinct assets. Runs in ~15s, no slower than any other Media Upload scenario |
| 29 | Invalid video URL | **Automate-P0 (done)** | Distinct input category from TC56 (malformed text, not a wrong-but-valid domain) — worth its own scenario since a real app could validate format and domain via different logic even though this one happens to share the disabled-Submit outcome. Built and passing |
| 37 | Mandatory image at submit (dup of 24) | Consolidate | Merge into TC24 |
| 38 | Max video URL limit (5) | **Automate-P0 (done)** | Confirmed: after 5 rows, `Add Link` becomes `disabled` (no error message — the app's usual pattern). Built and passing |
| 39 | Delete video URL placeholder | **Automate-P0 (done)** | Confirmed: trash icon present from the first row. Built and passing |
| 53 | Invalid image format | **Automate-P0 (done)** | Confirmed accepted formats: JPG, PNG. Built and passing |
| 54 | Invalid video format | Deliberately not built | Would reuse the exact same test file and assertion as TC53 (same file input, same "unsupported format" message) with zero distinguishing input — a real duplicate, not new coverage, unlike TC29/TC56 which differ in input category |
| 55 | Invalid video URL format (dup of 29) | Consolidate | Merge into TC29 |
| 56 | Invalid video URL domain | Automate-P0 | **Confirmed real** via controlled A/B check — Submit disables for unsupported-domain/garbage URLs, enables when the field is left empty. Promoted from Clarify |
| 57–71 | Video URL placeholder variants (15 cases) | Consolidate | Collapse to 3 scenarios — see §6 |

### G. Submission & cross-cutting (TC14–15, 30, 40–42)

| # | Title | Decision | Notes |
|---|---|---|---|
| 14 | Save as Draft | **Automate-P0 (done)** | UI step + end-state assertion both built and passing — see §2a and §11 |
| 15 | Form Submission (publish) | **Automate-P0 (done)** | Full flow through Submit → Ok → listing visible in Listings, built and passing |
| 30 | Bulk Upload navigation resets form | **Rewrite, built (done)** | Explored live: "Bulk Upload" is a **dropdown menu** (Upload CSV / View Logs / Download Sample CSV / Download Categories), not a form or a mode toggle. The original premise — a stateful Single/Bulk switch where "returning to Single Listing" resets shared form data — doesn't exist; New Listing and Bulk Upload are parallel, independent entry points (confirmed by TC3), and there's no shared form state to reset. Rewritten to the real, closest-equivalent intent: confirm the Bulk Upload entry point exposes its real actions. Built and passing |
| 40 | Submit confirmation pop-up | Automate-P0 | Exact copy confirmed — see §3 |
| 41 | Cancel submission | Automate-P0 | `Cancel` button confirmed in the modal |
| 42 | Confirm submission (dup of 15) | Consolidate | Merged into TC15 — built and passing together |

**Summary:** 36 Automate-P0, all built and passing (field-verified end-to-end and, for the
persistence-dependent rows, actually run against a real save/publish — not inferred), 0
Automate-P1, 0 Automate-P2, 7 Rewrite rows total — of which **3 carry real, distinguishing
behavior and are built and passing** (TC3: Listings tab entry points; TC27: Description's
20-character minimum, with exact inline-error copy; TC30: Bulk Upload's CSV-action menu),
and **4 were rewritten in analysis but deliberately left unbuilt** (TC31, TC43, TC46,
TC47) because live verification showed there is nothing left to assert: TC31 and TC43
confirmed the app applies **no format validation at all** to Contact Name / Serial #
(same no-op-input pattern already proven by TC21/TC33, just for text fields instead of
number fields), and TC46/TC47 confirmed City and State/Province are **constrained
picklists**, not free text, so there is no "invalid" value a picklist selection could ever
hold — building a scenario for any of the four would exercise the same "field accepts
anything, Next never disables" or "field can't take arbitrary text" outcome already
established, not add coverage. 4 more deliberately not built for the same
proven-duplicate reason (TC13, TC21, TC33, TC54 — already-built mechanism, no
distinguishing input), and 24 folded into the above via Consolidate. **0 Clarify, 0 open
items, 0 backlog.** Every question from the first draft of this document — including the
persistence bug in §2a, initially confirmed broken and later confirmed fixed on new
evidence (full timeline in §2a), and Reference ID uniqueness, the last item carried since
§8's first draft — has been closed out by live verification, and every row confirmed to
carry real, automatable behavior is now built and passing. See §12 for the row-by-row
final disposition of all 71 test cases.

---

## 8. Open items

**None remain.** Every item from the first draft of this document has been closed out by
live verification: inline-error UX, both checkboxes' effects, video-URL domain
validation, City/Province's picklist nature, Description's character limit, the
persistence bug (§2a, resolved), and — the last one standing — Reference ID uniqueness
(TC7/TC16), confirmed real and automated: creating a second listing with a Reference ID
already in use is rejected with "Reference ID must be alphanumeric and unique.", shown as
real UI text, matching the original sheet's expected copy exactly. Built and passing —
see §11.

---

## 9. File plan (5-layer architecture)

All selectors below are field-verified (§3), not assumed.

```text
tests/ui/pages/
  LoginPage.ts                 — #email, #password, submit button
  SellerDashboardPage.ts       — Listings tab, Bulk Upload / New Listing buttons
  CreateEquipmentShellPage.ts  — breadcrumb, back image, stepper, Save as draft / Next / Submit
  AssetInformationPage.ts      — referenceId, title, make, model, category modal
                                 (toggle-by-label, leaf-by-label, submit), year, serial,
                                 usageHr, usage-type-select
  LocationPage.ts              — previous-location checkbox, country/state/city pickers
                                 (state has its own search input)
  PricingContactPage.ts        — price, currency select, useCompanyContactDetails checkbox,
                                 contactName, contactPhone, contactEmail
  DescriptionDetailsPage.ts    — 3 contenteditable rich-text regions (description,
                                 features, specifications) exposed as GenericElement
  MediaUploadPage.ts           — hidden file input, uploaded-thumbnail delete icon,
                                 video-link input, Add Link button, per-row delete icon
  SubmitConfirmationPage.ts    — modal text, Cancel / Ok buttons

tests/ui/actions/
  LoginActions.ts               — login(email, password)
  ListingsActions.ts            — openNewListing(), openBulkUpload()
  CreateEquipmentActions.ts     — goBack(), assertBreadcrumb(), assertActiveStep(),
                                   saveAsDraft(), clickNext(), clickSubmit()
  AssetInformationActions.ts    — fillAssetInformation(props), selectCategory(path[]),
                                   assertNextDisabled()
  LocationActions.ts            — fillLocation(props), useSavedLocation()
  PricingContactActions.ts      — fillPricingContact(props), useCompanyContactDetails()
  DescriptionDetailsActions.ts  — fillDescriptionDetails(props)
  MediaUploadActions.ts         — uploadImages(paths[]), addVideoLink(url),
                                   deleteVideoLink(index), deleteImage(index)
  SubmissionActions.ts          — confirmSubmit(), cancelSubmit()

tests/ui/step-definitions/
  create-equipment.steps.ts     — Given/When/Then glue calling the Actions above only

tests/ui/features/web/
  create-equipment.feature      — tagged @smoke / @BIDC-280 / @create-equipment

data/props/create-equipment.props.ts   — AssetInformationProps, LocationProps,
                                          PricingContactProps, DescriptionDetailsProps
data/testdata/create-equipment.json    — valid + invalid fixture rows per field group
data/testdata/assets/                  — sample image (JPG/PNG) + video (MP4) files,
                                          plus one invalid-format file for TC53/54
```

Register every new Actions class in `tests/ui/support/action.fixture.ts` per the existing
convention.

**Category picker** needs a dedicated helper on `AssetInformationActions`, e.g.
`selectCategory(["Construction Equipment", "Aerial Work Platforms", "Boom Lifts - Articulating"])`,
that opens the modal, expands each parent in sequence via its toggle chevron, clicks the
leaf, and clicks the modal's Submit. This is business logic (looping over a path array),
so it belongs in the Action, not the Page, per the "no `if`/`for` in Pages" rule — the
Page only exposes element getters (open button, toggle-by-label, leaf-by-label, submit).

**Rich-text fields** — corrected after building this step (see §11): they *do* fit the
standard `TextInput` element. `locator.fill()` works natively on Quill's `[contenteditable]`
divs despite them not being real `<input>`/`<textarea>` elements, confirmed live, so
`DescriptionDetailsPage` uses `.asTextInput()` like any other text field — no
`GenericElement`/`keyboard.type()` workaround needed. (`.value()` — `inputValue()` — would
still fail on them, since that's specifically for form controls; use the inherited
`.text()`/`.innerText()` to read content back instead.)

---

## 10. Recommended sequencing (original plan — see §11 for what actually happened)

Kept as written at the time rather than rewritten in hindsight, since the gap between plan
and outcome (§2a turned out fixable, so Phase 2's precondition never actually applied) is
itself useful history. §11 is the authoritative record of final status.

With every field, widget, and validation rule confirmed live (§3–§5), there was no
remaining "verify before building" gate on the UI layer itself — only the persistence bug
(§2a, at the time still believed broken) was expected to gate a subset of end-state
assertions.

**Phase 1 (this sprint) — build all of it, nothing left to explore:**
1. File the persistence bug (§2a) so it's tracked before anything depends on it.
2. Shell navigation (TC1, 2, 4, 5) + Asset Information (TC6, 17, 19, 20, 32, 33, 44) +
   Location (TC9, 34) + Pricing & Contact (TC10, 21, 22, 25, 26, 31) + Description &
   Details (TC11, 23, 36) + Media Upload (TC12, 13, 24, 38, 39, 53, 54, 56).
3. Submit confirmation dialog scenarios (TC40, 41) — the dialog itself works regardless
   of the backend bug, since Cancel never calls the API.
4. Apply the 8 Rewrite rows (§7) as corrected scenarios rather than porting the sheet
   1:1 — TC3, TC8, TC18, TC21, TC27/52, TC30, TC43, TC46/47.

**Phase 2 (planned: once the bug in §2a is fixed):** wire up TC14 and TC15/42's end-state
assertions, then automate Reference ID uniqueness (TC7/TC16). **What actually happened:**
§2a turned out to already be fixed by the time it was re-checked, so TC14/TC15/TC42 were
built directly in the same pass rather than deferred — see §11. Reference ID uniqueness
(TC7/TC16) is the one item still genuinely in a "Phase 2" state, and it's now unblocked
technically, just not yet done (§8).

---

## 11. Implementation status (Phase 1 complete — full wizard built)

Built and validated, following the 5-layer architecture exactly:

- **Pages:** `BasePage`, `LoginPage`, `SellerDashboardPage`, `CreateEquipmentShellPage`,
  `AssetInformationPage` (multi-level Category tree modal helpers), `LocationPage`
  (cascading Country → State → City dropdowns, previously-saved-locations picker),
  `PricingContactPage`, `DescriptionDetailsPage` (3 Quill rich-text editors),
  `MediaUploadPage` (file input, video-link rows), `SubmitConfirmationPage`
- **Actions:** `LoginActions`, `SellerDashboardActions`, `CreateEquipmentShellActions`,
  `AssetInformationActions`, `LocationActions`, `PricingContactActions`,
  `DescriptionDetailsActions`, `MediaUploadActions`, `SubmissionActions` — all
  registered in `action.fixture.ts`
- **Data:** `AssetInformationProps`/`LocationProps`/`PricingContactProps`/
  `DescriptionDetailsProps`/`MediaUploadProps` types, `create-equipment.json` fixture,
  `loadCreateEquipmentProps()` reader, plus real test assets in
  `data/testdata/assets/`: `equipment-photo.png` (a genuine synthetic PNG — see the note
  below on why it isn't an actual Desktop screenshot) and `invalid-format.txt` (for the
  negative-format case)
- **Feature/Steps:** `create-equipment.feature` — TC1/TC4/TC5, TC2, TC6, TC9, TC34, TC10,
  TC11, TC36, TC12, TC24, TC53, TC56, TC39, TC40, TC41, TC14, TC15/TC42, TC17, TC19, TC20,
  TC32, TC44, TC7/TC16, TC22, TC25, TC26, TC8/TC18, TC45, TC38, TC3, TC29, TC28, TC30, TC23,
  plus
  "Use Company Contact Details" coverage — + `create-equipment.steps.ts`

**A note on the test image asset:** asked to source a dummy image from the Desktop's
screenshots, `ls` could list them but `cat`/`cp` on any of them failed with "No such file
or directory" — this sandbox permits directory listing outside the project but blocks
reading file *content* outside the project directory and the scratchpad. Generated a
genuine, valid 200×150 PNG directly instead (verified via `file`) — functionally
equivalent for upload testing, just synthetic rather than a real screenshot.

**All three validation gates pass:** `npm run bddgen`, `npx tsc --noEmit`, `npm run
lint:rules` (0 warnings).

**Run individually against the live app, current results:**

| Scenario | Result |
|---|---|
| TC1/TC4/TC5 — navigate via Listings tab click | ✅ pass (§2b's navigation race mitigated with a state-based wait — see §2b) |
| TC2 — back button | ✅ pass |
| TC6 — Asset Information happy path | ✅ pass |
| TC9 — Location happy path (Country → State → City → Next) | ✅ pass |
| TC34 — previously saved locations picker opens with options | ✅ pass |
| TC10 — Pricing & Contact happy path | ✅ pass |
| Use Company Contact Details auto-fill + lock | ✅ pass |
| TC11 — Description & Details happy path (advances to Media Upload) | ✅ pass |
| TC36 — Description editor rich text formatting (Bold applied and confirmed in HTML) | ✅ pass |
| TC12 — upload a valid image + video link enables Submit | ✅ pass |
| TC24 — Submit disabled until an image is uploaded | ✅ pass |
| TC53 — invalid file format rejected ("1 file(s) skipped: unsupported format.") | ✅ pass |
| TC56 — unsupported-domain video link blocks Submit | ✅ pass |
| TC39 — deleting the offending video link unblocks Submit | ✅ pass (after a real fix — see below) |
| TC40 — Submit shows the confirmation dialog with correct copy and both buttons | ✅ pass |
| TC41 — Cancel closes the dialog and preserves the filled-in form | ✅ pass |
| TC14 — Save as Draft persists and appears in Listings | ✅ pass |
| TC15/TC42 — Submit → Ok → listing published and visible in Listings | ✅ pass |
| TC17 — Listing Title required (empty → Next disabled) | ✅ pass |
| TC19 — Make required (empty → Next disabled) | ✅ pass |
| TC20 — Model required (empty → Next disabled) | ✅ pass |
| TC32 — Model Year rejects non-numeric input | ✅ pass |
| TC44 — Model Year accepts the boundary value 1900 | ✅ pass |
| TC7/TC16 — Reference ID must be unique (create one, duplicate a second, exact error shown) | ✅ pass |
| TC22 — Currency required (empty → Next disabled) | ✅ pass |
| TC25 — Contact Email must be a valid format | ✅ pass |
| TC26 — Contact Phone must meet the minimum digit length | ✅ pass |
| TC8/TC18 — Category disabled until Make+Model filled, then enabled | ✅ pass |
| TC45 — Usage Type required (no asterisk, but genuinely required) | ✅ pass |
| TC38 — Video links capped at 5 (`Add Link` disables) | ✅ pass |
| TC3 — Listings tab shows both New Listing and Bulk Upload | ✅ pass |
| TC29 — Malformed video link blocks Submit | ✅ pass |
| TC28 — Image uploads capped at 50 ("Only 50 images are allowed...") | ✅ pass |
| TC30 — Bulk Upload exposes its real CSV actions (rewritten from the false "form reset" premise) | ✅ pass |
| TC23 — Description required (found missing in a final audit, not just untested) | ✅ pass |
| TC27 — Description enforces a real 20-character minimum, exact inline error asserted | ✅ pass |

TC1 was built against the literal user journey in §2b, and initially stayed red on
purpose so it wouldn't quietly dodge a real bug — see §2b for the full timeline: the user
reported testing this manually and seeing it succeed, which prompted a live re-verification
that isolated the failure to a timing race a human essentially never triggers. The
automation was updated with a state-based stability wait (not an artificial sleep) so it
now reflects normal usage; the underlying router race is still a real, reportable app
defect. TC9, TC34,
TC10, TC11, TC36, TC12, TC24, TC53, TC56, TC40, and TC41 all passed on the first live run
against the real app with zero fixes needed, because each step's DOM (cascading disabled
states, dropdown structures, field requiredness, editor selectors, file input
`accept`/`multiple` attributes, the delete-button `aria-label`s, the confirmation dialog's
exact copy) was fully verified live *before* writing any Page Object code — the
frontend-first approach kept paying off through every remaining step.

**Asset Information's remaining validation cases (TC17, 19, 20, 32, 44, 7, 16) were built
in one focused, efficient pass** rather than one exploration-plus-build cycle per test
case, since most of the ground was already covered by earlier work. Only three things were
genuinely unknown and worth a quick live check first: `#year`'s exact input type (it's
`type="text"`, not `type="number"` like Price — so it can actually hold non-numeric text
for TC32 to test against, unlike Price where the browser blocks bad input before the app
ever sees it), whether the sheet's 1900 boundary is really accepted (yes — and a bonus,
unasked-for finding: 3000 is rejected, so there's an upper bound too, not just a lower
one), and Reference ID uniqueness, which needed persistence working (§2a) and hadn't been
testable before. **The duplicate-Reference-ID error text matches the original sheet
exactly** — "Reference ID must be alphanumeric and unique." — confirmed both in the raw
API response and as real, visible UI text after a failed second save.

For efficiency, `AssetInformationActions.fillAssetInformation()` was made to skip
Make/Model/Category selection when their value is empty, rather than adding four
near-duplicate `fillWithEmpty*()` methods — this lets TC17/19/20/32/44 all reuse the one
method with a single field overridden on the test-data object (`{ ...validAssetInformation,
title: "" }`), each scenario staying a few lines and needing no new fixtures. All six
scenarios passed on the first live run.

**Pricing & Contact validation (TC22, 25, 26) followed the identical pattern one step
later**, reusing the already-widened technique: a single live check (four fields, one
script) confirmed Currency-empty, invalid-email, and short-phone all disable Next — but
also that **Contact Name has no format validation at all**. Both `"John123"` and
`"John@Doe"` were tried directly and Next stayed enabled either way, contrary to TC31's
premise (letters/spaces/dots only). TC31 is marked Rewrite alongside TC43 (Serial #) and
TC33 (Usage Hours) — the third field in this module found to have no validation where the
sheet assumed one. `PricingContactProps.currency` was widened from `"USD" | "CAD"` to
include `""`, matching the real `<option value="">Select Currency</option>` placeholder
exactly, so TC22 could be expressed as a one-field override on the existing valid props
rather than a new fixture. All three built scenarios passed on the first live run.

**TC8/TC18/TC45/TC38 were the cheapest slice yet, by design — reuse first, build only what's
missing.** TC8/TC18's assertion methods (`assertCategoryButtonDisabled/Enabled()`) already
existed from the very first exploration pass in this module; they had simply never been
wired into a feature scenario. Writing that scenario needed zero new Page or Action code —
only a step and a `.feature` block. TC38 reused the existing `addVideoLink()` in a small
loop (`fillMaximumVideoLinks()`), rather than duplicating its row-index logic. **TC45
reversed an earlier note rather than confirming it**: the original write-up flagged Usage
Type as "no visible asterisk — verify it's actually required" and left it as Rewrite;
directly testing it (fill everything else, leave Usage Type unset) showed Next stays
disabled without it and enables once selected — genuinely required, the missing asterisk
was just a UI omission, not evidence the field is optional. All four scenarios passed on
the first live run.

**TC3, TC28, TC29 closed out the remaining backlog after a deliberate triage, not a blanket
"build everything confirmed automatable."** All five of the pending items (TC3, 13, 28, 29,
54) were technically automatable, but building TC13 and TC54 as their own scenarios would
have meant literal duplicates — TC13 re-exercises a step TC12 already covers byte-for-byte,
and TC54 would reuse the exact same test file and assertion as TC53 with no distinguishing
input. Those two stay documented as "deliberately not built," consistent with how TC21/TC33
were handled earlier. TC3, TC28, and TC29 were built because each tests something genuinely
distinct: TC3 needed zero new Page/Action code (`newListingButton`/`bulkUploadButton`
already existed from the very first exploration pass); TC29 tests a different input
category than TC56 (malformed text vs. a well-formed wrong-domain URL — a real app could
validate those two cases through entirely different logic even though this one happens to
share the same disabled-Submit outcome); and TC28 turned up its own distinct, exact error
text — **"Only 50 images are allowed. 1 image(s) not added."** — separate from TC53's
format-rejection message, confirmed live before writing any assertion. TC28 was also kept
efficient rather than slow: a live check confirmed the app counts array entries rather than
deduplicating file content, so uploading the same small test image 51 times in one
`setFiles()` call reliably triggers the cap — no need to generate or manage 51 distinct
assets. All three scenarios passed on the first live run, with no regressions in the
existing suite.

**TC30 closes the module out — the one item that genuinely needed fresh exploration
rather than reuse or triage.** Two ad-hoc exploration attempts hit a hang on
`waitUntil: "networkidle"` (this app has some background polling that seems to keep the
network from ever truly going idle on this page); switching to `domcontentloaded`, which
the rest of this module's exploration scripts already used, resolved it immediately — a
reminder that a stuck script here is worth debugging the wait strategy before assuming
the app itself is broken. Once past that, "Bulk Upload" turned out to be a dropdown menu
(Upload CSV / View Logs / Download Sample CSV / Download Categories), not a form or a
Single/Bulk toggle — so TC30's literal premise ("switching to bulk upload resets the
form") doesn't describe anything that exists: New Listing and Bulk Upload are parallel,
independent entry points with no shared form state to reset, confirmed by the same
finding that already justified TC3's rewrite. Rather than force a "form reset" assertion
onto a flow that has no form, TC30 was rewritten to the real, closest-equivalent intent —
confirming the Bulk Upload entry point exposes its actual actions — mirroring exactly how
TC3 handles the analogous case for New Listing. Built and passing on the first live run,
with no regressions.

**Closing TC30 prompted a final audit of the matrix against the actual `.feature` file
rather than trusting the matrix's own labels — and it caught a real gap.** TC23
(Description required) had sat labelled `Automate-P1` since the first draft and was never
actually built; it had just never been re-checked once the P0/P1 distinction stopped being
maintained in later batches. TC24, TC39, and TC53 were the opposite problem — genuinely
built and passing for several rounds, but their matrix cells still said `Automate-P1`
because updating the results table in past batches hadn't included going back to close the
matching matrix row. Both are now corrected, and TC23 is built the same way as everything
else — same proven empty-field-disables-Next pattern as TC17/19/20, verified live, passing
on the first run. The lesson: a status table is only as reliable as the last time it was
cross-checked against the actual code, not the last time it was written.

**With TC23 and TC30 done, every one of the 71 supplied test cases has a final,
live-verified disposition — automated, consolidated into another scenario, or deliberately
not built with a stated reason. Nothing remains unresolved.** See §12 for the complete,
final disposition of all 71.

**TC39 needed a real fix, caught by running it, not by inspection.** The first version of
`MediaUploadActions.addVideoLink()` always clicked "Add Link" before filling — including
on the very first call — because the Media Upload step always renders one Video Link row
by default (not created via "Add Link"), so the row *count* was already 1 before any call.
That meant every `addVideoLink()` call landed one row later than intended: TC12's single
call filled row 1 instead of row 0 (harmless there, since Submit only cares that *some*
row holds a valid link) — but TC39's `removeVideoLink(0)` would have deleted the
still-empty default row instead of the one actually holding the unsupported-domain link,
making the assertion pass or fail for the wrong reason. Caught because TC12's real test
log showed `Click: Add Link button` firing on a scenario that should never have needed
it — an unexpected line in a passing test's log is still worth reading, not just the
pass/fail. Fixed by checking whether row 0 is actually empty (`.value() === ""`) rather
than trusting the row count, then re-ran TC12 to confirm it now fills row 0 directly, and
TC39 to confirm the delete now targets the right row.

**Phase 1 is complete: every step of the wizard is built, verified live, and passing
except the one test that's supposed to fail.** TC40 confirms the confirmation dialog
itself (exact copy, both buttons); TC41 confirms Cancel is fully non-destructive
(dialog closes, uploaded file and form values all still present, Submit still clickable).

**TC14 and TC15/TC42 were added in a later pass, once §2a turned out to be resolved (see
§2a for the full timeline of that correction).** They weren't part of the original Phase 1
scope — this section originally documented them as "deliberately not built" because
clicking Ok appeared to hit a broken endpoint. New evidence contradicted that, it was
re-tested rather than taken on faith, and once confirmed genuinely fixed, both scenarios
were built the same way as everything else here: verify the real flow live first
(`SellerDashboardPage.searchInput` / `listingRowByTitle()`, confirming a listing search
actually surfaces the row), then build the Page/Action/Step/Feature layers, then run each
one individually against the live app. Both passed on the first run. `SubmissionActions
.confirmSubmission()` now exists and is exercised by TC15/TC42; `SellerDashboardActions
.assertListingVisible()` is the shared end-state check both TC14 and TC15/TC42 use.

**Correction to an earlier assumption, caught by re-verifying instead of trusting a prior
note:** §9's file plan originally said the rich-text editors "don't fit `TextInput`" and
would need a `GenericElement` + `page.keyboard.type()` workaround. Direct testing this
slice showed that's wrong — Playwright's `locator.fill()` works natively on Quill's
`[contenteditable]` divs despite them not being real `<input>`/`<textarea>` elements, so
`DescriptionDetailsPage` uses the standard `.asTextInput()` element like every other text
field, with no special-casing. Worth remembering generally: a documented plan — or a prior
finding — is a hypothesis, not a permanent fact, until it's re-checked against current
reality. The navigation bug in §2b held up under repeat automated testing and was
genuinely reproducible — but was later refined, not overturned, once the user reported
manual testing succeeding: re-verification showed it's a real timing race that a human
essentially never triggers, not an unconditional break (see §2b). The persistence bug in
§2a was real and reproducible when first found, four different ways, and still turned out
to need a re-test once new evidence contradicted it (see §2a). Retest before trusting
either a plan or an earlier "confirmed" finding, especially against a live environment
someone else might be actively changing — and especially when a report from someone
actually using the app contradicts it.

TC36 is a genuine formatting check, not just a repeat of the happy-path fill: it selects
the typed text via `ControlOrMeta+a`, clicks the real Quill Bold toolbar button
(`button.ql-bold[aria-label="bold"]`), and asserts the editor's `innerHTML` actually
contains `<strong>` — proving formatting is applied and persisted, not merely that the
toolbar renders.

**A real validation rule was found by accident, and the doc's earlier "no inline errors
anywhere" claim was corrected rather than left standing.** Verifying Media Upload meant
reaching the step after it, which meant re-filling Description with a quick placeholder
("Valid description.", 19 characters) — and `Next` stayed disabled with a visible error,
"Please enter at least 20 characters." that no earlier pass had ever seen (every previous
description used in testing happened to already be well over 20 characters). This directly
contradicts the earlier confirmed-sounding claim that no field but the ones explicitly
checked shows inline error text — corrected throughout §3, §4, §5, and §7 rather than
patched in one place and left stale elsewhere. The lesson isn't "always assume inline
errors exist" — it's that a finding confirmed for the fields actually tested doesn't
transfer to fields that weren't, and a throwaway value in an unrelated verification script
is exactly the kind of thing that surfaces what a deliberate test never would.

**A genuine flake was investigated, not silently accepted.** The "Use Company Contact
Details" scenario failed once (of 6 total runs across isolated and batched execution) on
`Click: Location dropdown option: Washington`, then passed cleanly on 5 subsequent runs —
3 in isolation, 2 in a full-suite batch. That ratio is consistent with an ordinary
transient latency blip against the real remote QA server, not a deterministic bug in
`LocationActions`; a code change made to "fix" a failure that reproduces 1-in-6 with no
consistent mechanism would be guessing, not engineering. Documented here rather than
ignored so a recurrence pattern is visible if it starts happening more often.

Findings worth keeping now that every module and every Automate-P0/Rewrite row from §7 is
built:

- **Cascading disabled fields keep showing up.** State/Province and City are `disabled`
  until their predecessor is picked (State needs Country; City needs both); Category
  needed Make+Model. Expect the same pattern elsewhere and always check `isDisabled()`/the
  `disabled` attribute live before assuming a field is independently fillable.
- **The `sr-only` checkbox + `<label>` click-target pattern is used consistently.** Both
  "Use Previous Location" (Location) and "Use Company Contact Details" (Pricing & Contact)
  hide the real `<input type="checkbox">` and require clicking the wrapping `<label>`
  instead — `locator("label", { hasText: ... })`, never the raw checkbox input.
- **Three visually-identical editors need a real distinguishing selector.** All three
  Quill editors share the same tag, classes, and `contenteditable` attribute — only their
  `data-placeholder` text is unique, so that's what each `DescriptionDetailsPage` getter
  keys off. Index-based (`.nth(0/1/2)`) would have worked too but is fragile to reordering;
  the placeholder text is both stable and self-documenting.
- **A field can validate a minimum where you only tested the maximum.** Description has no
  upper character limit but does have a 20-character minimum with a real inline error —
  found only because an unrelated verification script happened to use a too-short
  placeholder value. When a field takes free text, don't stop at confirming there's no
  ceiling; a floor is a different, equally real constraint that a "type 3000 characters"
  test will never surface.
- **Repeatable-row UI elements reuse the same `id` and `aria-label` across rows** — Media
  Upload's "Add Link" creates additional `<input id="video-link">` elements with the exact
  same id as the first (invalid HTML, real behavior), and every row's delete button shares
  `aria-label="Remove link"`. `.nth(index)` is required, and — the actual bug caught this
  slice — the *first* row already exists before any "Add Link" click, so index 0 is never
  something you create yourself; a row-count check has to account for that pre-existing row
  or it silently operates one row off, as `addVideoLink()` did until TC12's log exposed it.
- **A file input's `accept` attribute is a UI hint, not enforcement** — Media Upload's
  input declares `accept="image/jpeg,image/png,image,video/mp4"` `multiple`, but
  `setInputFiles()` bypasses that entirely (real browsers do too, for a script-driven
  file selection), so the actual rejection of `invalid-format.txt` came from the app's own
  post-upload check, surfaced as "1 file(s) skipped: unsupported format." — assert against
  that real message, not against the `accept` attribute.

Implementation gotchas worth keeping going forward:

1. **Accessible names can be compound.** The Listings tab button's accessible name is
   "Listings Listings" (icon `alt` text + label paragraph both feed it), not "Listings" —
   using `exact: true` against the naive expected string fails. Prefer non-exact
   `getByRole` name matching unless the exact compound string is confirmed live.
2. **`hasText` is substring, not exact.** "Caterpillar" as a `hasText` filter also matches
   "Caterpillar/Athey" in the Make autocomplete list. Suggestion-list items use
   `getByRole("option", { name, exact: true })`; the Category tree's toggle/leaf lookups
   (no ARIA role available there) use an anchored `^\s*text\s*$` regex helper
   (`exactTextPattern` in `AssetInformationPage.ts`) instead of raw `hasText`.
3. **`toContainText` compares raw DOM text, not CSS-rendered text — and different entry
   routes to the same page can render genuinely different DOM text for it.** The
   breadcrumb always reads "HOME \| LISTINGS \| ..." visually. The first draft of
   `assertBreadcrumb()` asserted the visual uppercase string directly and failed, because
   `openDirectly()` (a hard page load, used by every scenario except TC1) renders it as
   real mixed-case DOM text ("Home \| Listings \| ..."), CSS-uppercased. That fix held
   until TC1 — reached via Listings tab → New Listing, a client-side navigation instead of
   a hard load — finally rendered successfully after the §2b timing fix, and its DOM text
   turned out to be literally uppercase, not CSS-transformed. Both are real; the fix was to
   assert case-insensitive regexes (`/home/i`, `/create new listing/i`) instead of assuming
   either casing. Verify literal DOM casing before writing any text assertion, and don't
   assume it's the same across every route that can reach the same visual page.
4. **A step definition is the easiest place to accidentally break the "no `expect`, no
   locators in Steps" rule** — reaching for `expect(page.locator(...))` directly in a step
   is the fastest way to write an assertion, and it slipped in once while drafting the
   TC34 step before being caught and moved into `LocationActions.assertPreviousLocations
   ListVisible()` + a `LocationPage.openDropdownListbox` element, per convention. `npm run
   lint:rules` would have caught it anyway, but it's worth watching for on the first
   pass rather than relying on the linter as the only backstop.
5. **`BaseElement` doesn't expose an `innerHTML` reader**, and TC36's assertion needed one
   (checking for a real `<strong>` tag, not just text content). The documented escape hatch
   fits exactly: `element.run("Read description HTML", (loc) => loc.innerHTML())`, then a
   plain `expect(html).toContain(...)` in the Action — `expect` and `.run()` aren't
   forbidden there (only `page.locator`/`getByRole`/`getByText` and the removed procedural
   `this.ui`/`this.assert`/`this.read` layer are, confirmed directly against
   `rules/framework-rules.json`). Reach for `.run()` before reaching for a raw `page.*`
   call or a new element type.
6. **Not every modal is `role="dialog"`.** The Submit confirmation overlay is a plain
   styled `<div>` with no ARIA role at all — confirmed by inspecting it directly rather
   than assuming `page.getByRole("dialog")` would work. `SubmitConfirmationPage` targets
   the message text and buttons directly instead of scoping to a dialog container that
   doesn't exist. The Category tree modal earlier in the wizard has the same property.
   Check for a real `role` attribute before writing a locator that assumes one.
7. **A "confirmed" bug against a live, actively-developed environment isn't permanent —
   treat new contradicting evidence as a re-test trigger, not something to weigh against
   an existing writeup.** §2a's persistence failure was genuinely confirmed at the time:
   two field-input variants, a direct API error, and a UI-side absence check all agreed.
   It was still wrong by the time it mattered, because the environment had moved on. The
   useful habit isn't "trust the first result less" — it's "when something contradicts a
   standing finding, spend the few minutes to re-run it live before deciding which one is
   stale," the same discipline applied to every other selector and behavior in this
   document.

**Closing out §12 surfaced one more real gap, caught the same way TC23's was: by checking
whether a `Rewrite`-labelled matrix row that documented real, distinguishing behavior had
actually been turned into a scenario, not just trusting its label.** TC27 (Description's
real 20-character minimum, with the genuine inline error "Please enter at least 20
characters.") had been correctly identified and fully documented in §5's discrepancy table
since early in this project, but — unlike TC23 — was never built, because the first
attempt to formalize it happened alongside three genuinely-unbuildable siblings (TC31,
TC43, TC46, TC47) and got swept into the same "documented, not automated" bucket by
mistake. The distinguishing fact that separates it from those four: TC27 has a real,
asserted inline error string, where the other four have no assertable outcome at all
(no format validation exists to trigger, or the field is a picklist with no free-text
"invalid" value to enter). Built now: `DescriptionDetailsPage.descriptionMinLengthError`
targets the exact error text, wired through a new
`assertDescriptionMinLengthErrorVisible()` action and a new `@TC27` scenario reusing the
same precondition chain as TC23. The first live run caught one more precision gap before
it could ship: the real DOM text carries a trailing period ("...20 characters.") that the
locator's initial `exact: true` match omitted, so the assertion timed out against a
same-looking-but-not-identical string on the first attempt — fixed by reading the actual
failure screenshot rather than assuming the copy in this document was already
byte-exact, and the three other appearances of that same string across §5/§7/§11 were
corrected to match. Passed on the second live run, and a regression sample (TC11, TC23,
TC36) confirmed no breakage. With TC23, TC27, and TC30 all done, every `Automate-P0` and
`Rewrite` row in §7 that carries real distinguishing behavior is now built and passing —
see §12 for the complete, row-by-row disposition of all 71.

---

## 12. Final disposition of all 71 test cases

Row-by-row status for every test case in the original BIDC-280 sheet. **Status** values:
`Automated` (built, passing, matches or improves on the sheet's original intent),
`Rewrite — Automated` (sheet's premise didn't match the real app; rewritten around the
real behavior and built), `Consolidated → TC#` (merged into another built scenario, no
separate test), `Deliberately not built` (real app behavior leaves no distinguishing,
assertable outcome beyond a mechanism another built test already proves — building it
would add maintenance cost, not coverage).

### A. Page shell / navigation

| TC# | Title | Final status |
|---|---|---|
| 1 | Navigation to Create New Listing | Automated |
| 2 | Back Button Functionality | Automated |
| 3 | Default Dropdown Selection | Rewrite — Automated (as "Listings tab shows New Listing and Bulk Upload actions") |
| 4 | Breadcrumb Navigation | Automated |
| 5 | Stepper Progress Indicator | Automated |

### B. Asset Information

| TC# | Title | Final status |
|---|---|---|
| 6 | Asset Information Entry (happy path) | Automated |
| 7 | Reference ID uniqueness validation | Automated (shared scenario with TC16) |
| 8 | Mandatory fields (Title, Category) | Automated (shared scenario with TC18; Title half via TC17) |
| 16 | Reference ID duplicate error | Automated (same scenario as TC7) |
| 17 | Asset Title empty → error | Automated |
| 18 | Category empty → error | Automated (same scenario as TC8) |
| 19 | Make empty → error | Automated |
| 20 | Model empty → error | Automated |
| 32 | Model Year non-numeric | Automated |
| 33 | Usage field non-numeric | Deliberately not built — `type="number"` blocks non-numeric keystrokes at the browser before the app sees them; same mechanism as TC21 |
| 43 | Serial # invalid format | Deliberately not built — confirmed no format validation exists at all; nothing to assert |
| 44 | Model Year boundary value (1900) | Automated (bonus finding: an upper bound of 3000 also exists, not in the original sheet) |
| 45 | Usage Type required | Automated |

### C. Location

| TC# | Title | Final status |
|---|---|---|
| 9 | Location Entry (happy path) | Automated |
| 34 | Previously saved locations | Automated |
| 46 | Invalid city name | Deliberately not built — City is a searchable picklist, not free text; no invalid value can be entered |
| 47 | Invalid province name | Deliberately not built — same as TC46, for State/Province |

### D. Pricing & Contact Details

| TC# | Title | Final status |
|---|---|---|
| 10 | Pricing & Contact Details Entry (happy path) | Automated |
| 21 | Price non-numeric | Deliberately not built — `type="number"` blocks non-numeric keystrokes before the app sees them |
| 22 | Currency required | Automated |
| 25 | Invalid email format | Automated |
| 26 | Phone <10 digits | Automated |
| 31 | Contact name invalid chars | Deliberately not built — confirmed no format validation exists; `"John123"`/`"John@Doe"` both accepted |
| 35 | Currency required/invalid (dup) | Consolidated → TC22 |
| 48 | Currency required/invalid (dup) | Consolidated → TC22 |
| 49 | Invalid contact name (dup) | Consolidated → TC31's finding (not built, same no-validation conclusion) |
| 50 | Invalid contact email (dup) | Consolidated → TC25 |
| 51 | Invalid contact phone (dup) | Consolidated → TC26 |

### E. Description & Details

| TC# | Title | Final status |
|---|---|---|
| 11 | Description & Details Entry (happy path) | Automated |
| 23 | Description required | Automated |
| 27 | Description character limit | Rewrite — Automated (real constraint is a 20-character minimum, not a maximum; exact inline error text asserted) |
| 36 | Rich text formatting supported | Automated |
| 52 | Description length (dup of 27) | Consolidated → TC27 |

### F. Media Upload

| TC# | Title | Final status |
|---|---|---|
| 12 | Media Upload (images/videos) | Automated |
| 13 | Video links addition | Deliberately not built — already exercised byte-for-byte inside TC12's happy path |
| 24 | Media required (empty → error) | Automated |
| 28 | Max image upload limit (50) | Automated |
| 29 | Invalid video URL | Automated |
| 37 | Mandatory image at submit (dup of 24) | Consolidated → TC24 |
| 38 | Max video URL limit (5) | Automated |
| 39 | Delete video URL placeholder | Automated (built as "Deleting an invalid video link unblocks Submit") |
| 53 | Invalid image format | Automated |
| 54 | Invalid video format | Deliberately not built — same file input and "unsupported format" message as TC53, zero distinguishing input |
| 55 | Invalid video URL format (dup of 29) | Consolidated → TC29 |
| 56 | Invalid video URL domain | Automated |
| 57–71 | Video URL placeholder variants (15 cases) | Consolidated → 3 representative behaviors (see §6): "invalid URL blocks Submit" is covered by TC29/TC56, and "deleting an invalid URL unblocks Submit" is covered by TC39. The third ("add a valid URL, delete it, no error") was deliberately left unbuilt — it would exercise the exact same `removeVideoLink` mechanism TC39 already proves, just starting from a valid instead of invalid link, with no distinct assertion left to make |

### G. Submission & cross-cutting

| TC# | Title | Final status |
|---|---|---|
| 14 | Save as Draft | Automated |
| 15 | Form Submission (publish) | Automated |
| 30 | Bulk Upload navigation resets form | Rewrite — Automated (as "Bulk Upload offers CSV-based actions rather than a form to reset") |
| 40 | Submit confirmation pop-up | Automated |
| 41 | Cancel submission | Automated |
| 42 | Confirm submission (dup of 15) | Consolidated → TC15 |

### Final tally

| Disposition | Count |
|---|---|
| Automated (Automate-P0, as originally scoped) | 36 |
| Rewrite — Automated (real behavior differed, rewritten and built) | 3 (TC3, TC27, TC30) |
| Consolidated (merged into another built scenario) | 24 |
| Deliberately not built (proven duplicate mechanism or no assertable outcome) | 8 (TC13, TC21, TC31, TC33, TC43, TC46, TC47, TC54) |
| **Total** | **71** |

**39 test cases are built and passing as live, automated Playwright/BDD scenarios**
(36 Automate-P0 + 3 Rewrite), **24 are covered by consolidation into one of those 39**
rather than duplicated as separate tests, and **8 are documented, live-verified findings
that a dedicated scenario would add no coverage for** — each one because the real app
either applies no validation at all to that input (TC13, TC21, TC31, TC33, TC43, TC54) or
because the field is a constrained picklist with no free-text "invalid" value to enter
(TC46, TC47). None of the 71 are unresolved, unverified, or awaiting a decision.

**All modules — A through G — are complete.** Every scenario in this table has either run
successfully against the live QA application, or has a documented, live-verified reason it
was consolidated or deliberately not built. `npm run bddgen`, `npx tsc --noEmit`, and
`npm run lint:rules` all pass against the current `tests/ui/features/web/create-equipment.feature`
and its full Steps → Actions → Pages stack.
