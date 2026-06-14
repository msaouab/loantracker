import type { OpenAPIV3 } from "openapi-types";
import { errorResponses, okResponse, ref } from "@/lib/openapi/helpers";

export const authPaths: OpenAPIV3.PathsObject = {
  "/api/auth/register": {
    post: {
      tags: ["Auth"],
      summary: "Register a new manager account",
      description:
        "Creates a pending manager account. The user must be approved by an admin before signing in.",
      operationId: "registerUser",
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("RegisterRequest"),
          },
        },
      },
      responses: {
        "200": okResponse(ref("SuccessFlag"), "Account created (pending approval)"),
        "400": errorResponses.ValidationError,
        "409": {
          description: "Email already registered",
          content: {
            "application/json": {
              schema: ref("ApiValidationError"),
            },
          },
        },
      },
    },
  },
  "/api/auth/callback/credentials": {
    post: {
      tags: ["Auth"],
      summary: "Sign in with email and password",
      description:
        "Auth.js credentials callback. On success, sets the session cookie. Use the login form fields: `email`, `password`, and optional `rememberMe`.",
      operationId: "signInWithCredentials",
      requestBody: {
        required: true,
        content: {
          "application/x-www-form-urlencoded": {
            schema: {
              type: "object",
              required: ["email", "password"],
              properties: {
                email: { type: "string", format: "email" },
                password: { type: "string" },
                rememberMe: { type: "string", enum: ["true", "false", "on"] },
                csrfToken: { type: "string" },
              },
            },
          },
        },
      },
      responses: {
        "200": { description: "Sign-in succeeded; session cookie set" },
        "302": { description: "Redirect to login page on failure" },
        "401": { description: "Invalid credentials or inactive account" },
      },
    },
  },
  "/api/auth/signout": {
    post: {
      tags: ["Auth"],
      summary: "Sign out",
      description: "Clears the session cookie via Auth.js.",
      operationId: "signOut",
      security: [{ sessionCookie: [] }],
      responses: {
        "200": { description: "Signed out" },
        "302": { description: "Redirect after sign-out" },
      },
    },
  },
};
