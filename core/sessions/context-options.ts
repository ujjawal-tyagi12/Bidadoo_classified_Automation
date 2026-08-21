import type { BrowserContextOptions } from "@playwright/test";

const CONTEXT_OPTION_KEYS: Array<keyof BrowserContextOptions> = [
  "acceptDownloads",
  "baseURL",
  "bypassCSP",
  "colorScheme",
  "contrast",
  "deviceScaleFactor",
  "extraHTTPHeaders",
  "forcedColors",
  "geolocation",
  "hasTouch",
  "httpCredentials",
  "ignoreHTTPSErrors",
  "isMobile",
  "javaScriptEnabled",
  "locale",
  "offline",
  "permissions",
  "proxy",
  "reducedMotion",
  "serviceWorkers",
  "storageState",
  "timezoneId",
  "userAgent",
  "viewport",
];

export function contextOptionsFromUseConfig(
  useConfig: Partial<BrowserContextOptions>,
): BrowserContextOptions {
  const out: Record<string, unknown> = {};
  for (const key of CONTEXT_OPTION_KEYS) {
    const value = useConfig[key];
    if (value == null) continue;
    out[key] = value;
  }
  return out as BrowserContextOptions;
}
