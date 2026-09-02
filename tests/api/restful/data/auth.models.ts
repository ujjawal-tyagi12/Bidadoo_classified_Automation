export type LoginRequestBody = {
  email: string;
  password: string;
  stayLoggedIn: boolean;
};

export type LoginResponse = {
  statusCode: number;
  message: string;
  result: {
    authToken: string;
    refreshToken: string;
  };
};

/** NextAuth's `/api/auth/session` response shape — confirmed live. A signed-out visitor gets `{}` (no `user`, no `expires`). */
export type AuthSessionResponse = {
  user?: {
    authToken: string;
    refreshToken: string;
    provider: string;
  };
  expires?: string;
};

/** The claims this app's own `authToken`/`refreshToken` JWTs carry — confirmed live via a decoded token. */
export type AppJwtPayload = {
  tid: string;
  typ: string;
  /** The current account's id — matches the `seller` field on equipment search results. */
  aid: string;
  access: string;
  iat: number;
  exp: number;
};
