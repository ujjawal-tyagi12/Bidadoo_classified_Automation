import { BasePage } from "./BasePage.js";
import { surfaceLocator } from "@core/ui";

/**
 * Step 5 (final) of the Create New Listing wizard: image/video file upload
 * plus video links. The file input accepts
 * "image/jpeg,image/png,image,video/mp4" and `multiple`, hidden behind a
 * drag-and-drop zone. Video Link rows share the same (duplicated) id
 * "video-link" and "Remove link" aria-label per row — indexed via `.nth()`,
 * matching CLAUDE.md's allowance for dynamic-row composition.
 */
export class MediaUploadPage extends BasePage {
  get fileInput() {
    return surfaceLocator("Media file input")
      .asFileInput()
      .desktop((p) => p.locator("input[type='file']"))
      .build(this.page, this.surface);
  }

  /** The nth uploaded thumbnail's remove (×) button. */
  removeUploadedFileButton(index = 0) {
    return surfaceLocator(`Remove uploaded file #${index}`)
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Remove file" }).nth(index))
      .build(this.page, this.surface);
  }

  /** Inline banner Media Upload shows after a rejected file, e.g. "1 file(s) skipped: unsupported format." */
  get uploadFeedbackMessage() {
    return surfaceLocator("Upload feedback message")
      .desktop((p) => p.getByText(/file\(s\) skipped/i))
      .build(this.page, this.surface);
  }

  /** Distinct message shown when the 50-image cap is exceeded, e.g. "Only 50 images are allowed. 1 image(s) not added." */
  get maxImagesFeedbackMessage() {
    return surfaceLocator("Max images feedback message")
      .desktop((p) => p.getByText(/only 50 images are allowed/i))
      .build(this.page, this.surface);
  }

  videoLinkInput(index = 0) {
    return surfaceLocator(`Video Link input #${index}`)
      .asTextInput()
      .desktop((p) => p.locator("#video-link").nth(index))
      .build(this.page, this.surface);
  }

  /** Unindexed — for counting how many Video Link rows currently exist. */
  get videoLinkInputs() {
    return surfaceLocator("All Video Link inputs")
      .desktop((p) => p.locator("#video-link"))
      .build(this.page, this.surface);
  }

  removeVideoLinkButton(index = 0) {
    return surfaceLocator(`Remove video link #${index}`)
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Remove link" }).nth(index))
      .build(this.page, this.surface);
  }

  get addLinkButton() {
    return surfaceLocator("Add Link button")
      .asButton()
      .desktop((p) => p.getByRole("button", { name: "Add Link" }))
      .build(this.page, this.surface);
  }
}
