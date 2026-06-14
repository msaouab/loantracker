import { NextResponse } from "next/server";

/**
 * Unified API envelope.
 *
 * Success: { success: true, data: <payload> }
 * Error:   { success: false, error: { message, code, fields? } }
 *
 * The client `request()` helper unwraps `data` on success and throws an
 * `ApiRequestError` (carrying `message` + `fields`) on failure.
 */
export type ApiSuccess<T> = { success: true; data: T };
export type ApiErrorBody = {
  success: false;
  error: { message: string; code: string; fields?: Record<string, string[]> };
};

export function apiOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiSuccess<T>>({ success: true, data }, init);
}
