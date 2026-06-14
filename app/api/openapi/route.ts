import { openApiDocument } from "@/lib/openapi";
import { getSession } from "@/lib/session";

export async function GET() {
  // Admin-only: don't disclose the API surface to anonymous or non-admin users.
  // Respond 404 so the endpoint's existence isn't revealed.
  const session = await getSession();
  if (!session?.user?.isAdmin) {
    return new Response("Not found", { status: 404 });
  }

  return Response.json(openApiDocument);
}
