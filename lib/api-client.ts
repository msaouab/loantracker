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

function extractFieldErrors(data: unknown): Record<string, string[]> | undefined {
  if (!data || typeof data !== "object" || !("error" in data)) {
    return undefined;
  }

  const error = (data as { error: unknown }).error;
  if (!error || typeof error !== "object" || Array.isArray(error)) {
    return undefined;
  }

  const entries = Object.entries(error as Record<string, unknown>);
  if (entries.length === 0) {
    return undefined;
  }

  const fieldErrors: Record<string, string[]> = {};
  for (const [key, value] of entries) {
    if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
      fieldErrors[key] = value;
    }
  }

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : undefined;
}

export function extractApiError(data: unknown, fallback: string): string {
  if (data && typeof data === "object" && "error" in data) {
    const err = (data as { error: unknown }).error;
    if (typeof err === "string") return err;
    if (err && typeof err === "object") {
      const first = Object.values(err as Record<string, string[]>)[0];
      if (Array.isArray(first) && first[0]) return first[0];
    }
  }
  return fallback;
}

export async function request<T>(
  url: string,
  init: RequestInit,
  fallback: string
): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiRequestError(
      extractApiError(data, fallback),
      res.status,
      extractFieldErrors(data)
    );
  }
  return data as T;
}
