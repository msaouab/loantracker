import { z } from "zod";

export class AppError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = new.target.name;
  }
}
export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized") { super(message, 401); }
}
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden") { super(message, 403); }
}
export class NotFoundError extends AppError {
  constructor(message = "Not found") { super(message, 404); }
}
export class ValidationError extends AppError {
  // Shape mirrors zod's flatten().fieldErrors so existing client extraction keeps working.
  constructor(readonly fieldErrors: Record<string, string[]>, message = "Validation failed") {
    super(message, 400);
  }
}

export function parseOrThrow<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.flatten().fieldErrors as Record<string, string[]>);
  }
  return result.data;
}
