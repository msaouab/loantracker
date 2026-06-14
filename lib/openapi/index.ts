import type { OpenAPIV3 } from "openapi-types";
import { authPaths } from "@/lib/openapi/paths/auth";
import { cronPaths } from "@/lib/openapi/paths/cron";
import { loanPaths } from "@/lib/openapi/paths/loans";
import {
  activityPaths,
  adminPaths,
  settingsPaths,
} from "@/lib/openapi/paths/misc";
import { schemas } from "@/lib/openapi/schemas";

export const openApiDocument: OpenAPIV3.Document = {
  openapi: "3.0.3",
  info: {
    title: "Loan Tracker API",
    version: "1.0.0",
    description: [
      "REST API for the Loan Tracker application.",
      "",
      "All JSON responses use a unified envelope:",
      "- Success: `{ \"success\": true, \"data\": ... }`",
      "- Error: `{ \"success\": false, \"error\": { \"message\", \"code\", \"fields?\" } }`",
      "",
      "Session auth uses the Auth.js cookie (`authjs.session-token`, or `__Host-authjs.session-token` in production).",
      "Sign in via `POST /api/auth/callback/credentials`, then call protected routes from the same browser session.",
    ].join("\n"),
  },
  servers: [{ url: "/", description: "Current host" }],
  tags: [
    { name: "Auth", description: "Registration, session, and sign-in/out" },
    { name: "Loans", description: "Loan portfolio (manager-only for active loans)" },
    { name: "Payments", description: "Loan payment history (manager-only)" },
    { name: "Activity", description: "Audit log for the signed-in user" },
    { name: "Settings", description: "Profile and password" },
    { name: "Admin · Users", description: "Admin user management" },
    { name: "Admin · Activity", description: "Cross-user audit log" },
    { name: "Cron", description: "Scheduled maintenance jobs" },
  ],
  paths: {
    ...authPaths,
    ...loanPaths,
    ...activityPaths,
    ...settingsPaths,
    ...adminPaths,
    ...cronPaths,
  },
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "authjs.session-token",
        description:
          "Auth.js session cookie. In secure deployments the name is prefixed with `__Host-`.",
      },
      cronBearer: {
        type: "http",
        scheme: "bearer",
        description: "Bearer token matching the `CRON_SECRET` environment variable.",
      },
    },
    schemas,
  },
};
