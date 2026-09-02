# Equipment Favorite Icon — Automation Requirements

**Module:** Favorite icon — `/search` result cards and the equipment detail page's gallery
icon row, plus the sign-in modal it triggers for a signed-out visitor
**Reference ticket:** [BIDC-630](https://appinventivtech.atlassian.net/browse/BIDC-630)
**App under test:** `https://qa-website-bidadoocl.appskeeper.in`
**Coverage requested:** Complete — every one of the 44 supplied test cases is dispositioned
below (Automate, Rewrite, Consolidate, Clarify, or Not automatable), none silently dropped.
**Navigation:** both surfaces are in scope — the `/search` result cards (confirmed live to
have their own favorite icon, not previously scaffolded) and the equipment detail page's
already-scaffolded `EquipmentDetailPage.favoriteButton`.
**Prepared:** 2026-08-26, verified live against the QA environment (see §1).

---

## 1. How this was verified

Playwright MCP was not connected to this session; there is no separate frontend source repo
checked out locally. Per the "Frontend-first" rule, ~20 small ad-hoc Playwright scripts
(chromium, headless, `@playwright/test` from this repo's own `node_modules`, driven against
`.env`'s real `BASE_URL` and real `ADMIN_EMAIL`/`ADMIN_PASSWORD`) inspected the live QA app's
DOM, live network requests/response bodies, and several deliberately adversarial checks
(cleared cookies mid-session, a mocked 500 on the favorites-toggle endpoint, rapid re-clicks).
Scripts were run from a disposable, uniquely-named scratch directory inside the repo (needed
so Node could resolve `playwright` from this repo's own `node_modules`) and deleted afterward;
nothing under `tests/`, `config/`, or `data/` was touched by the investigation itself.

**Verified live, end-to-end:** the favorite icon's presence and real `aria-label` on both
surfaces; anonymous-click → sign-in modal (both surfaces, including the surface-specific
subtitle copy); the modal's disabled-button-gated Sign In with real inline validation; real
server error copy for wrong password and non-existent account; a full real login (real
`ADMIN_EMAIL`/`ADMIN_PASSWORD`) auto-completing the favorite action; the real toggle
network call and response body (`added`/`removed`); persistence of that state across a
completely separate, fresh `/login` session; toggling a favorited item back off; a mocked
500 on the toggle endpoint; a simulated expired session via `context.clearCookies()`;
long-input acceptance (no client-side length cap); "Forgot Password?"/"Sign Up" as real
full-page navigations away from `/search` (not in-modal panels); mobile viewport (390×844)
presence of the icon.

**Not verified / out of scope this pass:** the Sign Up registration form past the
Buyer/Seller picker page, the Forgot Password page past its own form fields, real screen-
reader software, real account deletion/suspension/reactivation (no admin tooling exists in
this framework to trigger them), cross-device consistency with two real separate devices
(the same server-persisted mechanism is already proven by the cross-session check).

---

## 2. Verified application structure

```text
/search  (result cards)
  Each card: <button aria-label="favourite"> (lowercase, British spelling — confirmed
    live via DOM, NOT the same string as the detail page's button below)
    Icon: <img alt="Favorite" src="/images/star-outline.svg"|"/images/star-filled.svg">
    No aria-pressed is ever set (confirmed null before and after toggling) — a real
    accessibility gap, not a selector issue.

/search/<id>  (detail page)
  Gallery icon row: <button aria-label="Favorite"> (capitalized — already scaffolded as
    EquipmentDetailPage.favoriteButton). Same star-outline/star-filled icon mechanism.

Sign-in modal (role="dialog", aria-labelledby="auth-modal-title", heading "Welcome Back"),
  identical markup on both surfaces, only the subtitle text differs:
    Listing card trigger: "Sign In to add this item to your favorites"
    Detail page trigger:  "Sign In to your account" (confirmed live — generic copy, does
      NOT mention "favorites" on this surface)
  Fields: #email (input, name="email"), #password (input, name="password", show/hide
    toggle), a Remember Me checkbox, <a href="/forgot-password">Forgot Password?</a>
  Buttons: Cancel (type=button), Sign In (type=submit, starts `disabled`)
  Real inline field errors: #email-error "Enter a valid email address",
    #password-error "Password must be at least 8 characters"
  Real server-side error copy (rendered as a banner + icon inside the dialog, above the
    form): wrong password → "Sorry, the password is incorrect. You have 4 attempts
    attempts remaining" (note: genuine duplicated-word copy bug, "attempts attempts" —
    confirmed verbatim, not a transcription error); non-existent account → "This account
    doesn't exist. Enter a different email address or Sign Up"
  "Or continue with" Google / Apple buttons (not exercised — OAuth is out of scope for a
    same-origin Playwright test)
  <a href="/user-type">Sign Up</a> — a real full-page navigation to a Buyer/Seller picker,
    not an in-modal signup form
```

### Real network calls observed

- `POST https://bidadoo-qa-services.azure-api.net/bd-equipment/v1/add-to-favorites/toggle`
  — body `{"equipmentId":"<id>"}`, response `{"result":{"added":true}}` or
  `{"result":{"removed":true}}`. **Confirmed to call the external API host directly**, not
  through this app's usual `/api/proxy/...` Next.js proxy that every other endpoint in this
  repo's `ENDPOINTS` map goes through — a genuine, confirmed exception, not an oversight.
- The `bd-search/v1/equipments` response includes a per-item `addToFav: boolean` field once
  a `userId` is present in the request (i.e., once signed in) — this is the real,
  server-persisted source of truth behind the icon's rendered state.
- A successful sign-in from the favorite-triggered modal re-issues the guest→login→profile
  sequence and then **automatically replays the favorite-toggle call** — the user does not
  need to click the icon a second time after logging in.

---

## 3. Confirmed cross-cutting behavior and discrepancies vs. the sheet

- **TC9's premise is wrong.** The sheet expects "no change occurs" when clicking an
  already-favorited icon. Real, confirmed behavior: it is a genuine toggle — a second click
  un-favorites the item (`"result":{"removed":true}}`, icon reverts to `star-outline`,
  persists after reload). Rewrite TC9 around the real toggle mechanism; TC35 (Remove
  Favorite) is the same real mechanism, just phrased as its own case.
- **A false "toggle appears broken" reading during this investigation was a testing
  gotcha, not a product defect.** An early manual pass wrongly suspected a stuck-favorited
  state after a login-triggered re-click. Root cause: after a successful login, the search
  results **re-fetch with `userId`** and can re-order — a script re-querying "the first
  `View Details` button's card" after that re-fetch can land on a *different* card than
  before login. A single clean click on the *same, currently-favorited* card reliably
  toggles off and persists — confirmed with a fresh `/login`-then-reload check. **Any Action
  method that clicks favorite immediately after a login-triggered re-render should not
  assume result-card order is stable across that re-fetch** — this doc's Action layer
  anchors to index 0 read fresh each time, not a cached locator.
- **No `aria-pressed` (or any ARIA state) is exposed on either favorite button** — the only
  real, assertable state signal is the icon's `img[src]` value
  (`star-outline.svg`/`star-filled.svg`). Noted as a real a11y gap (TC6's UI/UX intent),
  not built as a distinct scenario since there is nothing further to assert once the icon
  state is already covered by TC1/TC9/TC35.
- **The modal's subtitle text is surface-specific** — "...add this item to your favorites"
  only appears when triggered from a listing card; the detail page's trigger shows the
  generic "Sign In to your account" instead. Both are asserted, not assumed identical.
- **A mocked API failure on the toggle endpoint produces a real, visible toast** (not a
  silent no-op) that echoes the mocked response body's `message` field verbatim, and the
  icon correctly stays in its pre-click state — a real, confirmed, automatable "network
  failure" case (TC8), using the same `page.route()` technique already sanctioned elsewhere
  in this repo (`SearchResultsActions.openWithMockedSearchFailure`).
- **A simulated expired session (`context.clearCookies()` without a reload) correctly
  re-prompts the sign-in modal** on the next favorite click — confirmed live, real and
  automatable (TC7).
- **SQL-injection/XSS/HTML-injection strings in the email field are all caught by the same
  generic client-side "Enter a valid email address" format check** — confirmed live for an
  XSS payload; there is no distinct security behavior to assert beyond the ordinary
  invalid-email-format case (TC14). The password field has no format validation beyond an
  8-character minimum, so an injection-shaped password is just arbitrary text that reaches
  the same real "incorrect password"/"account doesn't exist" flow as any wrong credential
  (TC16/TC17) — TC28–33 are all the same two mechanisms wearing different input strings, not
  six distinct behaviors.
- **No client-side max length exists on either field** — confirmed live with a 165-char
  email and a 158-char password, both accepted and Sign In enabled.
- **"Forgot Password?" and "Sign Up" both navigate away from `/search` entirely** (real
  `<a>` tags, confirmed `href="/forgot-password"` and `href="/user-type"`) — neither loops
  back to "now favorite the item" afterward. `/user-type` is a Buyer/Seller picker, not a
  registration form itself — a full signup module would need its own page objects, not
  scaffolded in this repo today.

---

## 3a. Correction: not a dead click handler — a self-owned-listing business rule, fixed test-side

**This section's earlier conclusion was wrong.** It read the listing-card favorite button's
silent no-op on `index=0` as a broken click handler and recommended leaving TC1 (both
variants), TC3, TC8, TC9, TC10, TC35, and TC36 deliberately red until the app fixed it.
Further live investigation (comparing the listing card against the equipment **detail
page**'s own favorite button for the same item) found the real mechanism: **this app
correctly refuses to let an account favorite its own listing** — the detail page's button is
even labeled `aria-label="Favorite disabled for own listing"` for exactly this case. The
listing card just gives no equivalent signal (its icon `alt` is the generic
`"favorite-disabled"`, and the button is neither `disabled` nor `aria-disabled` at the DOM
level), so a click looks identical to a real, working one and silently sends no request.

`/search`'s default sort ("Recommended") surfaces this shared QA account's **own**
listings prominently, and this same account is the one every other module in this repo
uses to create equipment — so `index=0` was reliably this account's own listing, not a
representative "someone else's listing" case. That is a test-data-selection gap, not an
application defect: nothing here needed the app to change.

**Fix (test-side):** `FavoriteActions` now resolves a listing the current account does
*not* own before any listing-card or detail-page interaction, instead of assuming
`index=0` — via `AuthApiClient.getCurrentAccountId()` (decodes the `aid` claim off the real
session JWT returned by NextAuth's own `/api/auth/session`, cookie-authenticated through
`page.request`) cross-referenced against the equipment search API's per-item `seller`
field. Two further, real environment quirks surfaced and were handled along the way:

- Favoriting/unfavoriting a card can itself reorder the "Recommended" list (confirmed
  live), so every listing-card lookup is title-scoped (`favoriteButtonForExactTitle`/
  `favoriteIconForExactTitle`), not index-scoped — a reorder never breaks which card gets
  interacted with. If the resolved title isn't rendered on the current page, the action
  filters `/search?searchText=<title>` down to it first.
- This shared QA catalog can hold two genuinely separate listings with an identical title
  (confirmed live, e.g. two distinct "Genie 1932 Scissor Lift" records) — a real data
  duplicate. Title-scoped locators pin to the first match rather than throwing a
  Playwright strict-mode violation, since any one instance of the title works.
- With `workers: 3` running scenarios concurrently against this same account, always
  picking the *first* eligible (non-owned) item made concurrent scenarios race to toggle
  the same real backend record. Each worker instead picks its own item, indexed by
  `test.info().parallelIndex` into the eligible pool sorted by the item's stable `_id`
  (not by "Recommended" rank, which can drift between two workers' calls).

TC1 (both variants), TC3, TC8, TC9, TC10, TC35, and TC36 are automated against this
resolved, genuinely-favoritable item and pass reliably (confirmed clean across multiple
full-module re-runs, including runs that hit the duplicate-title item above).

---

## 4. Test case decision matrix (all 44)

Legend: **Automate-P0** (smoke), **Automate-P1** (regression), **Automate-P2** (edge/mocked-
failure), **Rewrite** (real app differs — corrected expectation given above), **Consolidate**
(folded into another row — same mechanism, no distinct scenario built), **Clarify** (needs a
PM/QA decision or a not-yet-scaffolded flow), **Not automatable in this framework**.

| # | Title | Decision | Notes |
|---|---|---|---|
| 1 | Favorite Icon for Logged In Users | Automate-P0 | Icon swaps `star-outline`→`star-filled`; TC6's icon-asset assertion folded in here |
| 2 | Favorite Icon for Non-Logged In Users | Automate-P0 | Real modal confirmed, listing-card subtitle text asserted |
| 3 | Login Prompt for Existing Account | Automate-P0 | Real credentials → modal closes → item auto-favorited |
| 4 | Sign Up for New Users | **Clarify** | Real flow exists (`/user-type` → Buyer/Seller → further form) but no Signup page object is scaffolded in this repo; needs its own ticket |
| 5 | Forget Password Flow | **Clarify** | Real `/forgot-password` page confirmed to exist with a real form, but verifying the email-delivery loop is out of scope for this pass; needs its own ticket |
| 6 | Favorite Icon UI/UX | **Consolidate** → TC1 | Icon-asset swap is asserted as part of TC1; no `aria-pressed` exists to assert further (§3) |
| 7 | Edge Case - Invalid Session | Automate-P2 | Confirmed live via `clearCookies()` |
| 8 | Edge Case - Network Failure | Automate-P2 | Confirmed live: mocked 500 → real toast, icon unchanged |
| 9 | Edge Case - Duplicate Favorite | **Rewrite, Automate-P0** | Real behavior is a toggle-off, not a no-op (§3) |
| 10 | Edge Case - Rapid Clicks | **Rewrite, Automate-P1** | Asserts a consistent final state and no crash, not "no change" — rapid clicks are still real toggles |
| 11 | Mobile Testing - Favorite Icon | Automate-P1 | Confirmed present at 390×844 (msite feature) |
| 12 | Web Testing - Favorite Icon | **Consolidate** → TC1 | Same desktop coverage |
| 13 | Error Handling - API Failure | **Consolidate** → TC8 | Same mechanism |
| 14 | Validation - Invalid Email Format | **Rewrite, Automate-P0** | Real message: "Enter a valid email address"; also covers TC28/30/32 (§3) |
| 15 | Validation - Short Password | **Rewrite, Automate-P0** | Real message: "Password must be at least 8 characters" |
| 16 | Negative - Incorrect Password | **Rewrite, Automate-P0** | Real message confirmed verbatim, incl. the "attempts attempts" copy bug; also covers TC29/31/33 (§3) |
| 17 | Negative - Non-Existent Account | **Rewrite, Automate-P0** | Real message: "This account doesn't exist. Enter a different email address or Sign Up" |
| 18 | UI/UX - Login Screen | **Consolidate** → TC2/TC3 | Modal structure already exercised building those |
| 19 | UI/UX - Sign Up Screen | **Clarify** | Same blocker as TC4 |
| 20 | Regression - Favorite Icon | **Consolidate** | A passing P0/P1 run of this suite is this test |
| 21 | Regression - Login Functionality | **Consolidate** → TC3 | Same mechanism |
| 22 | Regression - Sign Up Functionality | **Clarify** | Depends on TC4 |
| 23 | Edge Case - Special Characters in Email | **Rewrite, Automate-P1** | `user+test@domain.com` confirmed accepted (valid shape), Sign In enables |
| 24 | Edge Case - Long Email Address | **Rewrite, Automate-P2** | Confirmed live: no cap, accepted |
| 25 | Edge Case - Long Password | **Rewrite, Automate-P2** | Confirmed live: no cap, accepted — built together with TC24 |
| 26 | Edge Case - Empty Email Field | **Rewrite, Automate-P0** | Sign In stays disabled (real mechanism, same family as TC14/15) |
| 27 | Edge Case - Empty Password Field | **Rewrite, Automate-P0** | Same mechanism |
| 28 | Edge Case - SQL Injection in Email Field | **Consolidate** → TC14 | Same client-side format check (§3) |
| 29 | Edge Case - SQL Injection in Password Field | **Consolidate** → TC16 | Same real-credentials flow (§3) |
| 30 | Edge Case - XSS in Email Field | **Consolidate** → TC14 | Confirmed live, same mechanism (§3) |
| 31 | Edge Case - XSS in Password Field | **Consolidate** → TC16 | Same mechanism |
| 32 | Edge Case - HTML Injection in Email Field | **Consolidate** → TC14 | Same mechanism |
| 33 | Edge Case - HTML Injection in Password Field | **Consolidate** → TC16 | Same mechanism |
| 34 | Edge Case - Large Number of Favorites | **Clarify** | No "My Favorites" list view was located/confirmed this pass; needs a PM/QA pointer to where favorited items are reviewed |
| 35 | Edge Case - Remove Favorite | **Rewrite, Automate-P0** | Confirmed live and real (§3) |
| 36 | Edge Case - State Persistence | Automate-P1 | Confirmed across a fresh, separate `/login` session |
| 37 | Edge Case - State Across Devices | **Consolidate** → TC36 | Same server-persisted mechanism; a literal second device isn't needed to prove it |
| 38 | Edge Case - After Deletion | **Clarify** | No listing-deletion automation exists in this repo |
| 39 | Edge Case - After Listing Expiry | **Clarify** | No mechanism to expire a listing on demand |
| 40 | Edge Case - After Account Deletion | **Not automatable in this framework** | No account-deletion/admin tooling in scope |
| 41 | Edge Case - After Password Change | **Clarify** | No change-password flow scaffolded |
| 42 | Edge Case - After Email Change | **Clarify** | No change-email flow scaffolded |
| 43 | Edge Case - After Account Suspension | **Not automatable in this framework** | Requires backend/admin action outside Playwright's reach |
| 44 | Edge Case - After Account Reactivation | **Not automatable in this framework** | Depends on TC43 |

### Summary

| Disposition | Count | TC#s |
|---|---|---|
| Automate-P0 | 11 | 1, 2, 3, 9, 14, 15, 16, 17, 26, 27, 35 |
| Automate-P1 | 6 | 10, 11, 23, 24 (built with 25), 25, 36 |
| Automate-P2 | 2 | 7, 8 |
| Consolidate | 13 | 6, 12, 13, 18, 20, 21, 28, 29, 30, 31, 32, 33, 37 |
| Clarify | 9 | 4, 5, 19, 22, 34, 38, 39, 41, 42 |
| Not automatable | 3 | 40, 43, 44 |

**19 real scenarios were built** covering all 19 Automate-dispositioned rows (P0+P1+P2 above,
with TC24/25 sharing one scenario) — every Consolidate row's intent is exercised as part of
the scenario it points to, nothing double-built. **12 test cases** are Clarify or Not
automatable, each with the specific real blocker found, not silently dropped.

---

## 5. Built file plan

```text
data/props/equipment-favorite.props.ts   — EquipmentFavoriteProps (invalid/edge input
                                            strings only; real credentials come from
                                            ENV.ADMIN_EMAIL/ADMIN_PASSWORD, same as
                                            LoginActions.loginAsAdmin())
data/testdata/equipment-favorite.json

tests/ui/pages/
  SearchResultsPage.ts      — extended: favoriteButton(index), favoriteIcon(index),
                               favoriteErrorToast, FAVORITE_MOCK_FAILURE_MESSAGE
  EquipmentDetailPage.ts    — extended: favoriteIcon (pairs with the existing
                               favoriteButton)
  LoginModalPage.ts         — new: the shared "Welcome Back" sign-in dialog

tests/ui/actions/
  FavoriteActions.ts        — new: click/assert on both surfaces, sign-in modal
                               interactions, mocked-failure and expired-session setup

tests/ui/step-definitions/
  equipment-favorite.steps.ts — new

tests/ui/features/web/equipment-favorite.feature   — desktop scenarios
tests/ui/features/msite/equipment-favorite.feature — TC11 mobile scenario
```

`FavoriteActions` is registered as a new fixture in `action.fixture.ts`, following this
repo's existing pattern for every other Actions class.
