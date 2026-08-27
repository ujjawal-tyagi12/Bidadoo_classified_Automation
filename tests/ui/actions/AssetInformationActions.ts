import type { Page } from "@playwright/test";
import type { AssetInformationProps, CreateEquipmentProps } from "@data/props/index.js";
import { getOrCreateEquipmentProps } from "@data/factories/create-equipment.factory.js";
import type { ActionDeps } from "../support/action-deps.js";
import { AssetInformationPage } from "../pages/AssetInformationPage.js";

export class AssetInformationActions {
  private readonly assetInfo: AssetInformationPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.assetInfo = new AssetInformationPage(page, deps.uiSurface);
  }

  /** Generated once per scenario and cached on `state` — see `getOrCreateEquipmentProps`. */
  async getEquipmentProps(): Promise<CreateEquipmentProps> {
    return getOrCreateEquipmentProps(this.deps.state, { request: this.deps.request, logger: this.deps.logger });
  }

  /**
   * Fills every field present in `props`. Make/Model/Category are skipped
   * when their value is empty (rather than attempting to select a suggestion
   * or open a Category modal that stays disabled without them) — this lets
   * the same method drive both happy-path and single-field-empty negative
   * scenarios without a separate near-duplicate method per field.
   */
  async fillAssetInformation(props: AssetInformationProps): Promise<void> {
    if (props.referenceId) {
      await this.assetInfo.referenceIdInput.fill(props.referenceId);
    }
    await this.assetInfo.titleInput.fill(props.title);
    if (props.make) {
      await this.selectMake(props.make);
    }
    if (props.model) {
      await this.selectModel(props.model);
    }
    if (props.make && props.model && props.categoryPath.length > 0) {
      await this.selectCategory(props.categoryPath);
    }
    await this.assetInfo.yearInput.fill(props.year);
    if (props.serial) {
      await this.assetInfo.serialInput.fill(props.serial);
    }
    if (props.usageHours) {
      await this.assetInfo.usageHoursInput.fill(props.usageHours);
    }
    if (props.usageType) {
      await this.assetInfo.usageTypeDropdown.selectOption(props.usageType);
    }
  }

  async selectMake(make: string): Promise<void> {
    await this.assetInfo.makeInput.fill(make);
    await this.assetInfo.makeSuggestion(make).click();
  }

  async selectModel(model: string): Promise<void> {
    await this.assetInfo.modelInput.fill(model);
    await this.assetInfo.modelSuggestion(model).click();
  }

  /**
   * Opens the Category modal, expands each parent level in `path` in order,
   * selects the leaf, and submits. `path` runs top-level → leaf, e.g.
   * ["Construction Equipment", "Aerial Work Platforms", "Boom Lifts - Articulating"].
   */
  async selectCategory(path: string[]): Promise<void> {
    const leaf = path.at(-1);
    if (!leaf) {
      throw new Error("selectCategory requires a non-empty category path");
    }
    const parents = path.slice(0, -1);

    await this.assetInfo.categoryOpenButton.click();
    for (const parent of parents) {
      await this.assetInfo.categoryToggle(parent).click();
    }
    await this.assetInfo.categoryLeaf(leaf).click();
    await this.assetInfo.categorySubmitButton.click();
  }

  async assertCategoryButtonDisabled(): Promise<void> {
    await this.assetInfo.categoryOpenButton.expect.toBeDisabled();
  }

  async assertCategoryButtonEnabled(): Promise<void> {
    await this.assetInfo.categoryOpenButton.expect.toBeEnabled();
  }

  async assertDuplicateReferenceIdError(): Promise<void> {
    await this.assetInfo.duplicateReferenceIdError.expect.toBeVisible();
  }

  /** Used to confirm Edit Listing opened the wizard pre-filled with the real listing's data. */
  async assertTitleInputHasValue(expected: string): Promise<void> {
    await this.assetInfo.titleInput.expect.toHaveValue(expected);
  }

  /** For editing an existing listing's title in place (BIDC-298 §11) — `fillAssetInformation` assumes a full fresh form. */
  async updateTitle(title: string): Promise<void> {
    await this.assetInfo.titleInput.clearAndFill(title);
  }

  /** Confirmed live (BIDC-298 §13): read-only View Equipment mode disables the Category control. */
  async assertCategoryDisabled(): Promise<void> {
    await this.assetInfo.categoryButton.expect.toBeDisabled();
  }
}
