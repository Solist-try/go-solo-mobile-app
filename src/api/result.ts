export type ApiError = {
  code: "validation" | "unauthorized" | "forbidden" | "not_found" | "conflict" | "rate_limited" | "offline" | "unavailable" | "server";
  message: string;
};

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export function ok<T>(data: T): ApiResult<T> {
  return { ok: true, data };
}

export function fail<T = never>(code: ApiError["code"], message: string): ApiResult<T> {
  return { ok: false, error: { code, message } };
}

export const PAGE_SIZE = 30;
