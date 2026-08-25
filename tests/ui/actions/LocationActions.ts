import type { Page } from "@playwright/test";
import type { LocationProps } from "@data/props/index.js";
import type { ActionDeps } from "../support/action-deps.js";
import { LocationPage } from "../pages/LocationPage.js";

export class LocationActions {
  private readonly location: LocationPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.location = new LocationPage(page, deps.uiSurface);
  }

  /** Country → State → (optional) City, in that order — State/City are disabled until their predecessor is picked. */
  async fillLocation(props: LocationProps): Promise<void> {
    await this.selectCountry(props.country);
    await this.selectState(props.state);
    if (props.city) {
      await this.selectCity(props.city);
    }
  }

  async selectCountry(country: string): Promise<void> {
    await this.location.countryButton.click();
    await this.location.dropdownOption(country).click();
  }

  async selectState(state: string): Promise<void> {
    await this.location.stateButton.click();
    await this.location.dropdownSearchInput.fill(state);
    await this.location.dropdownOption(state).click();
  }

  async selectCity(city: string): Promise<void> {
    await this.location.cityButton.click();
    await this.location.dropdownSearchInput.fill(city);
    await this.location.dropdownOption(city).click();
  }

  async openPreviousLocations(): Promise<void> {
    await this.location.usePreviousLocationToggle.click();
    await this.location.previousLocationsButton.click();
  }

  async selectPreviousLocation(label: string): Promise<void> {
    await this.location.dropdownOption(label).click();
  }

  async assertPreviousLocationsListVisible(): Promise<void> {
    await this.location.openDropdownListbox.expect.toBeVisible();
  }
}
