import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * The enlarged image-preview dialog opened from the detail page's "Open
 * image viewer" button. Confirmed live: a real `role="dialog"` with a
 * "Close" aria-label and "Previous image" / "Next image" nav buttons — see
 * docs/requirements/equipment-detail-automation-requirements.md §2.
 */
export class ImageViewerModalPage extends BasePage {
  get dialog() {
    return surfaceLocator("Image viewer dialog")
      .desktop((p) => p.getByRole("dialog"))
      .build(this.page, this.surface);
  }

  get closeButton() {
    return surfaceLocator("Image viewer close button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Close" }))
      .build(this.page, this.surface);
  }

  get previousImageButton() {
    return surfaceLocator("Previous image button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Previous image" }))
      .build(this.page, this.surface);
  }

  get nextImageButton() {
    return surfaceLocator("Next image button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Next image" }))
      .build(this.page, this.surface);
  }

  /**
   * 0-based lightbox thumbnail — confirmed live real `id="lightbox-thumb-<n>"`
   * pattern, each carrying a `data-active="true"/"false"` attribute for the
   * currently-displayed image.
   */
  thumbnailByIndex(index: number) {
    return surfaceLocator(`Lightbox thumbnail #${index}`)
      .asButton()
      .desktop((p) => p.locator(`#lightbox-thumb-${index}`))
      .build(this.page, this.surface);
  }

  /**
   * All lightbox thumbnails. Confirmed live: there is no separate "+N more
   * images" count text anywhere in this modal — the thumbnail rail itself is
   * the only real count display (see requirements doc §4).
   */
  get allThumbnails() {
    return surfaceLocator("All lightbox thumbnails")
      .desktop((p) => p.locator('[id^="lightbox-thumb-"]'))
      .build(this.page, this.surface);
  }
}
