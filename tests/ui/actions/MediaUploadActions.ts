import type { Page } from "@playwright/test";
import type { ActionDeps } from "../support/action-deps.js";
import { MediaUploadPage } from "../pages/MediaUploadPage.js";

export class MediaUploadActions {
  private readonly mediaUpload: MediaUploadPage;

  constructor(
    private readonly page: Page,
    private readonly deps: ActionDeps,
  ) {
    this.mediaUpload = new MediaUploadPage(page, deps.uiSurface);
  }

  async uploadImages(paths: string[]): Promise<void> {
    await this.mediaUpload.fileInput.setFiles(paths);
  }

  async removeUploadedFile(index = 0): Promise<void> {
    await this.mediaUpload.removeUploadedFileButton(index).click();
  }

  async assertUploadRejected(): Promise<void> {
    await this.mediaUpload.uploadFeedbackMessage.expect.toBeVisible();
  }

  /**
   * The form always starts with one Video Link row already present (empty,
   * not created via "Add Link"). Fill that one directly on the first call;
   * only click "Add Link" once it — and every row after it — is occupied.
   */
  async addVideoLink(url: string): Promise<void> {
    const firstRowIsEmpty = (await this.mediaUpload.videoLinkInput(0).value()) === "";
    if (firstRowIsEmpty) {
      await this.mediaUpload.videoLinkInput(0).fill(url);
      return;
    }
    const rowCountBeforeAdding = await this.mediaUpload.videoLinkInputs.count();
    await this.mediaUpload.addLinkButton.click();
    await this.mediaUpload.videoLinkInput(rowCountBeforeAdding).fill(url);
  }

  async removeVideoLink(index = 0): Promise<void> {
    await this.mediaUpload.removeVideoLinkButton(index).click();
  }

  async assertImageStillUploaded(index = 0): Promise<void> {
    await this.mediaUpload.removeUploadedFileButton(index).expect.toBeVisible();
  }

  /** Fills the confirmed maximum of 5 Video Link rows — "Add Link" becomes disabled once reached. */
  async fillMaximumVideoLinks(baseUrl: string): Promise<void> {
    for (let i = 0; i < 5; i++) {
      await this.addVideoLink(`${baseUrl}${i}`);
    }
  }

  async assertAddLinkButtonDisabled(): Promise<void> {
    await this.mediaUpload.addLinkButton.expect.toBeDisabled();
  }

  /**
   * Uploads 51 copies of the same file in one `setFiles()` call — confirmed
   * live that the app counts entries rather than deduplicating by content, so
   * this reliably triggers the 50-image cap without needing 51 distinct assets.
   */
  async uploadOverMaximumImages(path: string): Promise<void> {
    await this.uploadImages(Array(51).fill(path));
  }

  async assertMaxImagesRejected(): Promise<void> {
    await this.mediaUpload.maxImagesFeedbackMessage.expect.toBeVisible();
  }
}
