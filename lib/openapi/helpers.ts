import type { OpenAPIV3 } from "openapi-types";

type Schema = OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject;
type Response = OpenAPIV3.ResponseObject;

export function ref(name: string): OpenAPIV3.ReferenceObject {
  return { $ref: `#/components/schemas/${name}` };
}

export function dataEnvelope(dataSchema: Schema): Schema {
  return {
    type: "object",
    required: ["success", "data"],
    properties: {
      success: { type: "boolean", enum: [true] },
      data: dataSchema,
    },
  };
}

export function okResponse(dataSchema: Schema, description = "Success"): Response {
  return {
    description,
    content: {
      "application/json": {
        schema: dataEnvelope(dataSchema),
      },
    },
  };
}

export function createdResponse(dataSchema: Schema, description = "Created"): Response {
  return okResponse(dataSchema, description);
}

export const errorResponses: Record<string, Response> = {
  Unauthorized: {
    description: "Missing or invalid session",
    content: {
      "application/json": {
        schema: ref("ApiError"),
      },
    },
  },
  Forbidden: {
    description: "Authenticated but not allowed for this resource",
    content: {
      "application/json": {
        schema: ref("ApiError"),
      },
    },
  },
  NotFound: {
    description: "Resource not found",
    content: {
      "application/json": {
        schema: ref("ApiError"),
      },
    },
  },
  ValidationError: {
    description: "Request body or query failed validation",
    content: {
      "application/json": {
        schema: ref("ApiValidationError"),
      },
    },
  },
};

export const sessionSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { sessionCookie: [] },
];

export const managerSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { sessionCookie: [] },
];

export const adminSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { sessionCookie: [] },
];

export const cronSecurity: OpenAPIV3.SecurityRequirementObject[] = [
  { cronBearer: [] },
];
