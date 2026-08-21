import type { APIRequestContext } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger.js";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";


export type ApiDeps = {
  request: APIRequestContext;
  logger?: TestLogger;
};

export type ApiRequest = {
  method: HttpMethod;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
};

export type ApiResult<T = unknown> = {
  status: number;
  ok: boolean;
  headers: Record<string, string>;
  data: T;
};


export function assertApiOk<T>(
  result: ApiResult<T>,
  context?: string,
): asserts result is ApiResult<T> & { ok: true } {
  if (!result.ok) {
    const label = context ? ` [${context}]` : "";
    throw new Error(
      `API request failed${label}: ${result.status} — ${JSON.stringify(result.data)}`,
    );
  }
}
