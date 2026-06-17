import { toErrorResponse } from "@/lib/error-response";
import {
  requireAdminUserId,
  requireManagerUserId,
  requireUserId,
} from "@/lib/session";

export { toErrorResponse } from "@/lib/error-response";

type RouteContext<P> = { params: Promise<P> };

export function withUser<P = Record<string, never>>(
  handler: (req: Request, userId: string, ctx: RouteContext<P>) => Promise<Response>
) {
  return async (req: Request, ctx: RouteContext<P>) => {
    try {
      return await handler(req, await requireUserId(), ctx);
    } catch (error) {
      return await toErrorResponse(error);
    }
  };
}

export function withManager<P = Record<string, never>>(
  handler: (req: Request, userId: string, ctx: RouteContext<P>) => Promise<Response>
) {
  return async (req: Request, ctx: RouteContext<P>) => {
    try {
      return await handler(req, await requireManagerUserId(), ctx);
    } catch (error) {
      return await toErrorResponse(error);
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
      return await toErrorResponse(error);
    }
  };
}
