import { apiRequest, assertApiOk, type ApiDeps } from "@core/api";
import { ENDPOINTS } from "../endpoints.js";
import type { LoginRequestBody, LoginResponse } from "../data/auth.models.js";

export class AuthApiClient {
  constructor(private readonly deps: ApiDeps) {}

  /** Returns the bearer token the app itself attaches to every authenticated backend call. */
  async login(email: string, password: string): Promise<string> {
    const body: LoginRequestBody = { email, password, stayLoggedIn: false };
    const result = await apiRequest(this.deps).post(ENDPOINTS.auth.login).withBody(body).execute<LoginResponse>();
    assertApiOk(result, "AuthApiClient.login");
    return result.data.result.authToken;
  }
}
