export type UiSurface = "desktop" | "msite";

export function uiSurfaceFromPlaywrightProject(projectName: string): UiSurface {
  return projectName === "bdd-msite" ? "msite" : "desktop";
}
