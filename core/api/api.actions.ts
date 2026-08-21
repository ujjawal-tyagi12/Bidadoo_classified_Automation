import type { APIRequestContext } from "@playwright/test";
import type { TestLogger } from "@core/logger/test-logger.js";
import type { ApiRequest, ApiResult } from "./types.js";

const normalizeQuery = (query?: ApiRequest["query"]) => {
  if (!query) return undefined;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    out[k] = String(v);
  }
  return out;
};

function logRequest(logger: TestLogger, req: ApiRequest): void {
  logger.info(`→ ${req.method} ${req.path}`);
  if (req.headers) {
    for (const [k, v] of Object.entries(req.headers)) {
      logger.info(`  Header: ${k}: ${v}`);
    }
  }
  if (req.query) {
    for (const [k, v] of Object.entries(req.query)) {
      if (v !== undefined && v !== null) logger.info(`  Query: ${k}=${v}`);
    }
  }
  if (req.body) {
    logger.info(`  Body: ${JSON.stringify(req.body)}`);
  }
}

function logResponse(logger: TestLogger, req: ApiRequest, status: number, ok: boolean, data: unknown): void {
  const label = ok ? "←" : "✗";
  logger.info(`${label} ${status} ${req.path}`);
  if (!ok) {
    logger.error(`  Response body: ${JSON.stringify(data)}`);
  }
}

export async function execute<T>(
  request: APIRequestContext,
  apiRequest: ApiRequest,
  logger?: TestLogger,
): Promise<ApiResult<T>> {
  const query = normalizeQuery(apiRequest.query);

  if (logger) logRequest(logger, apiRequest);

  const res = await request.fetch(apiRequest.path, {
    method: apiRequest.method,
    headers: apiRequest.headers,
    params: query,
    data: apiRequest.body,
  });

  const headers: Record<string, string> = {};
  for (const h of res.headersArray()) headers[h.name] = h.value;

  let data: unknown = null;
  const contentType = res.headers()["content-type"] ?? "";
  if (contentType.includes("application/json")) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (logger) logResponse(logger, apiRequest, res.status(), res.ok(), data);

  return {
    status: res.status(),
    ok: res.ok(),
    headers,
    data: data as T,
  };
}
