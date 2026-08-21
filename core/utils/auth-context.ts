import type { Page } from "@playwright/test";

export type AuthContext = {
  token: string;
  deviceId: string;
};

let currentContext: AuthContext | null = null;

/**
 * Read `accessToken` and `device_id` from the browser's localStorage
 * and store them in the module-level auth context for API reuse.
 */
export async function captureAuthContext(page: Page): Promise<AuthContext> {
  const [token, deviceId] = await page.evaluate(() => {
    return [
      localStorage.getItem("accessToken"),
      localStorage.getItem("device_id"),
    ];
  });

  if (!token || !deviceId) {
    throw new Error(
      "Auth context capture failed — accessToken or device_id not found in localStorage",
    );
  }

  currentContext = { token, deviceId };
  return currentContext;
}

export function getAuthContext(): AuthContext {
  if (!currentContext) {
    throw new Error("Auth context not set. Call captureAuthContext after login.");
  }
  return currentContext;
}

export function clearAuthContext(): void {
  currentContext = null;
}
