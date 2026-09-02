import { apiRequest, assertApiOk, type ApiDeps } from "@core/api";
import { decodeJwtPayload } from "@core/utils";
import { ENDPOINTS } from "../endpoints.js";
import type { LoginRequestBody, LoginResponse, AuthSessionResponse, AppJwtPayload } from "../data/auth.models.js";

export class AuthApiClient {
  constructor(private readonly deps: ApiDeps) {}

  /** Returns the bearer token the app itself attaches to every authenticated backend call. */
  async login(email: string, password: string): Promise<string> {
    const body: LoginRequestBody = { email, password, stayLoggedIn: false };
    const result = await apiRequest(this.deps).post(ENDPOINTS.auth.login).withBody(body).execute<LoginResponse>();
    assertApiOk(result, "AuthApiClient.login");
    return result.data.result.authToken;
  }

  /**
   * Confirmed live: NextAuth's own `/api/auth/session` endpoint (cookie-authenticated,
   * no login call needed) returns this browser session's real `authToken` — its `aid`
   * claim matches the `seller` field on equipment search results exactly. Used to tell
   * "an equipment listing this same test account itself created" apart from a real,
   * independently-owned one, instead of assuming a UI badge like "Recently Added"
   * reliably implies non-ownership.
   *
   * Must be built with `page.request` (shares the browser context's cookies), not the
   * top-level `request` fixture — that one is a separate, cookie-less APIRequestContext,
   * so this call would see the endpoint's signed-out `{}` response even while the page
   * itself is logged in.
   *
   * Returns `null` for a signed-out visitor (no `user` in the session response) — there
   * is no "current account" to compare ownership against.
   */
  async getCurrentAccountId(): Promise<string | null> {
    const result = await apiRequest(this.deps).get(ENDPOINTS.authSession).execute<AuthSessionResponse>();
    assertApiOk(result, "AuthApiClient.getCurrentAccountId");
    if (!result.data.user) return null;
    return decodeJwtPayload<AppJwtPayload>(result.data.user.authToken).aid;
  }
}
