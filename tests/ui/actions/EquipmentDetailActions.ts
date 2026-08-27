import { expect, type Page } from "@playwright/test";
import type { ActionDeps } from "../support/action-deps.js";
import type { ContactSellerFormProps, MinLengthContactProps } from "@data/props/index.js";
import { loadContactSellerValidationProps } from "@data/readers/index.js";
import { EquipmentDetailPage, DETAIL_FIELD_LABELS } from "../pages/EquipmentDetailPage.js";
import { ImageViewerModalPage } from "../pages/ImageViewerModalPage.js";
import { ContactSellerModalPage } from "../pages/ContactSellerModalPage.js";

/** Same 4 names confirmed live in both the compact quick-link cards (TC12) and the full Add-On Services cards (TC15). */
export const ADD_ON_SERVICE_NAMES = [
  "Equipment Financing",
  "Extended Warranty",
  "Freight & Delivery",
  "Pre-purchase Inspection",
] as const;

/**
 * `/search/<id>` equipment detail page — reached only via a result card's
 * "View Details" button (confirmed live; see
 * docs/requirements/equipment-listing-automation-requirements.md §3) and
 * its Image Viewer / Contact Seller dialogs. See
 * docs/requirements/equipment-detail-automation-requirements.md for the
 * live findings behind every assertion below.
 */
export class EquipmentDetailActions {
  private readonly detail: EquipmentDetailPage;
  private readonly imageViewer: ImageViewerModalPage;
  private readonly contactSeller: ContactSellerModalPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.detail = new EquipmentDetailPage(page, deps.uiSurface);
    this.imageViewer = new ImageViewerModalPage(page, deps.uiSurface);
    this.contactSeller = new ContactSellerModalPage(page, deps.uiSurface);
  }

  async assertBreadcrumbVisible(): Promise<void> {
    await this.detail.breadcrumb.expect.toBeVisible();
  }

  /** TC3 — confirmed live on the stable image listing (see requirements doc §4: video listings can fail to render). */
  async assertDetailSectionsVisible(): Promise<void> {
    await this.detail.askingPriceValue.expect.toBeVisible();
    for (const label of DETAIL_FIELD_LABELS) {
      await this.detail.fieldValue(label).expect.toBeVisible();
    }
    await this.detail.contactSellerButton.expect.toBeVisible();
  }

  /** TC4 — confirmed live: the selected thumbnail carries a `border-primary` class. */
  async assertFirstThumbnailSelected(): Promise<void> {
    await this.detail.thumbnailButton(1).expect.toBeVisible();
    const classAttr = await this.detail.thumbnailButton(1).attribute("class");
    expect(classAttr, "First thumbnail's class attribute").toContain("border-primary");
  }

  /** TC7 */
  async openImageViewer(): Promise<void> {
    await this.detail.openImageViewerButton.click();
  }

  async assertImageViewerVisible(): Promise<void> {
    await this.imageViewer.dialog.expect.toBeVisible();
  }

  /** TC9 */
  async closeImageViewer(): Promise<void> {
    await this.imageViewer.closeButton.click();
  }

  async assertImageViewerHidden(): Promise<void> {
    await this.imageViewer.dialog.expect.toBeHidden();
  }

  private async activeThumbnailIndex(): Promise<number> {
    const total = await this.imageViewer.allThumbnails.count();
    for (let index = 0; index < total; index++) {
      if ((await this.imageViewer.thumbnailByIndex(index).attribute("data-active")) === "true") {
        return index;
      }
    }
    throw new Error("No active lightbox thumbnail found");
  }

  private async assertActiveThumbnailIndex(expected: number): Promise<void> {
    expect(await this.activeThumbnailIndex(), "Active lightbox thumbnail index").toBe(expected);
  }

  /** TC5 — browsing forward updates the displayed/selected image. */
  async browseToNextImage(): Promise<void> {
    await this.imageViewer.nextImageButton.click();
  }

  async browseToPreviousImage(): Promise<void> {
    await this.imageViewer.previousImageButton.click();
  }

  async assertActiveImageIndex(expected: number): Promise<void> {
    await this.assertActiveThumbnailIndex(expected);
  }

  /**
   * TC8 — rewritten: confirmed live the modal is a circular carousel, not
   * bounds-disabled navigation (contradicts the sheet's "arrows disabled at
   * first/last image" premise, see requirements doc §4). Previous from the
   * first image wraps to the last image, and Next from the last image wraps
   * back to the first — neither arrow is ever disabled.
   */
  async assertPreviousWrapsFromFirstToLastImage(): Promise<void> {
    await this.assertActiveThumbnailIndex(0);
    await this.browseToPreviousImage();
    const total = await this.imageViewer.allThumbnails.count();
    await this.assertActiveThumbnailIndex(total - 1);
  }

  async assertNextWrapsFromLastToFirstImage(): Promise<void> {
    await this.browseToNextImage();
    await this.assertActiveThumbnailIndex(0);
  }

  /** TC10/TC26 — rewritten: confirmed live there is no separate count text; the thumbnail rail itself is the real count display. */
  async assertImageCount(expected: number): Promise<void> {
    await this.imageViewer.allThumbnails.expect.toHaveCount(expected);
  }

  /**
   * TC11 — rewritten to the real, confirmed anonymous-visitor state: Phone
   * Number and Store URL are never shown; "Login to view the seller's
   * details." replaces them (see requirements doc §4).
   */
  async assertSellerInfoVisible(): Promise<void> {
    await this.detail.sellerInfoHeading.expect.toBeVisible();
    await this.detail.sellerName.expect.toBeVisible();
    await this.detail.verifiedSellerBadge.expect.toBeVisible();
    await this.detail.loginToViewSellerDetailsLink.expect.toBeVisible();
  }

  /** TC12 — confirmed live: every quick-link card is a real `target="_blank"` anchor. */
  async assertQuickLinksOpenInNewTab(): Promise<void> {
    for (const name of ADD_ON_SERVICE_NAMES) {
      const target = await this.detail.quickLinkCard(name).attribute("target");
      expect(target, `Quick link "${name}" target attribute`).toBe("_blank");
    }
  }

  /** TC13 */
  async assertEquipmentDetailsSectionVisible(): Promise<void> {
    await this.detail.equipmentDetailsHeading.expect.toBeVisible();
  }

  /** TC14 */
  async assertFeaturesSectionVisible(): Promise<void> {
    await this.detail.featuresHeading.expect.toBeVisible();
  }

  /** TC15 — asserts presence only, not exact CTA copy: one card's real text is a confirmed content bug ("Get Pre-Appro88") — see requirements doc §4. */
  async assertAddOnServiceCtasVisible(): Promise<void> {
    for (const name of ADD_ON_SERVICE_NAMES) {
      await this.detail.addOnServiceCta(name).expect.toBeVisible();
    }
  }

  /** TC16 */
  async openContactSellerForm(): Promise<void> {
    await this.detail.contactSellerButton.click();
  }

  async assertContactSellerFormVisible(): Promise<void> {
    await this.contactSeller.dialog.expect.toBeVisible();
  }

  /** TC18 — confirmed live: Submit starts disabled; there is no submit-then-error flow. */
  async assertContactSubmitDisabled(): Promise<void> {
    await this.contactSeller.submitButton.expect.toBeDisabled();
  }

  async fillRequiredContactFields(props: ContactSellerFormProps): Promise<void> {
    await this.contactSeller.firstNameInput.fill(props.firstName);
    await this.contactSeller.emailInput.fill(props.email);
    await this.contactSeller.phoneInput.fill(props.phone);
  }

  async assertContactSubmitEnabled(): Promise<void> {
    await this.contactSeller.submitButton.expect.toBeEnabled();
  }

  /** TC19 — confirmed live real inline text: "Please enter valid email", shown after the field is blurred. */
  async fillContactEmail(email: string): Promise<void> {
    await this.contactSeller.emailInput.fill(email);
    await this.contactSeller.emailInput.run("Blur email field", (loc) => loc.blur());
  }

  async assertInvalidEmailMessageVisible(): Promise<void> {
    await this.contactSeller.invalidEmailMessage.expect.toBeVisible();
  }

  // --- BIDC-629 Contact Seller field-level validation, filtering, and edge cases ---
  // See docs/requirements/contact-seller-automation-requirements.md §2/§3 for the
  // live-confirmed behavior every method below asserts against.

  /** TC5 — confirmed live: Cancel closes the dialog; the detail page underneath was never left. */
  async cancelContactSellerForm(): Promise<void> {
    await this.contactSeller.cancelButton.click();
  }

  async assertContactSellerFormHidden(): Promise<void> {
    await this.contactSeller.dialog.expect.toBeHidden();
  }

  async fillContactFirstName(value: string): Promise<void> {
    await this.contactSeller.firstNameInput.fill(value);
  }

  async fillContactLastName(value: string): Promise<void> {
    await this.contactSeller.lastNameInput.fill(value);
  }

  async fillContactPhone(value: string): Promise<void> {
    await this.contactSeller.phoneInput.fill(value);
  }

  async fillContactMessage(value: string): Promise<void> {
    await this.contactSeller.messageInput.fill(value);
  }

  /** Fills First/Last/Email/Phone only — used where Last Name matters (e.g. the min-length case), unlike fillRequiredContactFields. */
  async fillContactSellerForm(props: MinLengthContactProps): Promise<void> {
    await this.contactSeller.firstNameInput.fill(props.firstName);
    await this.contactSeller.lastNameInput.fill(props.lastName);
    await this.contactSeller.emailInput.fill(props.email);
    await this.contactSeller.phoneInput.fill(props.phone);
  }

  /**
   * TC6/7/14/15/31/36/37/38/39 — confirmed live: First Name and Last Name
   * silently strip every character that isn't a letter or space as it is
   * typed (dots, digits, HTML/SQL/XSS symbols, diacritics, apostrophes).
   * There is no post-submit validation error for any of these — the
   * filtering itself is the real mechanism.
   */
  async assertFirstNameFilterCases(): Promise<void> {
    const { firstNameFilterCases } = loadContactSellerValidationProps();
    for (const { input, expected } of firstNameFilterCases) {
      await this.contactSeller.firstNameInput.clearAndFill(input);
      await this.contactSeller.firstNameInput.expect.toHaveValue(expected);
    }
  }

  async assertLastNameFilterCases(): Promise<void> {
    const { lastNameFilterCases } = loadContactSellerValidationProps();
    for (const { input, expected } of lastNameFilterCases) {
      await this.contactSeller.lastNameInput.clearAndFill(input);
      await this.contactSeller.lastNameInput.expect.toHaveValue(expected);
    }
  }

  /** TC9/TC13/TC16/TC32/TC35 — confirmed live: non-digit characters (dashes, "+", letters, spaces) are stripped as typed; no visible cap on digit count. */
  async assertPhoneFilterCases(): Promise<void> {
    const { phoneFilterCases } = loadContactSellerValidationProps();
    for (const { input, expected } of phoneFilterCases) {
      await this.contactSeller.phoneInput.clearAndFill(input);
      await this.contactSeller.phoneInput.expect.toHaveValue(expected);
    }
  }

  /** TC36 — confirmed live: Email (unlike First Name) trims leading/trailing whitespace via the native type="email" input. */
  async assertEmailSpacesTrimmed(): Promise<void> {
    const { emailWithSurroundingSpaces } = loadContactSellerValidationProps();
    await this.contactSeller.emailInput.clearAndFill(emailWithSurroundingSpaces.input);
    await this.contactSeller.emailInput.expect.toHaveValue(emailWithSurroundingSpaces.expected);
  }

  /** TC8/TC10/TC41/TC42 — confirmed live: the real inline "Please enter valid email" message appears only for a malformed/single-label/invalid-underscore domain, not for a valid address or a real subdomain. */
  async assertEmailValidationCases(): Promise<void> {
    const { emailValidationCases } = loadContactSellerValidationProps();
    for (const { email, expectError } of emailValidationCases) {
      await this.fillContactEmail(email);
      if (expectError) {
        await this.contactSeller.invalidEmailMessage.expect.toBeVisible();
      } else {
        await this.contactSeller.invalidEmailMessage.expect.toBeHidden();
      }
    }
  }

  /** TC12/TC13/TC40 — confirmed live: a 50-char name, a 15-digit phone, and a ~252-char email are all accepted in full with no truncation. */
  async assertBoundaryLengthFieldsAcceptFullInput(): Promise<void> {
    const boundaryFirstName = "A".repeat(50);
    const boundaryPhone = "1".repeat(15);
    const boundaryEmail = `${"a".repeat(240)}@example.com`;

    await this.contactSeller.firstNameInput.clearAndFill(boundaryFirstName);
    await this.contactSeller.firstNameInput.expect.toHaveValue(boundaryFirstName);

    await this.contactSeller.phoneInput.clearAndFill(boundaryPhone);
    await this.contactSeller.phoneInput.expect.toHaveValue(boundaryPhone);

    await this.contactSeller.emailInput.clearAndFill(boundaryEmail);
    await this.contactSeller.emailInput.expect.toHaveValue(boundaryEmail);
  }

  /** TC17 — confirmed live real default text: "Hi, I'm interested in the <Title>. Could you please provide more details?" */
  async assertContactMessageDefaultText(equipmentTitle: string): Promise<void> {
    await this.contactSeller.messageInput.expect.toHaveValue(
      `Hi, I'm interested in the ${equipmentTitle}. Could you please provide more details?`,
    );
  }

  /**
   * TC18 — confirmed live: `context.setOffline(true)` blocks the request at
   * the network layer before it ever reaches the reCAPTCHA-gated backend, so
   * this never creates a real lead (see requirements doc §1/§3).
   */
  async simulateOfflineContactSellerSubmit(): Promise<void> {
    await this.page.context().setOffline(true);
    await this.contactSeller.submitButton.click().catch(() => undefined);
  }

  /** Confirmed live: the dialog stays fully intact with no crash, no silent close, and no error text — restores connectivity afterward. */
  async assertContactSellerFormUnaffectedByOfflineSubmit(): Promise<void> {
    await this.contactSeller.dialog.expect.toBeVisible();
    await this.contactSeller.submitButton.expect.toBeEnabled();
    await this.page.context().setOffline(false);
  }

  /** TC28 — confirmed live: there is no dedicated reset control; Cancel + reopen clears all inputs and restores the default Message text. */
  async assertContactSellerFormReset(equipmentTitle: string): Promise<void> {
    await this.contactSeller.firstNameInput.expect.toHaveValue("");
    await this.assertContactMessageDefaultText(equipmentTitle);
  }

  /**
   * TC3/TC26 (partial) — confirmed live: opening the dialog via keyboard
   * auto-focuses the First Name field, then real Tab order is
   * Last → Email → Phone → Message. Full screen-reader coverage stays out
   * of scope for Playwright (see requirements doc §5, TC26).
   */
  async assertTabOrderThroughContactFields(): Promise<void> {
    const activeNameOnOpen = await this.page.evaluate(() => document.activeElement?.getAttribute("name") ?? null);
    expect(activeNameOnOpen, "Field focused when the Contact Seller dialog opens").toBe("first");

    const expectedTabOrder = ["last", "email", "phone", "message"];
    for (const expectedName of expectedTabOrder) {
      await this.page.keyboard.press("Tab");
      const activeName = await this.page.evaluate(() => document.activeElement?.getAttribute("name") ?? null);
      expect(activeName, `Tab stop expected to land on field "${expectedName}"`).toBe(expectedName);
    }
  }

  /** TC24 — keyboard-only slice; full screen-reader coverage is out of scope for Playwright (see requirements doc §6). */
  async activateContactSellerButtonViaKeyboard(): Promise<void> {
    await this.detail.contactSellerButton.run("Focus via keyboard", (loc) => loc.focus());
    await this.detail.contactSellerButton.run("Activate via Enter key", (loc) => loc.press("Enter"));
  }

  /** TC25 — light structural check: the two content-section headings share identical styling classes. */
  async assertSectionHeadingStylingConsistent(): Promise<void> {
    const equipmentDetailsClass = await this.detail.equipmentDetailsHeading.attribute("class");
    const featuresClass = await this.detail.featuresHeading.attribute("class");
    expect(featuresClass, "Features heading class vs Equipment Details heading class").toBe(
      equipmentDetailsClass,
    );
  }

  /** TC28 — confirmed live: this IS the default anonymous-visitor state, not a synthetic fixture (see requirements doc §4). */
  async assertMissingSellerContactDetailsForAnonymousVisitor(): Promise<void> {
    await this.detail.loginToViewSellerDetailsLink.expect.toBeVisible();
    await this.detail.businessExperienceField.waitForVisible();
    const businessExperienceText = await this.detail.businessExperienceField.text();
    expect(businessExperienceText.replace("Business Experience", "").trim()).toBe("-");
  }
}
