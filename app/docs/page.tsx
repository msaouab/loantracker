import type { Metadata } from "next";
import { requireAdminOrRedirect } from "@/lib/session";
import { SwaggerViewer } from "@/components/docs/swagger-viewer";

export const metadata: Metadata = {
  title: "API Docs · Loan Tracker",
  description: "OpenAPI documentation for the Loan Tracker REST API",
};

export default async function DocsPage() {
  // Admin-only: the API spec is not exposed to anonymous or non-admin users.
  await requireAdminOrRedirect();
  return <SwaggerViewer />;
}
