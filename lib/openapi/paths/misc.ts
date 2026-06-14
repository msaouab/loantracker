import type { OpenAPIV3 } from "openapi-types";
import {
  adminSecurity,
  createdResponse,
  errorResponses,
  okResponse,
  ref,
  sessionSecurity,
} from "@/lib/openapi/helpers";

const activityQuery: OpenAPIV3.ParameterObject[] = [
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "pageSize",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 20 },
  },
  {
    name: "category",
    in: "query",
    schema: {
      type: "string",
      enum: ["security", "loans", "payments", "account", "users"],
    },
    description: "Omit or use `all` for no category filter",
  },
];

export const activityPaths: OpenAPIV3.PathsObject = {
  "/api/activity": {
    get: {
      tags: ["Activity"],
      summary: "List activity for the current user",
      operationId: "listUserActivity",
      security: sessionSecurity,
      parameters: activityQuery,
      responses: {
        "200": okResponse(ref("ActivityList")),
        "401": errorResponses.Unauthorized,
      },
    },
  },
};

export const settingsPaths: OpenAPIV3.PathsObject = {
  "/api/settings/profile": {
    patch: {
      tags: ["Settings"],
      summary: "Update display name",
      operationId: "updateProfile",
      security: sessionSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("UpdateProfileRequest"),
          },
        },
      },
      responses: {
        "200": okResponse(ref("ProfileResponse")),
        "400": errorResponses.ValidationError,
        "401": errorResponses.Unauthorized,
      },
    },
  },
  "/api/settings/password": {
    patch: {
      tags: ["Settings"],
      summary: "Change password",
      operationId: "changePassword",
      security: sessionSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("ChangePasswordRequest"),
          },
        },
      },
      responses: {
        "200": okResponse(ref("SuccessFlag")),
        "400": errorResponses.ValidationError,
        "401": errorResponses.Unauthorized,
      },
    },
  },
};

const userIdParam: OpenAPIV3.ParameterObject = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
};

const adminErrors = {
  "401": errorResponses.Unauthorized,
  "403": errorResponses.Forbidden,
  "404": errorResponses.NotFound,
  "400": errorResponses.ValidationError,
};

export const adminPaths: OpenAPIV3.PathsObject = {
  "/api/admin/users": {
    get: {
      tags: ["Admin · Users"],
      summary: "List all users",
      operationId: "listUsers",
      security: adminSecurity,
      responses: {
        "200": okResponse({
          type: "object",
          required: ["users"],
          properties: {
            users: {
              type: "array",
              items: ref("User"),
            },
          },
        }),
        "401": errorResponses.Unauthorized,
        "403": errorResponses.Forbidden,
      },
    },
    post: {
      tags: ["Admin · Users"],
      summary: "Create a user",
      operationId: "createUser",
      security: adminSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("AdminCreateUserRequest"),
          },
        },
      },
      responses: {
        "201": createdResponse({
          type: "object",
          required: ["user"],
          properties: {
            user: ref("User"),
          },
        }),
        ...adminErrors,
      },
    },
  },
  "/api/admin/users/{id}": {
    get: {
      tags: ["Admin · Users"],
      summary: "Get manager profile and stats",
      operationId: "getAdminUser",
      security: adminSecurity,
      parameters: [userIdParam],
      responses: {
        "200": okResponse({
          type: "object",
          required: ["user", "stats"],
          properties: {
            user: ref("User"),
            stats: ref("DashboardStats"),
          },
        }),
        ...adminErrors,
      },
    },
    patch: {
      tags: ["Admin · Users"],
      summary: "Approve, freeze, or unfreeze a user",
      operationId: "updateUserStatus",
      security: adminSecurity,
      parameters: [userIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("AdminUserActionRequest"),
          },
        },
      },
      responses: {
        "200": okResponse({
          type: "object",
          required: ["user"],
          properties: {
            user: ref("User"),
          },
        }),
        ...adminErrors,
      },
    },
    delete: {
      tags: ["Admin · Users"],
      summary: "Delete a user",
      description: "Admins cannot delete their own account.",
      operationId: "deleteUser",
      security: adminSecurity,
      parameters: [userIdParam],
      responses: {
        "200": okResponse(ref("SuccessFlag")),
        ...adminErrors,
      },
    },
  },
  "/api/admin/users/{id}/profile": {
    patch: {
      tags: ["Admin · Users"],
      summary: "Update a manager profile",
      operationId: "adminUpdateUserProfile",
      security: adminSecurity,
      parameters: [userIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("AdminUpdateUserProfileRequest"),
          },
        },
      },
      responses: {
        "200": okResponse({
          type: "object",
          required: ["user"],
          properties: {
            user: ref("User"),
          },
        }),
        ...adminErrors,
      },
    },
  },
  "/api/admin/users/{id}/password": {
    patch: {
      tags: ["Admin · Users"],
      summary: "Reset a manager password",
      operationId: "adminResetUserPassword",
      security: adminSecurity,
      parameters: [userIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("AdminResetPasswordRequest"),
          },
        },
      },
      responses: {
        "200": okResponse({
          type: "object",
          required: ["user"],
          properties: {
            user: {
              allOf: [ref("User")],
              nullable: true,
            },
          },
        }),
        ...adminErrors,
      },
    },
  },
  "/api/admin/activity": {
    get: {
      tags: ["Admin · Activity"],
      summary: "List activity across all users",
      operationId: "listAdminActivity",
      security: adminSecurity,
      parameters: activityQuery,
      responses: {
        "200": okResponse(ref("ActivityList")),
        "401": errorResponses.Unauthorized,
        "403": errorResponses.Forbidden,
      },
    },
  },
};
