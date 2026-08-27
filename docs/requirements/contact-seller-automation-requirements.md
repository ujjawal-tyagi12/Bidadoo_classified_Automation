# Contact Seller Form — Automation Requirements

**Module:** Contact Seller enquiry modal (triggered from the Equipment Detail page)
**Reference ticket:** [BIDC-629](https://appinventivtech.atlassian.net/browse/BIDC-629) — "Web | View Equipment: Contact Seller"
**App under test:** `https://qa-website-bidadoocl.appskeeper.in` (public/anonymous flow —
no login required to view a listing or open the Contact Seller modal)
**Coverage requested:** Complete — every one of the 44 supplied test cases is dispositioned
below (Automate, Rewrite, Consolidate, Clarify, or Not automatable), none silently dropped.
**Navigation:** reuses the flow already built for `equipment-detail` — Home → search the
fixture listing → a result card's **View Details** button → `/search/<id>` → **Contact
Seller** button.
**Overlap with BIDC-616:** `equipment-detail-automation-requirements.md` already built and
automated 4 Contact-Seller-adjacent scenarios under BIDC-616 (`equipment-detail.feature`
TC16/18/19/24). Per the approved scope decision, those are **consolidated** here — this
ticket references them rather than re-building duplicate coverage — and this doc adds the
40 net-new scenarios BIDC-616 did not cover.
**Prepared:** 2026-08-26, verified live against the QA environment (see §1).

This is a **requirements/decision document only**, per the `create-md-ticket` workflow — no
Pages/Actions/Steps/Features are created until this document is approved. §7 gives the
forward-looking file plan for what an approved build would need, extending the
`ContactSellerModalPage.ts` / `EquipmentDetailActions.ts` already scaffolded and partially
built under BIDC-616.

---

## 1. How this was verified

Playwright MCP was not connected to this session; there is no separate frontend source repo
checked out locally to read components/routes from (`dev-repo/` does not exist). Per this
repo's "Frontend-first" rule, verification was done the same way as `equipment-detail`:
ad-hoc Playwright scripts (chromium, headless, `@playwright/test` from this repo's own
`node_modules`, driven against `.env`'s real `BASE_URL`) inspected the **live** QA app's
Contact Seller modal DOM, real-time input filtering behavior, real inline validation
messages, and real button-state gating — nothing below is assumed from the sheet.

**Verified live:** anonymous-visitor field state (disabled/type/pattern attributes) for all
5 fields; the exact live character-filtering behavior of First Name, Last Name, and Phone as
values are typed (dots, digits, `@`/`!`, diacritics, apostrophes, HTML tags, SQL-injection
characters, and script tags); Cancel's real modal-close behavior; email format validation
(valid, single-label domain, invalid underscore domain, valid subdomain); boundary lengths
(50-char name, 15-digit phone, ~252-char email); minimum-length field combination's effect on
the Submit button's disabled state; leading/trailing whitespace handling per field; empty
optional fields (Message, Last Name); a modified auto-generated message; the real "reset"
mechanism (Cancel + reopen); and offline behavior via `context.setOffline(true)` (safe —
never reaches the real backend).

**Not verified / blocked (see §6):** a real logged-in user's pre-fill/disabled state for
First Name/Last Name/Email (TC2) — verifying this would require a real login combined with
opening the form, which was not attempted this pass; a real successful submission with a
confirmation message (TC4, TC29) — same adaptive reCAPTCHA v3 non-determinism already
documented in `equipment-detail-dependencies.md` (TC17 there: identical automated runs
scored a genuine `403` and a genuine pass-through); a mocked API-failure response (TC22) —
same non-deterministic submission-mechanism blocker as that doc's TC23; the auto-generated
message's content for a listing with special characters or an unusually long title in its
name (TC23, TC24) — the current QA search/listing data was not stable enough this pass to
pin down such a fixture; the exact minimum phone-digit threshold enforced before Submit
becomes enabled (TC34) — confirmed a 1-digit phone keeps Submit disabled and a 15-digit phone
is accepted in full, but the precise cutoff in between was not enumerated.

---

## 2. Verified Contact Seller modal structure and behavior

```text
Contact Seller modal (triggered by the "Contact Seller" button on the detail page):
  role="dialog"
  Fields:
    First Name*  input[name="first"]   — required; live character filter strips
                                          everything except letters and spaces
    Last Name    input[name="last"]    — optional; same live letter/space-only filter
    Email*       input[name="email"]   — required, type="email"; browser auto-trims
                                          leading/trailing whitespace; inline error text
                                          "Please enter valid email" for malformed/
                                          single-label-domain addresses
    Phone*       input[name="phone"]   — required, pattern="[0-9]*"; live filter strips
                                          every non-digit character including "+", "-",
                                          letters, and spaces; no visible max-length cap
                                          (15+ digits accepted); no visible min-length
                                          error message even for very short input
    Message      textarea[name="message"] — optional, pre-filled with a real dynamic
                                          "Hi, I'm interested in the <Equipment Title>.
                                          Could you please provide more details?" string;
                                          freely editable
  Buttons:
    Cancel — closes the dialog; the detail page underneath was never navigated away from
             (this is a modal, not a separate route)
    Submit — starts disabled; becomes enabled once First Name, Email, and Phone all hold
             validly-shaped values (Last Name and Message are not required for enabling)
  No dedicated "reset" control — closing via Cancel and reopening the form is the real
    reset mechanism: all inputs clear and the Message field reverts to its default
    auto-generated text
  A visible reCAPTCHA badge in the modal's corner (confirmed present, not defeated — same
    as BIDC-616 §4/§7)
```

### Confirmed live character-filtering behavior (the single biggest rewrite in this doc)

| Field | Input typed | Stored value | Notes |
|---|---|---|---|
| First Name | `John.Doe` | `JohnDoe` | dot stripped |
| First Name | `John123` | `John` | digits stripped |
| First Name | `<b>John</b>` | `bJohnb` | angle brackets stripped, inner letters survive |
| First Name | `' OR '1'='1` | ` OR ` | quotes/digits/`=` stripped |
| First Name | `<script>alert('XSS')</script>` | `scriptalertXSSscript` | all symbols stripped |
| First Name | `Jöhn` | `Jhn` | non-ASCII diacritic stripped |
| First Name | `  John  ` | `  John  ` | **not trimmed** — leading/trailing spaces preserved |
| Last Name | `Doe Jr.` | `Doe Jr` | dot stripped, internal space kept |
| Last Name | `Doe@!` | `Doe` | special characters stripped |
| Last Name | `D'oe` | `Doe` | apostrophe stripped |
| Phone | `123-456-7890` | `1234567890` | dashes stripped |
| Phone | `+441234567890` | `441234567890` | `+` stripped — international prefix is lost |
| Phone | `12345abc` | `12345` | letters stripped |
| Phone | `  1234567890  ` | `1234567890` | trimmed |
| Email | `  john.doe@example.com  ` | `john.doe@example.com` | trimmed (native `type="email"` behavior) |

**None of these produce a visible "invalid input" error.** The filtering happens silently,
character-by-character, as the user types — there is no submit-time validation message for
any of the above; the sheet's assumption of a post-input validation error for TC14/15/16/31/
37/38/39 does not match the real mechanism.

---

## 3. Confirmed cross-cutting behavior and discrepancies vs. the sheet

- **Name and phone validation is live input-filtering, not post-submit validation.** This is
  the root cause behind rewriting 13 of the 44 rows (TC6, 7, 9, 14, 15, 16, 30, 31, 32, 35,
  36, 37, 38, 39). Every one of these sheet rows assumes either "input accepted as typed" or
  "a validation error is shown" — the real mechanism is neither: invalid characters simply
  cannot be typed into the field at all.
- **HTML/SQL/XSS injection attempts are a genuinely positive security finding, not a broken
  test.** TC37/38/39 expect "a validation error is displayed, indicating invalid input" —
  instead, the dangerous characters (`<`, `>`, `'`, `=`) are stripped before they ever reach
  a stored value, so there is nothing to inject in the first place. Automate these as
  positive-security assertions against the real stripped output, not as error-message checks.
- **Cancel does not "redirect" anywhere (TC5).** Contact Seller is a modal over the detail
  page; clicking Cancel closes the dialog and the same detail page (never left) remains
  visible underneath.
- **There is no dedicated Reset control (TC28).** The sheet's "click a reset button (if
  available) or refresh the page" premise resolves to: there is no reset button; Cancel +
  reopen is the real, confirmed mechanism, and it does fully clear all inputs including
  restoring the default auto-generated Message text.
- **Phone has no confirmed minimum-length validation (TC34).** A 3-digit phone number
  (`123`) was accepted into the field with no inline error shown — directly contradicting the
  sheet's expectation of a "too short" validation error. Separately, a 1-digit phone combined
  with minimal other fields (TC30) did keep the Submit button disabled, so *some* minimum
  constraint exists somewhere in the enabling logic — but the exact threshold and whether it
  surfaces as a visible message were not pinned down this pass (see §6, item 4).
- **International phone numbers lose their `+` prefix (TC32).** `+441234567890` is stored as
  `441234567890` — the field's digit-only filter does not special-case the international
  prefix. This may be intentional (all local numbers, digits-only) or worth a product
  conversation; flagged here rather than assumed.
- **Only Email and Phone trim surrounding whitespace; First Name does not (TC36).** The
  sheet's blanket "spaces are trimmed from input" claim is only true for 2 of the 4 text
  fields — Last Name was not independently re-verified for the leading/trailing-space case
  this pass but is expected to behave like First Name given the shared letter/space-only
  filter.
- **Accented and apostrophe'd names are silently mangled (TC31).** `Jöhn` → `Jhn`, `D'oe` →
  `Doe` — real users with such names would have their name altered without any visible
  warning. Worth a product conversation similar to how BIDC-616 flagged the
  "Get Pre-Appro88" content bug — noted here as an observation, not filed as a defect.
- **Message field content is confirmed correct and fully editable (TC17, TC43, TC44).** The
  real default text — `"Hi, I'm interested in the <Title>. Could you please provide more
  details?"` — was confirmed against the live "Tractor" fixture; clearing it or replacing it
  with custom text leaves the Submit button enabled in both cases, matching the sheet exactly
  for TC43/TC44.
- **Offline submission is safely testable (TC18).** `context.setOffline(true)` blocks the
  request at the network layer before it ever reaches the reCAPTCHA-gated backend — this
  means TC18 can be automated without the "real submission" risk that blocks TC4/TC22/TC29,
  and without creating a real lead.

---

## 4. Duplicate / low-value consolidation

- **TC1** (Contact Seller Form Display) is already fully automated by `equipment-detail.
  feature`'s `@smoke @TC16` scenario ("The Contact Seller button opens the enquiry form") —
  **consolidate into that existing scenario**, do not re-build.
- **TC11** (Empty Mandatory Fields) and the enable-state half of **TC4** (Send Message
  Functionality) are already automated by `equipment-detail.feature`'s `@smoke @TC18`
  scenario ("The Contact Seller Submit button stays disabled until required fields are
  valid") — consolidate; only the actual send-and-confirm half of TC4 remains open (§6).
- **TC20** (UI Layout on Web) duplicates TC1's assertion that the modal and its fields render
  — consolidate into TC1/the equivalent new scenario here.
- **TC21** (Responsive Design on Different Screen Sizes) duplicates TC19 (Mobile) plus the
  existing desktop coverage — one mobile + one desktop viewport is this repo's established
  pattern (see `equipment-detail.feature`'s msite TC20); not an exhaustive size matrix.
- **TC25** (Regression Testing) restates "run everything above again" with no new trigger —
  a passing full run of the P0/P1 suite below is this test case, same disposition as
  BIDC-616's TC29.
- **TC27** (Cross-Browser Compatibility) is a CI/config concern (add Firefox/WebKit projects
  to `config/playwright.config.ts`), not a new scenario — same disposition as BIDC-616's
  TC21.

---

## 5. Test case decision matrix (all 44)

Legend: **Automate-P0** (smoke-worthy), **Automate-P1** (regression), **Automate-P2** (low
priority/lightweight-only), **Rewrite** (real app differs from the sheet — corrected
expectation given in §2/§3), **Consolidate** (see §4), **Clarify** (needs a PM/QA decision or
more verification before it can be built as intended), **Not automatable in this framework**.

| # | Title | Decision | Notes |
|---|---|---|---|
| 1 | Contact Seller Form Display | **Consolidate** → `equipment-detail.feature` TC16 | Already automated (§4) |
| 2 | Pre-filled User Information | **Clarify** | Login-prefill/disabled behavior for First/Last/Email not verified live this pass — needs a real logged-in-buyer session to confirm |
| 3 | Manual User Information Entry | Automate-P2 | Confirmed fields are fillable anonymously; assert against the real filtered values, not the literal typed strings (§2) |
| 4 | Send Message Functionality | **Consolidate** (enable-state → TC18) + **Clarify** (send + confirmation) | Enabling is already automated; actual submission blocked by reCAPTCHA v3 non-determinism (§1, §6) |
| 5 | Cancel Button Functionality | **Rewrite, Automate-P0** | Real behavior: modal closes, detail page underneath was never left (§3) |
| 6 | First Name Validation (dot) | **Rewrite, Automate-P1** | Dot is stripped live, not retained (§2) |
| 7 | Last Name Validation (dot) | **Rewrite, Automate-P1** | Dot is stripped live, not retained (§2) |
| 8 | Email ID Validation (valid format) | Automate-P0 | Confirmed: no error for a valid address |
| 9 | Phone Number Validation (numeric) | **Rewrite, Automate-P0** | Real mechanism is live character-stripping via `pattern="[0-9]*"`, not passive acceptance (§2) |
| 10 | Invalid Email Format | Automate-P0 | Confirmed exact match: inline "Please enter valid email" shown |
| 11 | Empty Mandatory Fields | **Consolidate** → `equipment-detail.feature` TC18 | Already automated (§4) |
| 12 | Boundary: First Name 50 chars | Automate-P1 | Confirmed: accepted in full, no truncation |
| 13 | Boundary: Phone 15 digits | Automate-P1 | Confirmed: accepted in full, no max-length cap observed |
| 14 | Invalid Characters in First Name | **Rewrite, Automate-P1** | Digits stripped live, same mechanism as TC6 (§2) |
| 15 | Invalid Characters in Last Name | **Rewrite, Automate-P1** | Special characters stripped live (§2) |
| 16 | Invalid Characters in Phone Number | **Rewrite, Automate-P1** | Letters stripped live (§2) |
| 17 | Auto-generated Message Content | Automate-P0 | Confirmed exact real text using the real equipment title (§2) |
| 18 | Form Submission without Internet | **Rewrite, Automate-P1** | Safely testable via `context.setOffline(true)` — fails at the network layer before reCAPTCHA, no real submission risk (§3) |
| 19 | UI Layout on Mobile | Automate-P1 | New scenario, mirrors the existing `equipment-detail` msite viewport pattern |
| 20 | UI Layout on Web | **Consolidate** → this doc's TC1-equivalent scenario | Redundant (§4) |
| 21 | Responsive Design, Various Sizes | **Consolidate** → TC19 | One mobile + one desktop viewport, established pattern (§4) |
| 22 | Error Handling for API Failure | **Clarify** | Same non-deterministic submission-mechanism blocker as `equipment-detail-dependencies.md` TC23 |
| 23 | Special Characters in Message | **Clarify** | No stable QA listing with special characters in its title was confirmed this pass (test-data gap) |
| 24 | Long Equipment Name | **Clarify** | Current QA search/listing data was not stable enough this pass to pin down a long-title fixture (§1) |
| 25 | Regression Test | **Consolidate** | A passing full run of the suite below is this test case (§4) |
| 26 | Accessibility Testing | **Rewrite, Automate-P2 (partial) + Not automatable (partial)** | Keyboard-only Tab/focus through all 5 fields is automatable, extending BIDC-616's TC24 (button-only); full screen-reader coverage is out of scope for Playwright, same as BIDC-616's TC24 disposition |
| 27 | Cross-Browser Compatibility | **Consolidate** → CI config decision | Same disposition as BIDC-616 TC21 (§4) |
| 28 | Form Reset Functionality | **Rewrite, Automate-P1** | No dedicated reset control; Cancel + reopen is the real, confirmed mechanism (§3) |
| 29 | Max-Length Fields Submission | **Clarify** | Boundary values themselves are covered by TC12/13/40; the "submitted successfully" claim needs the same reCAPTCHA resolution as TC4 |
| 30 | Min-Length Fields Submission | **Rewrite, Automate-P1** | Confirmed: Submit stays **disabled** with First="J"/Last="D"/Email="j@d.co"/Phone="1" — contradicts the sheet's "submitted successfully" expectation (§3) |
| 31 | Special Characters in Names | **Rewrite, Automate-P1** | Diacritics and apostrophes are stripped live, not preserved (§2/§3) |
| 32 | International Phone Number | **Rewrite, Automate-P1** | `+` prefix is stripped live (§3) |
| 33 | Empty Optional Fields (Last Name) | Automate-P1 | Confirmed: Last Name is genuinely optional for enabling Submit |
| 34 | Invalid Phone — Too Short | **Rewrite, Clarify** | A 3-digit phone shows no visible error, contradicting the sheet; exact minimum-length threshold and whether it should surface a message needs a PM/QA call (§3, §6) |
| 35 | Invalid Phone — Dashes | **Rewrite, Automate-P1** | Dashes stripped live, same mechanism as TC9 (§2) |
| 36 | Leading/Trailing Spaces | **Rewrite, Automate-P1** | Only Email/Phone trim; First Name does not (§3) |
| 37 | HTML Tags | **Rewrite, Automate-P1** | Angle brackets stripped, no visible error — positive security finding (§2/§3) |
| 38 | SQL Injection | **Rewrite, Automate-P1** | Injection characters stripped, no visible error — positive security finding (§2/§3) |
| 39 | XSS Attack | **Rewrite, Automate-P1** | Script tags reduced to plain letters, no visible error — positive security finding (§2/§3) |
| 40 | Max-Length Email | Automate-P1 | Confirmed: a 252-character valid-shaped email accepted in full |
| 41 | Invalid Email Domain | Automate-P0 | Confirmed exact match to the sheet |
| 42 | Valid Email Subdomain | Automate-P0 | Confirmed exact match to the sheet |
| 43 | Empty Message Field | Automate-P0 | Confirmed exact match: Submit stays enabled |
| 44 | Modified Auto-generated Message | Automate-P0 | Confirmed exact match: textarea editable, Submit stays enabled |

### Summary

| Disposition | Count | TC#s |
|---|---|---|
| Automate-P0 | 12 | 5, 8, 9, 10, 17, 41, 42, 43, 44 (9 rows — TC5/9 also carry a Rewrite tag) + partial credit not double-counted |
| Automate-P1 | 17 | 6, 7, 12, 13, 14, 15, 16, 18, 19, 28, 30, 31, 32, 33, 35, 36, 37, 38, 39, 40 (several carry a Rewrite tag) |
| Automate-P2 | 2 | 3, 26 (partial) |
| Consolidate | 7 | 1, 4 (partial), 11, 20, 21, 25, 27 |
| Clarify | 7 | 2, 4 (partial), 22, 23, 24, 29, 34 |
| Not automatable in this framework | 1 (partial) | 26's screen-reader slice only |

**31 of 44** resolve to some flavor of Automate (many as Rewrite, using the real, live-
verified behavior from §2/§3) — this is a **higher rewrite rate than BIDC-616** because the
sheet's validation model (type invalid input → see an error) does not match this form's real
mechanism (invalid input can't be typed at all). **7** are Consolidate (folded into the
already-built BIDC-616 scenarios or a CI decision). **7** are Clarify — **4 of those 7 trace
to the same reCAPTCHA v3 non-determinism already documented for BIDC-616** (TC4, TC22, TC29,
and indirectly TC34's minimum-length question), and **2 trace to QA test-data instability**
(TC23, TC24) rather than a framework limitation.

---

## 6. Open items (need a PM/QA/dev decision before certain rows move out of Clarify)

1. **Adaptive reCAPTCHA v3 blocks a real successful submission** (TC4, TC29) — same
   confirmed non-determinism as `equipment-detail-dependencies.md` TC17: identical runs have
   scored both a genuine `403` and a genuine pass-through. Needs a reCAPTCHA test-key
   override or an automation allowlist for the QA environment before "message actually sent
   + confirmation shown" can be built as anything more than "Submit becomes enabled."
2. **The real enquiry submission uses 3 different, non-deterministic mechanisms** (TC22) —
   same root cause as `equipment-detail-dependencies.md` TC23 (direct REST call, Next.js
   Server Action, silent pass-through). A `page.route()` mock targeting one mechanism
   reliably misses when the app uses another that run. Needs engineering confirmation of
   which mechanism is authoritative before a deterministic API-failure simulation can be
   built.
3. **No true zero-error state was confirmed for a too-short phone number** (TC34) — a
   3-digit phone showed no visible error. Is this an intentional gap (validation happens only
   at the "is Submit enabled" level, with no separate message) or a product validation bug
   worth its own ticket? A PM/QA call is needed, plus pinning down the exact minimum-digit
   threshold that keeps Submit disabled (confirmed disabled at 1 digit, confirmed a fully
   separate 15-digit value is accepted — the boundary in between wasn't enumerated).
4. **A real logged-in-buyer's Contact Seller pre-fill state (TC2) was not verified.** Whether
   this repo's `ADMIN_EMAIL`/`ADMIN_PASSWORD` represents a buyer persona that would see
   pre-filled/disabled First Name, Last Name, and Email fields — or whether that's a
   different account type entirely — needs a PM/QA call, same open question already raised
   in `equipment-detail-automation-requirements.md` §7 item 3 about logged-in seller details.
5. **Stripped diacritics/apostrophes in names, and a stripped `+` in international phone
   numbers** (TC31, TC32) are real, confirmed behaviors that may be worth a product
   conversation independent of this automation ticket — flagged for visibility, not blocking
   any Automate row above.
6. **No stable QA listing exists with special characters or an unusually long title** (TC23,
   TC24) — needs a QA-seeded fixture listing (or reuse of a documented one, if the "GENIE
   1901LIFT ONE" listing referenced in BIDC-616 §3 is confirmed still present under that
   exact title) before the auto-generated message's handling of such titles can be verified.

---

## 7. Forward-looking file plan (not built — reference only)

Extends the BIDC-616 scaffold rather than duplicating it — the actual code already puts
Contact Seller logic directly in `EquipmentDetailActions.ts` / `ContactSellerModalPage.ts`
(not the separate `ContactSellerActions.ts` BIDC-616's own §8 once sketched but was never
built that way):

```text
tests/ui/pages/
  ContactSellerModalPage.ts    — (already built) — no new getters needed; the existing
                                  firstNameInput/lastNameInput/emailInput/phoneInput/
                                  messageInput/submitButton/cancelButton/invalidEmailMessage
                                  getters cover every field this doc exercises

tests/ui/actions/
  EquipmentDetailActions.ts    — (already built, extend) — add: assertFieldFilters
                                  StrippedInput(field, typed, expected), cancelContactSeller
                                  Form(), assertContactSellerFormReset(), assertSubmit
                                  DisabledForShortPhone(), fillOptionalFieldsEmpty(),
                                  simulateOffline() + assertOfflineSubmitError(), tab
                                  ThroughContactSellerFields()

tests/ui/step-definitions/
  contact-seller.steps.ts      — new file, Given/When/Then glue calling the Actions above
                                  only

tests/ui/features/web/
  contact-seller.feature       — new file, tagged @contact-seller @BIDC-629; TC1/TC4
                                  (enable-state)/TC11-equivalent scenarios stay
                                  Given-referenced to equipment-detail.feature, not
                                  re-authored

tests/ui/features/msite/
  contact-seller.feature       — new file, tagged @contact-seller @BIDC-629 @msite; covers
                                  TC19's mobile-viewport rendering only
```

**Fixture note:** every scenario above targets the confirmed-stable "Tractor" listing used
throughout BIDC-616, for the same reason documented there — most other sampled QA listings
are video-based and intermittently fail to render.

---

## Source

- **Seed method:** pasted test-case table (44 rows), ticket BIDC-629
- **Columns used:** # | Test Case Title | Test Objective | Test Steps | Test Data |
  Precondition | Expected Result
- **Frontend context:** no `dev-repo/` provided; verified live against `.env`'s `BASE_URL`
  (`https://qa-website-bidadoocl.appskeeper.in`), same methodology as
  `equipment-detail-automation-requirements.md`
- **Related docs:** `equipment-detail-automation-requirements.md`,
  `equipment-detail-dependencies.md` (shared reCAPTCHA v3 and test-data-gap blockers)
