import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * Step 2 of the Create New Listing wizard. Country/State/City are custom
 * dropdown buttons (not native <select>) that cascade: State is disabled
 * until Country is picked, City is disabled until Country + State are both
 * picked — see docs/requirements/create-equipment-automation-requirements.md §3.
 */
export class LocationPage extends BasePage {
  /** Real checkbox input is visually hidden (`sr-only`); the <label> is the real click target. */
  get usePreviousLocationToggle() {
    return surfaceLocator("Use Previous Location toggle")
      .asButton()
      .desktop((p) => p.locator("label", { hasText: "Use Previous Location" }))
      .build(this.page, this.surface);
  }

  get previousLocationsButton() {
    return surfaceLocator("Select from previous locations button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /select from previous locations/i }))
      .build(this.page, this.surface);
  }

  get countryButton() {
    return surfaceLocator("Select Country button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Select Country" }))
      .build(this.page, this.surface);
  }

  get stateButton() {
    return surfaceLocator("Select State/Province button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: /select state\/province/i }))
      .build(this.page, this.surface);
  }

  get cityButton() {
    return surfaceLocator("Select City button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Select City" }))
      .build(this.page, this.surface);
  }

  /** Shared search box inside whichever dropdown panel (State/City) is currently open. */
  get dropdownSearchInput() {
    return surfaceLocator("Location dropdown search input")
      .asTextInput()
      .desktop((p) => p.locator("input[placeholder='Search']"))
      .build(this.page, this.surface);
  }

  /** An option in whichever dropdown panel (Country/State/City/previous locations) is open. */
  dropdownOption(label: string) {
    return surfaceLocator(`Location dropdown option: ${label}`)
      .asButton()
      .desktop((p) => p.getByText(label, { exact: true }))
      .build(this.page, this.surface);
  }

  /** The open dropdown panel itself (Country/State/City/previous locations all render as role="listbox"). */
  get openDropdownListbox() {
    return surfaceLocator("Open location dropdown list")
      .desktop((p) => p.locator("[role='listbox']"))
      .build(this.page, this.surface);
  }
}
