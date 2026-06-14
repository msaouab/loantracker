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

export async function request<T>(url: string, init: RequestInit, fallback: string): Promise<T> {
  const res = await fetch(url, init);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(extractApiError(data, fallback));
  return data as T;
}
