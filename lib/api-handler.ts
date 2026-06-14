import { NextResponse } from "next/server";
import { AppError, ValidationError } from "@/lib/errors";
import { requireAdminUserId, requireUserId } from "@/lib/session";

type RouteContext<P> = { params: Promise<P> };

export function toErrorResponse(error: unknown): Response {
  if (error instanceof ValidationError) {
    return NextResponse.json({ error: error.fieldErrors }, { status: 400 });
  }
  if (error instanceof AppError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  console.error("Unhandled API error:", error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

export function withUser<P = Record<string, never>>(
  handler: (req: Request, userId: string, ctx: RouteContext<P>) => Promise<Response>
) {
  return async (req: Request, ctx: RouteContext<P>) => {
    try {
      return await handler(req, await requireUserId(), ctx);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

export function withAdmin<P = Record<string, never>>(
  handler: (req: Request, adminId: string, ctx: RouteContext<P>) => Promise<Response>
) {
  return async (req: Request, ctx: RouteContext<P>) => {
    try {
      return await handler(req, await requireAdminUserId(), ctx);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}
