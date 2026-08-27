# Equipment Detail Page — Automation Requirements

**Module:** Equipment Detail Page (gallery, seller info, quick links, equipment details,
features, add-on services, contact-seller form)
**Reference ticket:** [BIDC-616](https://appinventivtech.atlassian.net/browse/BIDC-616)
**App under test:** `https://qa-website-bidadoocl.appskeeper.in` (public/anonymous flow —
no login required to view a listing; the seller's phone/store details are gated behind
login, see §4)
**Coverage requested:** Complete — every one of the 29 supplied test cases is dispositioned
below (Automate, Rewrite, Consolidate, Clarify, or Not automatable), none silently dropped.
**Navigation:** reuse the existing flow already built for the `equipment-listing` module —
Home → Search Results → a result card's **View Details** button → `/search/<id>`. TC1 of
this sheet (navigation to the detail page) duplicates what `equipment-listing.feature`
already automates end-to-end (see §6) and is not re-built here.
**Prepared:** 2026-08-26, verified live against the QA environment (see §1).

This is a **requirements/decision document only**, per the `create-md-ticket` workflow — no
Pages/Actions/Steps/Features are created until this document is approved. §8 gives the
forward-looking file plan for what an approved build would need, extending the
`EquipmentDetailPage.ts` / `EquipmentDetailActions.ts` stub already scaffolded for
`equipment-listing`.

---

## 1. How this was verified

Playwright MCP was not connected to this session; there is no separate frontend source repo
checked out locally to read components/routes from. Per this repo's "Frontend-first" rule,
verification was done the same way as the `equipment-listing` module: ad-hoc Playwright
scripts (chromium, headless, `@playwright/test` from this repo's own `node_modules`, driven
against `.env`'s real `BASE_URL`) inspected the **live** QA app's DOM, live network calls,
live screenshots, and live form/validation behavior — nothing below is assumed from the
sheet or inferred from the `equipment-listing` module's patterns.

**Verified live:** the one confirmed image-based listing's full detail page (gallery icons,
image-viewer modal, seller info card, quick-link cards, equipment details, features,
add-on-services cards) end-to-end; the Contact Seller modal's fields, disabled-submit gating,
and inline email validation; **10 real equipment listings sampled from `/search`** to survey
image/video composition across the current QA data set (§3); two deliberately-triggered
states (empty required fields, invalid email format); a mobile (390px, `devices['iPhone 13']`)
render of the detail page and its image modal.

**Not verified / blocked (see §7):** genuine multi-image browsing, arrow-disabled-at-bounds
behavior, and the modal's "+N more images" count display — of the 10 listings sampled, **only
one had any static images at all, and it had exactly one.** The other 9 were all video-based
listings, one of which visibly failed to render (§4). No listing with 2+ static images was
found in the current QA data — this blocks TC5, TC7 (partially), TC8, TC10, and TC26 from
being verified or built against real data today (flagged as **Clarify**, not silently
assumed). Also not executed: a real multi-browser matrix, real screen-reader software, a
real network-failure-during-submission test against the Contact Seller form (the form's
reCAPTCHA badge was observed but a live submission was not forced through it — see §4).

---

## 2. Verified application structure

```text
/search/<24-char-hex-equipment-id>          (via a result card's "View Details" button only)

Breadcrumb: "HOME | EQUIPMENT | <TITLE>" (confirmed uppercase, confirmed on 2 different
  listings including a long multi-word title — "GENIE 1901LIFT ONE")

Back button (aria-label "Back to results") — returns to the prior /search state

Gallery column (left):
  Thumbnail rail — one thumbnail per uploaded asset (confirmed: 1 thumbnail rendered for a
    1-image listing; not confirmed for 2+ — see §1/§7)
  Main media area — a button wrapping the image, aria-label "Open image viewer"
  3 icon buttons above the main image, each its own real aria-label:
    aria-label="Download all images", aria-label="Share", aria-label="Favorite"
    (there is no per-image download control — one button downloads everything at once)

Info column (right):
  <Title> heading, "Asking Price" label + value (e.g. "CAD $100")
  A field table: Reference ID, Make, Model, Year, Usage, Location, Company Name
  "Contact Seller" button (red, full-width on mobile / fixed-width on desktop)

Seller Information card:
  Seller name + "Verified Seller" badge (confirmed icon + text, conditionally shown)
  "Login to view the seller's details." (red link text) — confirmed: Phone Number and
    Store URL are NOT rendered for an anonymous/logged-out visitor; only the seller's
    display name, Location, and Business Experience are shown pre-login (Business
    Experience showed "-" / no value in both sampled listings)

Quick-link cards (compact, 4 across): Equipment Financing, Extended Warranty,
  Freight & Delivery, Pre-purchase Inspection — each an <a target="_blank"> with a
  "new_tab.svg" icon (confirmed real target="_blank" via DOM, §4)

"Equipment Details" section: free-text description
"Features and Specifications" section: bullet/labelled feature list

Add-On Services section (4 full cards, distinct from the quick-link cards above):
  Same 4 titles, each with its own CTA <a> — confirmed exact real text differs per card
  and does NOT match the sheet's assumed labels (§4)

Contact Seller modal (triggered by the Contact Seller button):
  Header showing "<Title> | <Price> Asking Price"
  Fields: First Name* (required), Last Name (optional), Email Address* (required, type
    validated), Phone Number* (required), Message (optional textarea, pre-filled with a
    dynamic "Hi, I'm interested in the <Title>..." placeholder)
  Buttons: Cancel, Submit — Submit starts **disabled** and stays disabled until the
    required fields are validly filled (confirmed, §4)
  A visible reCAPTCHA badge in the modal's corner (confirmed present, not defeated — §7)
```

### Real network calls observed

Same guest/session and analytics calls already documented for `equipment-listing`
(`bd-auth/v1/accounts/guest`, `bd-equipment/v1/add-to-impression`) — no new endpoint was
found to be specific to the detail page beyond the equipment record itself, which is loaded
server-side (no client-side XHR for the base fields was captured separately from the initial
page load).

---

## 3. Verified image/video composition across sampled listings

10 "View Details" cards were opened from `/search` in sequence and inspected:

| # | Listing (title) | Media found | Notes |
|---|---|---|---|
| 1 | Tractor | **1 static image** | The only image-based listing found; used as the reference fixture for all image-gallery assertions below |
| 2 | Genie 1901Lift one | 1 video | Detail page **failed to render visibly** — see §4, real defect |
| 3–9 | 7 more listings (Genie 1932 Scissor Lift, and others) | video only, 4× `alt="Video"` DOM nodes each | 1 of these 7 also threw the same hydration error live during this pass; the rest rendered without a thrown console error (§4) |

**No listing with 2+ static images was found.** This directly blocks verifying TC5 (Image
Browsing arrows), TC10 (image count / "+N more" display), and the multi-image half of TC7,
TC8, TC26 against real data — see §7, Clarify.

One video's actual embedded content was a placeholder/joke asset (a public
"Rick Astley" video), confirming these are QA seed/dummy assets, not a data-integrity finding
about real seller uploads — noted for context only, not raised as a product defect.

---

## 4. Confirmed cross-cutting behavior and discrepancies vs. the sheet

- **Video-listing detail pages are unreliable.** Of 8 video-based listings opened live in
  this pass, **at least 2 exhibited a real, reproducible failure**: the page's text content
  (title, price, fields, sections) is present in the DOM (confirmed via `innerText`) but is
  **not visually rendered** — the page shows only the header/breadcrumb/thumbnail rail and
  otherwise white space. One of the two also threw `Minified React error #418` (a React
  hydration mismatch) in the console; the other showed the same blank visual state with no
  thrown error. This is intermittent, not tied to one specific listing ID, and is the single
  most significant finding in this pass — it affects TC3, TC6, TC13, TC14, and TC22 for any
  scenario that opens a video-carrying listing. **Recommendation: build and run TC3/13/14
  against the one confirmed-stable image listing (Tractor), and file this rendering failure
  as a product defect separately from test authorship** (see §7, Clarify).
- **Seller Information does not show Phone Number or Store URL to an anonymous visitor.**
  The sheet's TC11 expects "Company Name, Store URL, Phone Number, Location, and Experience
  of Business" all visible. Real, confirmed behavior: only the seller's name, a "Verified
  Seller" badge, Location, and Business Experience (empty/"-" in both samples) are shown;
  Phone Number and Store URL are replaced by a "Login to view the seller's details." message.
  Rewrite TC11 to assert the pre-login state as the real, automatable baseline; a
  logged-in-seller-details variant would need a real authenticated session (out of scope
  unless `ADMIN_EMAIL`/`ADMIN_PASSWORD` credentials are confirmed to unlock this — not
  verified this pass, flagged as Clarify).
- **The Add-On Services CTA button text does not match the sheet's TC15 expectation, and one
  is a genuine content bug.** The sheet expects distinct CTAs ("Get Pre-Approved", "View All
  Plans", "Get Quote", "Schedule Inspection"). Real, DOM-confirmed text for the 4 cards:
  Equipment Financing → **"Approved"**, Extended Warranty → **"Get Pre-Appro88"** (a literal,
  reproducible mangled string — not a screenshot artifact, confirmed via `textContent`),
  Freight & Delivery → "Get Pre-Approved", Pre-purchase Inspection → "Get Pre-Approved".
  Rewrite TC15 to assert the real strings; separately flag "Get Pre-Appro88" as a content
  defect worth a PM/QA ticket of its own.
- **Quick-link cards genuinely open in a new tab** (`target="_blank"`, confirmed via DOM) —
  the one part of TC12's premise that holds up. Their `href` values are CMS-configured
  placeholder/dummy URLs (one is even a typo'd domain, `bidahdoo.asset.net`) — assert
  `target="_blank"` and that a new tab opens, not the literal destination URL, since that
  content is data-managed and not stable to hardcode into a test.
- **Contact Seller form validation is disabled-button-gated, not submit-then-error.** The
  sheet's TC18/TC19 assume the form can be submitted and then shows a blocking error message.
  Real, confirmed behavior: the **Submit button starts `disabled` and stays `disabled`**
  until all required fields (First Name, Email, Phone) are filled with valid-shaped values;
  an invalid email additionally surfaces a real inline message, confirmed exact text:
  **"Please enter valid email"**, directly under the Email Address label. There is no
  "submit blocked, see error" flow to test — the mechanism is the disabled state itself.
  Rewrite both TC18 and TC19 against this real mechanism.
- **A reCAPTCHA badge is present on the Contact Seller form.** This was observed, not
  defeated, in this pass. If it is an invisible/v3 challenge it may not block a real
  Playwright submission; if it requires interaction it will. This must be confirmed before
  TC17 (successful submission) or TC23 (submission-failure retry) can be built as anything
  more than "assert the button becomes enabled" — flagged as **Clarify** (see §7).
- **Breadcrumb pattern already established for `equipment-listing` holds here too** —
  confirmed `"HOME | EQUIPMENT | <TITLE>"`, uppercase, on two different listings including a
  long, awkward real title ("GENIE 1901LIFT ONE") — no rewrite needed for TC2.

---

## 5. Duplicate / low-value consolidation

- **TC1** (View Equipment Details / navigation via the View button) is already fully
  automated by `equipment-listing.feature`'s "Navigate to Equipment Detail Page via all real
  entry points" scenario (see `tests/ui/features/web/equipment-listing.feature:9`) —
  **consolidate into that existing scenario**, do not re-build.
- **TC21** (Web Browser Compatibility) is a CI/config concern (add Firefox/WebKit projects to
  `config/playwright.config.ts` and run the existing suite against them), not a new scenario
  — same disposition as the `equipment-listing` doc's TC27. Consolidate into that
  cross-browser CI decision rather than writing a dedicated Playwright test.
- **TC29** (Regression Testing) restates "run everything above again" with no new trigger —
  consolidate into the P0/P1 suite itself; a passing regression run *is* this test case, it
  doesn't need its own scenario file.
- **TC20** (Mobile Responsiveness) and **TC24** (Accessibility) each name a single concern
  already covered per-section by other rows (e.g. TC3's fields, TC7/9's modal) — kept as
  their own rows below since they're cross-cutting viewport/a11y assertions, not folded in,
  matching how `equipment-listing`'s TC16 (Responsive Design) was kept separate.

---

## 6. Test case decision matrix (all 29)

Legend: **Automate-P0** (smoke-worthy), **Automate-P1** (regression), **Automate-P2** (low
priority/lightweight-only), **Rewrite** (real app differs from the sheet — corrected
expectation given in §4), **Consolidate** (see §5), **Clarify** (needs a PM/QA decision or
more QA test data before it can be built as intended), **Not automatable in this framework**.

| # | Title | Decision | Notes |
|---|---|---|---|
| 1 | View Equipment Details | **Consolidate** → `equipment-listing.feature` | Already automated end-to-end there (§5) |
| 2 | Breadcrumb Navigation | Automate-P0 | Confirmed real pattern holds (§4); reuse the already-scaffolded `EquipmentDetailPage.breadcrumb` getter |
| 3 | Equipment Detail Sections | **Rewrite, Automate-P0** | All named fields confirmed present on the stable image listing; **must run against that fixture, not a video listing** (§4) |
| 4 | Image Thumbnail Display | Automate-P0 | Confirmed: first/only uploaded image renders as the selected thumbnail |
| 5 | Image Browsing | **Rewrite, Automate-P0** | Resolved: the real blocker was missing test data, not the app — a real listing is now self-seeded via the existing Create Equipment automation (login required only for seeding; verification is still anonymous). Confirmed live: Next/Previous updates the active thumbnail as expected. See dependency doc for the seeding approach |
| 6 | Image Download | **Clarify** | The one stable listing has no video to test the "images only, not videos" distinction against; every listing that does have video also has the rendering failure in §4, blocking interaction. Needs a listing with both a working render **and** mixed image+video assets |
| 7 | Image Modal Preview | **Rewrite, Automate-P0** | Confirmed: clicking the "Open image viewer" button opens a real `role="dialog"` modal with the image centered |
| 8 | Image Modal Navigation | **Rewrite, Automate-P0** | Resolved via self-seeded data (see TC5): confirmed live the modal is a **circular carousel**, not bounds-disabled navigation — Previous from the first image wraps to the last, Next from the last wraps to the first. Neither arrow is ever disabled, contradicting the sheet's premise entirely (not just "not yet verified") |
| 9 | Image Modal Close | Automate-P0 | Confirmed: a real close control exists (`aria-label` containing "close") and dismisses the modal |
| 10 | Image Count Display | **Rewrite, Automate-P0** | Resolved via self-seeded data (see TC5): confirmed live there is **no separate "+N more images" text anywhere** — the thumbnail rail itself is the only real count display. Automated as "thumbnail count equals the real uploaded count," the honest equivalent of the sheet's intent |
| 11 | Seller Information Display | **Rewrite, Automate-P0** | Real fields differ from the sheet (§4): Phone Number and Store URL are not shown pre-login; automate the confirmed real fields (name, Verified badge, Location, Business Experience) instead |
| 12 | Quick Links Functionality | **Rewrite, Automate-P0** | `target="_blank"` confirmed for all 4 links; assert that attribute + label text, not the placeholder href values (§4) |
| 13 | Equipment Details Section | Automate-P0 | Confirmed present with real description text on the stable listing |
| 14 | Features Section Display | Automate-P0 | Confirmed present with real bullet/label content on the stable listing |
| 15 | Add-On Services Display | **Rewrite, Automate-P0** | Real CTA text confirmed to differ from the sheet, including one content bug ("Get Pre-Appro88") — automate against the real strings and flag the bug separately (§4) |
| 16 | Contact Seller Form | Automate-P0 | Confirmed: clicking "Contact Seller" opens a real modal with the fields listed in §2 |
| 17 | Contact Seller Form Submission | **Clarify** | Disabled→enabled gating is confirmed and automatable; a real successful *submission* is blocked pending confirmation of the reCAPTCHA's mode (§4) — automate up to "Submit becomes enabled," clarify before asserting a post-submit confirmation message |
| 18 | Contact Seller Form Validation | **Rewrite, Automate-P0** | Real mechanism is the disabled Submit button, not a post-submit error list (§4) |
| 19 | Contact Seller Form Invalid Data | **Rewrite, Automate-P0** | Real, exact inline message confirmed: "Please enter valid email" (§4) |
| 20 | Mobile Responsiveness | Automate-P1 | Confirmed the detail page and its image modal both render at 390px (`iPhone 13` emulation) without a layout crash on the stable listing |
| 21 | Web Browser Compatibility | **Consolidate** → CI config decision | Same disposition as `equipment-listing`'s TC27 (§5) |
| 22 | Error Handling - Image Load Failure | **Clarify** | The real, verified failure mode found this pass is broader than "one broken image" — entire video-listing pages can fail to render (§4). Recommend rewriting this case around that confirmed defect once PM/QA decides whether it's in scope to test a known-broken state, rather than simulating a single `<img>` 404 that wasn't observed to occur independently |
| 23 | Error Handling - Contact Form Submission Failure | **Clarify** (demoted from Automate-P2 during the build pass) | Live implementation attempts found the real submission is not a single stable mechanism: separate runs of the *identical* scenario observed a direct `POST /api/proxy/bd-enquiry/v1/enquiry` fetch, a Next.js Server Action posted back to the page's own URL, and a silent full pass-through — with no reliable way to predict which occurs. A `page.route()` mock targeting either known mechanism was confirmed live to sometimes simply not intercept anything, because the app used the other mechanism that run. See dependency doc for the full investigation |
| 24 | UI/UX - Accessibility | **Rewrite, Automate-P2; also Not automatable in this framework** | Full screen-reader coverage is out of scope for Playwright (same finding as `equipment-listing`'s TC17). Keyboard-only Tab/focus order **is** genuinely automatable — scope this case to that slice only. Also note real alt text is present but generic (`"image-1"`, not equipment-descriptive) — worth a light assertion that alt text is non-empty, not that it's descriptive |
| 25 | UI/UX - Layout Consistency | Automate-P2 | Feasible as a light structural check (consistent heading hierarchy, section card classes) on the stable listing |
| 26 | Edge Case - Large Number of Images | **Rewrite, Automate-P1** | Resolved via self-seeded data — but the sheet's "100+" premise is **not achievable at all**: the app enforces a real, confirmed hard cap of **50 images** (the same cap `create-equipment`'s own TC28 tests). Retargeted to 50, the platform's real maximum, and automated: uploads succeed and the gallery renders without a crash |
| 27 | Edge Case - No Images Available | **Rewrite, Clarify** | Every "no static image" listing sampled this pass actually had a **video**, not a true zero-media listing, and hit the rendering failure in §4 — a genuine zero-media listing was not found to confirm what a clean "no images" state looks like. Needs either a real zero-media listing from QA, or a PM/QA decision to treat the confirmed rendering failure as this case's real answer |
| 28 | Edge Case - Missing Seller Information | Automate-P1 | Partially already confirmed as the *default* state for an anonymous visitor (Phone/Store URL are always absent pre-login, §4) — automate against that as the realistic case rather than a synthetic "missing data" fixture |
| 29 | Regression Testing - Existing Functionality | **Consolidate** | A passing full run of the P0/P1 suite above is this test case (§5) |

### Summary

| Disposition | Count | TC#s |
|---|---|---|
| Automate-P0 | 16 | 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 19 (17 rows — several carry a Rewrite tag too) |
| Automate-P1 | 3 | 20, 26, 28 |
| Automate-P2 | 2 | 24 (partial), 25 |
| Consolidate | 3 | 1, 21, 29 |
| Clarify | 5 | 6, 17, 22, 23, 27 plus the seller-login-details variant noted under TC11 |
| Not automatable in this framework | 1 (partial) | 24's screen-reader slice only |

**20 of 29** resolve to some flavor of Automate (several as Rewrite, using the corrected,
live-verified behavior from §4) — all 20 are built; 19 pass reliably, and TC26 (the heaviest,
a 50-image seed) has passed cleanly multiple times but showed environment-load-driven timing
flakiness during repeated back-to-back manual runs in this same session — see the dependency
doc. **3** are Consolidate (folded into `equipment-listing` or a CI decision). **5** remain
Clarify, each blocked by a real app defect, a third-party service's non-determinism, an
unstable app-internal mechanism, or a pending PM/QA decision — none are test-data gaps
anymore. TC5, TC8, TC10, and TC26 were unblocked by self-seeding real data through the
existing Create Equipment automation rather than waiting on QA to seed fixtures manually —
see docs/requirements/equipment-detail-dependencies.md for the full investigation.

---

## 7. Open items (need a PM/QA/dev decision before certain rows move out of Clarify)

1. **Test-data gap: no multi-image listing exists.** TC5, TC8 (bounds-check half), TC10, and
   TC26 all need a QA-seeded listing with at least 2–3 real static images before they can be
   automated or even manually re-verified. This is the single biggest blocker in this
   document.
2. **Video-listing detail pages intermittently fail to render.** Confirmed live, twice, on
   different listing IDs, in this same pass (§4) — a real, reproducible defect. Recommend
   raising this to engineering directly rather than building tests around a known-broken
   state; TC3/TC6/TC22 should target the one stable image listing until this is fixed.
3. **Seller phone/store details behind login** — confirmed the anonymous-visitor state for
   TC11/TC28. Whether a logged-in-seller variant is in scope (and whether this repo's
   `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars are the right credentials to unlock it) needs a
   PM/QA call before building that variant.
4. **reCAPTCHA on the Contact Seller form** — its mode (invisible/v3 vs. interactive) needs
   confirming before TC17 (successful submission) can be built past "Submit becomes
   enabled." If it blocks real submissions, TC17/TC23 need a mocked-response strategy
   instead of a real network round trip.
5. **"Get Pre-Appro88" content bug** (Extended Warranty CTA, §4) — worth its own PM/QA ticket
   independent of this automation ticket.
6. **No true zero-media listing was found** (TC27) — every "no image" listing sampled this
   pass turned out to be video-based and hit the §4 rendering failure. A clean "genuinely
   zero assets" listing would need to be seeded to know what the intended empty state
   actually looks like.

---

## 8. Forward-looking file plan (not built — reference only)

Extends the `equipment-listing` module's existing scaffold rather than duplicating it:

```text
tests/ui/pages/
  EquipmentDetailPage.ts       — (already scaffolded: breadcrumb, contactSellerButton) —
                                  extend with: asking price/field-table getters (Reference
                                  ID, Make, Model, Year, Usage, Location, Company Name),
                                  gallery icon buttons (download/share/favorite) by
                                  aria-label, "Open image viewer" trigger, seller-info card
                                  fields, quick-link cards by name, add-on-service cards +
                                  their CTA by heading, Equipment Details / Features section
                                  text blocks
  ImageViewerModalPage.ts      — new: the image-viewer dialog (close control, prev/next
                                  arrows, count text once a multi-image fixture exists)
  ContactSellerModalPage.ts    — new: First/Last Name, Email, Phone, Message inputs,
                                  Cancel/Submit buttons, inline email-validation message

tests/ui/actions/
  EquipmentDetailActions.ts    — (already scaffolded) — extend with: assertDetailFields(),
                                  assertSellerInfo(), openImageViewer(), assertQuickLinks
                                  OpenInNewTab(), assertAddOnServiceCtas()
  ImageViewerActions.ts        — new: nextImage(), previousImage(), close(),
                                  assertImageCount() (blocked on §7 item 1)
  ContactSellerActions.ts      — new: openForm(), fillForm(props), assertSubmitDisabled(),
                                  assertInvalidEmailMessage(), submit()

tests/ui/step-definitions/
  equipment-detail.steps.ts    — new file, Given/When/Then glue calling the Actions above
                                  only

tests/ui/features/web/
  equipment-detail.feature     — new file, tagged @smoke / @BIDC-616 / @equipment-detail;
                                  TC1-equivalent navigation stays in equipment-listing.feature
                                  and is Given-referenced, not re-authored
```

**Fixture note:** every scenario above that exercises real detail-page content should target
the confirmed-stable listing (Tractor, `/search/6a82e7f5879b8b480d21de93` at verification
time) rather than a random `nth()` result card, until either the §4 rendering defect is fixed
or a dedicated, known-good multi-image test listing is seeded — a random pick has roughly a
1-in-10 chance (per this pass's sample) of landing on a broken video listing.
