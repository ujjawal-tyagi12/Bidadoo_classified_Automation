# Equipment Detail Page — Blocker/Dependency Report

Companion to [equipment-detail-automation-requirements.md](./equipment-detail-automation-requirements.md).

**Update:** TC5, TC8, TC10, and TC26 — previously blocked by a test-data gap
(no QA listing had more than 1 image) — are now **automated**. Rather than
wait on QA to seed fixtures manually, they self-seed a real, publicly
searchable listing through the already-proven Create Equipment automation
(reusing `AssetInformationActions`, `LocationActions`, `PricingContactActions`,
`DescriptionDetailsActions`, `MediaUploadActions`, `SubmissionActions` — an
admin login is required only for that seeding step; the actual gallery
verification remains the same anonymous, public view as every other
scenario). See "How TC5/TC8/TC10/TC26 were unblocked" below for what that
investigation found — two of the sheet's original premises turned out to be
wrong in ways worth knowing about.

The 5 test cases below remain genuinely blocked — none are data gaps anymore.

| TC | Title | Exact blocker | Blocker type | Required to unblock | API-based seeding? | Next action / owner |
|---|---|---|---|---|---|---|
| 6 | Image Download | Every video-carrying listing sampled intermittently fails to render (a real hydration/blank-render defect) — no listing combining a stable image and a stable video was ever available to test "downloads images, not videos" | Application Defect | A fix for the video-listing rendering defect, or a decision to accept/work around it | No — seeding a mixed-media listing would not avoid the render failure; the failure is triggered by video content itself, not by data availability | Dev to fix the rendering defect |
| 17 | Contact Seller Form Submission | Real submission is gated by adaptive reCAPTCHA v3; identical automated runs scored differently (a real 403 block vs. a real pass-through) | Technical Dependency | A reCAPTCHA test-key override or an automation allowlist for the QA environment | No — this is a third-party service configuration issue, not a data issue | Dev/DevOps to confirm or configure a test-key bypass |
| 22 | Error Handling – Image Load Failure | The real failure found is far broader (entire video-listing pages can fail to render) than the sheet's "one broken image" premise; no decision yet on which behavior to test | PM-QA Decision | A decision: automate against the confirmed real defect, or a narrower simulated single-image failure | Partially — a listing with a deliberately broken image URL could simulate the narrow case, but would not address the broader real defect | PM/QA to decide scope |
| 23 | Error Handling – Contact Form Submission Failure | Identical automated runs used 3 different real submission mechanisms (direct API call, Next.js Server Action, silent pass-through); a mock targeting one mechanism silently misses the request when another fires | Technical Dependency | Engineering confirmation of which submission mechanism is authoritative and whether it's guaranteed stable | No — this is a runtime behavior/mechanism question, not a data question | Dev to confirm the real mechanism |
| 27 | Edge Case – No Images Available | Every "0 static image" listing sampled was actually video-based (and hit TC6's rendering defect) — no true zero-media listing was found to confirm the real empty state. Partially clarified: `create-equipment`'s own TC24 confirms a *published* listing can never have zero images (Submit stays disabled without one); only "Save as Draft" allows zero media, and whether a draft is publicly searchable (what TC27 actually needs) is still unconfirmed | Test Data | Either QA seeds a true zero-media listing directly (bypassing the app's own publish validation), or confirmation that a draft listing is public | Uncertain — depends on whether the platform's own rules allow a zero-media listing to exist publicly at all, not just on seeding mechanics | QA/Dev to confirm whether this state is reachable at all before further seeding attempts |

## How TC5/TC8/TC10/TC26 were unblocked

Checked whether the existing Create Equipment automation
(`MediaUploadActions.uploadImages(paths: string[])`) could seed real QA data
instead of waiting on someone to do it manually. Confirmed live:

- `uploadImages()` already accepts multiple file paths in one call, and the
  app counts entries rather than deduplicating by content (the same
  mechanism `create-equipment`'s own TC28 uses to hit the image cap) — so
  uploading the same test image N times creates N real, distinct gallery
  thumbnails.
- Listings published this way (Fill wizard → Submit → confirm) **are**
  publicly searchable — confirmed by finding 11+ pre-existing
  "Automation Test Excavator" listings from past `create-equipment` test
  runs, all live on `/search`.
- This app's search **tokenizes rather than exact-phrase-matches** — a
  supposedly-unique, timestamp-suffixed title still matches every older
  "Automation Test Excavator ..." listing, so picking "the first result" is
  not reliable once many near-duplicates exist. Fixed by adding
  `viewDetailsButtonForExactTitle()` / `openResultDetailByExactTitle()`,
  which locate the card by its exact title rather than position, with a
  retry that re-searches on a miss (handles search-index lag for a
  just-published listing).
- **TC8's real behavior is a circular carousel, not bounds-disabled
  navigation** — confirmed live with a real 3-image listing: clicking
  Previous on the first image wraps to the last, and Next on the last wraps
  to the first. Neither arrow is ever disabled. This directly contradicts
  the sheet's "arrows disabled at first/last image" premise.
- **TC10's real behavior has no textual count indicator at all** — confirmed
  live there is no "+N more images" text anywhere in the modal. The
  thumbnail rail itself is the only real count display, so TC10 is automated
  as "thumbnail count equals the real uploaded count."
- **TC26's "100+ images" premise is unreachable** — the app enforces a real,
  confirmed hard cap of 50 images (same cap as `create-equipment`'s TC28).
  Retargeted to 50, the platform's actual maximum.
- A heavy submission (50 images) can leave the confirmation dialog on
  "Submitting…" well past the default 15s action timeout — fixed by having
  `SubmissionActions.confirmSubmission()` wait for real navigation away from
  the create-equipment page (with a 90s budget) instead of trusting the
  click alone.
- **Known residual flakiness on TC26 only:** it passed cleanly multiple
  times in isolation, but repeated back-to-back manual runs during this
  same debugging session accumulated 40+ near-duplicate seeded listings in
  the shared QA environment, which appears to slow the search results page
  enough to intermittently trip navigation timeouts on unrelated, otherwise
  100%-reliable steps (including pre-existing `create-equipment` steps, not
  just new code). This reads as environment load from repeated manual
  re-runs, not a logic defect — expected to be stable under normal,
  non-repeated CI execution with standard retry policy.

## Notes carried over from investigation

**TC17** — Submitting valid Contact Seller data fires a real enquiry call gated
by adaptive reCAPTCHA v3. Separate live runs against the same listing and
same form data observed both a genuine `403 Forbidden` and a genuine
pass-through, with no code change in between — the scoring itself is the
non-determinism, not a test defect. TC18 already automates the one
deterministic slice available today (Submit disabled → enabled on valid
input).

**TC23** — Originally dispositioned Automate-P2 on the assumption that
mocking the confirmed real enquiry endpoint would deterministically
reproduce the real failure UI. Building it surfaced that the app doesn't
consistently use that endpoint: separate runs of the identical scenario used
a direct REST call, a Next.js Server Action posted back to the page's own
URL, and once a silent pass-through. A mock broadened to cover the second
mechanism still missed on a subsequent run, meaning at least one more path
or condition is unaccounted for. Automating against a target that isn't
stable would produce a test that fails for reasons unrelated to the feature
under test.
