import { execute } from "./api.actions.js";
import type { ApiDeps, ApiRequest, ApiResult, HttpMethod } from "./types.js";
import type { TestLogger } from "@core/logger/test-logger.js";

type Query = ApiRequest["query"];
type Headers = NonNullable<ApiRequest["headers"]>;

type NoBodyMethod = "GET" | "DELETE";
type WithBodyMethod = Exclude<HttpMethod, NoBodyMethod>;

class RequestBuilderBase<M extends HttpMethod> {
  protected req: ApiRequest;

  constructor(
    protected readonly deps: ApiDeps,
    method: M,
    path: string,
  ) {
    this.req = { method, path };
  }

  withHeaders(headers: Headers) {
    this.req.headers = { ...(this.req.headers ?? {}), ...headers };
    return this;
  }

  withQuery(query: Query) {
    this.req.query = { ...(this.req.query ?? {}), ...(query ?? {}) };
    return this;
  }

  async execute<T>(): Promise<ApiResult<T>> {
    return execute<T>(this.deps.request, this.req, this.deps.logger);
  }
}

class RequestBuilderNoBody<M extends NoBodyMethod> extends RequestBuilderBase<M> {}

class RequestBuilderWithBody<M extends WithBodyMethod> extends RequestBuilderBase<M> {
  withBody<TBody = unknown>(body: TBody) {
    this.req.body = body;
    return this;
  }
}

class ApiRequestStart {
  constructor(private readonly deps: ApiDeps) {}

  get(path: string) {
    return new RequestBuilderNoBody(this.deps, "GET", path);
  }

  delete(path: string) {
    return new RequestBuilderNoBody(this.deps, "DELETE", path);
  }

  post(path: string) {
    return new RequestBuilderWithBody(this.deps, "POST", path);
  }

  put(path: string) {
    return new RequestBuilderWithBody(this.deps, "PUT", path);
  }

  patch(path: string) {
    return new RequestBuilderWithBody(this.deps, "PATCH", path);
  }
}

export function apiRequest(deps: ApiDeps) {
  return new ApiRequestStart(deps);
}
