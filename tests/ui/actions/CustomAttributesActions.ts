import { faker } from "@faker-js/faker";
import type { Page } from "@playwright/test";
import type { ActionDeps } from "../support/action-deps.js";
import { CustomAttributesPage } from "../pages/CustomAttributesPage.js";

const SHARED_DATA_KEY = "customAttributeName";
const SECOND_SHARED_DATA_KEY = "customAttributeName2";

export class CustomAttributesActions {
  private readonly attributes: CustomAttributesPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.attributes = new CustomAttributesPage(page, deps.uiSurface);
  }

  /**
   * No delete function exists in this app, so every test run permanently adds
   * to this seller account's attribute list — a fixed name would collide with
   * (and get silently rejected by, see the duplicate-name bug) a prior run's
   * leftover attribute. Generated once per scenario and cached on `state`,
   * same pattern as `getOrCreateEquipmentProps` in the Listings/Create
   * Equipment modules.
   */
  async getOrCreateAttributeName(): Promise<string> {
    const cached = this.deps.state.getSharedData<string>(SHARED_DATA_KEY);
    if (cached) return cached;
    const name = `Net Horsepower ${faker.string.alphanumeric(6).toUpperCase()}`;
    this.deps.state.setSharedData(SHARED_DATA_KEY, name);
    return name;
  }

  /**
   * Confirmed live: Attribute Name has the same 25-character limit as the
   * length-validation scenario, and it silently keeps the form unsubmittable
   * over that limit (no visible error on Edit) — appending a suffix like
   * " Updated" to the already ~21-22 character generated base name would
   * exceed it and silently fail to save. This derives a short, guaranteed-
   * under-the-limit updated name from the same random suffix instead.
   */
  async getOrCreateUpdatedAttributeName(): Promise<string> {
    const original = await this.getOrCreateAttributeName();
    const suffix = original.split(" ").pop();
    return `Updated ${suffix}`;
  }

  /** A second, independently-cached name — for scenarios that need two distinct attributes in play at once. */
  async getOrCreateSecondAttributeName(): Promise<string> {
    const cached = this.deps.state.getSharedData<string>(SECOND_SHARED_DATA_KEY);
    if (cached) return cached;
    const name = `Gross Torque ${faker.string.alphanumeric(6).toUpperCase()}`;
    this.deps.state.setSharedData(SECOND_SHARED_DATA_KEY, name);
    return name;
  }

  /** Full create flow (open form → fill Name → select Dropdown type → fill Value 1 → submit), for scenarios whose real subject is something downstream of a created attribute. */
  async createDropdownAttribute(name: string, value: string): Promise<void> {
    await this.clickNewCustomAttribute();
    await this.fillName(name);
    await this.selectType("Dropdown");
    await this.fillValue(1, value);
    await this.clickSubmit();
  }

  async openCustomAttributesDirectly(): Promise<void> {
    await this.deps.nav.goto("/dashboard?tab=attributes");
  }

  async clickNewCustomAttribute(): Promise<void> {
    await this.attributes.newAttributeButton.click();
  }

  async assertPaginationSummaryVisible(): Promise<void> {
    await this.attributes.paginationSummary.expect.toBeVisible();
  }

  async assertDefaultPageSizeIsTen(): Promise<void> {
    await this.attributes.rowsPerPageDropdown.expect.toHaveValue("10");
  }

  // --- Create / Edit form ---

  async fillName(name: string): Promise<void> {
    await this.attributes.nameInput.fill(name);
  }

  /**
   * Confirmed live: this form's validation (duplicate-name check, length check)
   * is debounced and blur-driven — clicking Submit immediately after a
   * clearAndFill (which doesn't itself blur) can silently submit against
   * stale validation state. Blurring after the update gives it a chance to
   * settle first, same as the required/length validation fixes above.
   *
   * Also confirmed live: the Edit form's fields populate asynchronously after
   * the route change lands — editing before that fetch resolves can have the
   * original value arrive moments later and silently overwrite the edit.
   * Waiting for the field to hold its original (non-empty) value first avoids
   * racing that populate.
   */
  async updateName(name: string): Promise<void> {
    await this.attributes.nameInput.expect.not.toHaveValue("");
    await this.attributes.nameInput.clearAndFill(name);
    await this.attributes.nameInput.press("Tab");
  }

  /**
   * Confirmed live: the "required" validation only fires once the field has
   * been genuinely touched (typed into, then cleared) and blurred — a bare
   * focus+blur on a field that was never typed into shows nothing.
   */
  async blurNameField(): Promise<void> {
    await this.attributes.nameInput.fill("x");
    await this.attributes.nameInput.clear();
    await this.attributes.nameInput.press("Tab");
  }

  /** Triggers the on-blur "exceeds 25 characters" validation — confirmed live. */
  async enterTooLongName(name: string): Promise<void> {
    await this.attributes.nameInput.fill(name);
    await this.attributes.nameInput.press("Tab");
  }

  async assertNameAlertVisible(text: string): Promise<void> {
    await this.attributes.nameAlert.expect.toHaveText(text);
  }

  /**
   * Confirmed live: shares the same click-registration race as every custom
   * dropdown in this app (see the Listings module's `filterByStatus`). Retried
   * the same way, verified against the trigger actually showing the chosen type.
   */
  async selectType(type: string): Promise<void> {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      const timeout = isLastAttempt ? 6000 : 1500;
      try {
        await this.attributes.typeDropdown.click();
        await this.attributes.typeOption(type).click();
        await this.attributes.typeDropdown.expect.toContainText(type, { timeout });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async fillValue(index: number, value: string): Promise<void> {
    await this.attributes.valueInput(index).fill(value);
  }

  async clickAddMoreValue(): Promise<void> {
    await this.attributes.addMoreValueButton.click();
  }

  async assertSubmitDisabled(): Promise<void> {
    await this.attributes.formSubmitButton.expect.toBeDisabled();
  }

  async assertSubmitEnabled(): Promise<void> {
    await this.attributes.formSubmitButton.expect.toBeEnabled();
  }

  async clickSubmit(): Promise<void> {
    await this.attributes.formSubmitButton.click();
  }

  async clickFormCancel(): Promise<void> {
    await this.attributes.formCancelButton.click();
  }

  async assertValueInputHidden(index: number): Promise<void> {
    await this.attributes.valueInput(index).expect.toBeHidden();
  }

  // --- List ---

  async assertAttributeVisible(name: string): Promise<void> {
    await this.attributes.attributeIdLink(name).expect.toBeVisible();
  }

  async assertAttributeNotVisible(name: string): Promise<void> {
    await this.attributes.attributeIdLink(name).expect.not.toBeVisible();
  }

  async assertRowStatusIs(name: string, status: string): Promise<void> {
    await this.attributes.rowStatusCell(name).expect.toContainText(status);
  }

  async clickAttributeId(name: string): Promise<void> {
    await this.attributes.attributeIdLink(name).click();
  }

  /** Shares the same open/close race as Listings' row action menu — retried the same way. */
  async openRowMenu(name: string): Promise<void> {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.attributes.rowMoreButton(name).click();
      const isLastAttempt = attempt === maxAttempts;
      try {
        await this.attributes.rowMoreMenu(name).expect.toBeVisible({
          timeout: isLastAttempt ? 6000 : 1500,
        });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  async clickRowMenuItem(name: string, label: string): Promise<void> {
    const maxAttempts = 5;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      try {
        if (attempt > 1) await this.openRowMenu(name);
        await this.attributes.rowMoreMenuItem(name, label).click({
          timeout: isLastAttempt ? 6000 : 1500,
        });
        return;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }
  }

  // --- Detail / View ---

  async assertDetailHeadingVisible(): Promise<void> {
    await this.attributes.detailHeading.expect.toBeVisible();
  }

  async assertDetailName(name: string): Promise<void> {
    await this.attributes.detailAttributeName.expect.toHaveText(name);
  }

  async assertDetailType(type: string): Promise<void> {
    await this.attributes.detailAttributeType.expect.toContainText(type);
  }

  async assertDetailStatus(status: string): Promise<void> {
    await this.attributes.detailStatus.expect.toHaveText(status);
  }

  async clickDetailEdit(): Promise<void> {
    await this.attributes.detailEditButton.click();
  }

  /**
   * Confirmed live: both Deactivate and Activate use the same trigger→confirm
   * dialog shape, and this is fully reversible test data (unlike Listings'
   * "Sell with bidadoo") so both directions are safe to complete. Shares the
   * same toggle race as everything else here — and confirmed live that
   * "the dialog closed" is too weak a success signal (same class of issue as
   * Listings' Clear all): the confirm click can close the dialog without the
   * underlying status actually changing.
   *
   * Also confirmed live: confirming redirects the browser to the list page
   * (`?tab=attributes`) rather than leaving it on the detail page — so the real
   * outcome can't be read from `detailStatus` until the detail page is
   * re-opened. Re-navigates there to verify the actual result instead of
   * trusting the dialog closing, or waiting on a locator that no longer exists
   * on the page the app landed on. The detail URL is captured only after the
   * toggle button's own click succeeds — capturing it any earlier (e.g. right
   * after clicking into the attribute from the list) reads a stale URL, since
   * this app's client-side routing hasn't updated `location` yet at that point.
   *
   * Only the trigger click is retried: it shares the same click-registration
   * race as this app's other custom dropdowns/menus (verified against the
   * dialog actually opening), but the confirm button inside an already-open
   * dialog has no such ambiguity, and the reload afterward is a normal one-time
   * page load, not a flaky race — retrying that whole reload+check on every
   * attempt (an earlier version of this method did) was expensive enough to
   * blow the test's 40s budget when a scenario calls this twice.
   *
   * Confirmed live: right after the detail page loads, this trigger button
   * briefly renders a default label (observed as "Activate") before the real
   * Status data arrives and it flips to match — clicking during that window
   * opens the wrong confirmation dialog (e.g. a "Deactivate" click landing on
   * the stale default opens an "Activate" dialog instead). Waiting for Status
   * to show one of its two real values first avoids clicking during that gap.
   */
  async toggleStatus(confirmLabel: "Deactivate" | "Activate"): Promise<void> {
    const expectedStatus = confirmLabel === "Deactivate" ? "Deactivated" : "Activated";
    await this.attributes.detailStatus.expect.toHaveText(/^(Activated|Deactivated)$/);
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const isLastAttempt = attempt === maxAttempts;
      const timeout = isLastAttempt ? 6000 : 2000;
      try {
        await this.attributes.detailStatusToggleButton.click({ timeout });
        await this.attributes.statusConfirmDialog.expect.toBeVisible({ timeout });
        break;
      } catch (error) {
        if (isLastAttempt) throw error;
      }
    }

    const detailUrl = this.page.url();
    await this.attributes.statusConfirmDialogButton(confirmLabel).click();
    await this.deps.nav.goto(detailUrl);
    await this.attributes.detailStatus.expect.toHaveText(expectedStatus, { timeout: 10000 });
  }

  /** A crash would leave the URL somewhere unexpected; staying on the dashboard confirms the input was handled safely. */
  async assertPageDidNotCrash(): Promise<void> {
    await this.deps.pageAssert.urlContains("/dashboard");
  }

  /**
   * Confirmed live (real app bug, see requirements doc §2): the backend correctly
   * rejects a duplicate Name+Type with a 422, but the frontend shows no visible
   * error at all. This asserts the sheet's expected behavior (a real, visible
   * duplicate-name error) so the scenario fails and documents the bug, rather
   * than silently asserting the broken behavior as if it were correct.
   */
  async assertDuplicateNameErrorShown(): Promise<void> {
    await this.attributes.nameAlert.expect.toBeVisible();
  }
}
