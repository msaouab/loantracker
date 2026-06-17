import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { AppError, ConflictError, ValidationError } from "@/lib/errors";
import type { ApiErrorBody } from "@/lib/api-response";
import en from "@/messages/en.json";

async function errorT(key: keyof (typeof en)["errors"]) {
  try {
    const t = await getTranslations("errors");
    return t(key);
  } catch {
    return en.errors[key];
  }
}

function codeForStatus(status: number): string {
  switch (status) {
    case 400:
      return "bad_request";
    case 401:
      return "unauthorized";
    case 403:
      return "forbidden";
    case 404:
      return "not_found";
    case 409:
      return "conflict";
    case 500:
      return "internal_error";
    default:
      return "error";
  }
}

export function apiError(
  message: string,
  status: number,
  opts?: { code?: string; fields?: Record<string, string[]> }
) {
  const body: ApiErrorBody = {
    success: false,
    error: {
      message,
      code: opts?.code ?? codeForStatus(status),
      ...(opts?.fields ? { fields: opts.fields } : {}),
    },
  };
  return NextResponse.json<ApiErrorBody>(body, { status });
}

export async function toErrorResponse(error: unknown): Promise<Response> {
  if (error instanceof ValidationError) {
    return apiError(await errorT("validationFailed"), 400, {
      code: "validation_error",
      fields: error.fieldErrors,
    });
  }
  if (error instanceof ConflictError) {
    return apiError(error.message, 409, {
      code: "conflict",
      ...(error.fieldErrors ? { fields: error.fieldErrors } : {}),
    });
  }
  if (error instanceof AppError) {
    return apiError(error.message, error.status);
  }
  if (error instanceof SyntaxError) {
    return apiError(await errorT("malformedBody"), 400, { code: "bad_request" });
  }
  console.error("Unhandled API error:", error);
  return apiError(await errorT("internalError"), 500);
}
