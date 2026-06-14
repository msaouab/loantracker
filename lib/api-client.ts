export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors?: Record<string, string[]>
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

type ApiEnvelope = {
  success?: boolean;
  data?: unknown;
  error?: { message?: unknown; code?: unknown; fields?: unknown };
};

function parseFieldErrors(fields: unknown): Record<string, string[]> | undefined {
  if (!fields || typeof fields !== "object" || Array.isArray(fields)) {
    return undefined;
  }

  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(fields as Record<string, unknown>)) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      result[key] = value as string[];
    }
  }

  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * Fetch + unwrap the unified API envelope.
 * Returns `data` on success; throws `ApiRequestError` (message + field errors)
 * on any non-2xx response or `{ success: false }` body.
 */
export async function request<T>(
  url: string,
  init: RequestInit,
  fallback: string
): Promise<T> {
  const res = await fetch(url, init);
  const body = (await res.json().catch(() => null)) as ApiEnvelope | null;

  if (!res.ok || body?.success === false) {
    const error = body?.error;
    const message =
      error && typeof error.message === "string" ? error.message : fallback;
    throw new ApiRequestError(message, res.status, parseFieldErrors(error?.fields));
  }

  return body?.data as T;
}
