import type { OpenAPIV3 } from "openapi-types";
import {
  createdResponse,
  errorResponses,
  managerSecurity,
  okResponse,
  ref,
  sessionSecurity,
} from "@/lib/openapi/helpers";

const loanListQuery: OpenAPIV3.ParameterObject[] = [
  {
    name: "search",
    in: "query",
    schema: { type: "string" },
    description: "Filter by client name (partial match)",
  },
  {
    name: "dateFrom",
    in: "query",
    schema: { type: "string", format: "date" },
    description: "Inclusive start of loan date range",
  },
  {
    name: "dateTo",
    in: "query",
    schema: { type: "string", format: "date" },
    description: "Inclusive end of loan date range",
  },
  {
    name: "status",
    in: "query",
    schema: { type: "string", enum: ["active", "completed", "all"], default: "all" },
    description: "Derived loan status filter",
  },
  {
    name: "page",
    in: "query",
    schema: { type: "integer", minimum: 1, default: 1 },
  },
  {
    name: "pageSize",
    in: "query",
    schema: { type: "integer", enum: [10, 20, 50, 100], default: 10 },
  },
  {
    name: "sortBy",
    in: "query",
    schema: {
      type: "string",
      enum: [
        "clientName",
        "totalAmount",
        "amountPaid",
        "outstanding",
        "loanDate",
        "clientTrust",
      ],
      default: "loanDate",
    },
  },
  {
    name: "sortOrder",
    in: "query",
    schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
  },
];

const loanIdParam: OpenAPIV3.ParameterObject = {
  name: "id",
  in: "path",
  required: true,
  schema: { type: "string" },
};

const paymentIdParam: OpenAPIV3.ParameterObject = {
  name: "paymentId",
  in: "path",
  required: true,
  schema: { type: "string" },
};

const managerErrors = {
  "401": errorResponses.Unauthorized,
  "403": errorResponses.Forbidden,
  "404": errorResponses.NotFound,
  "400": errorResponses.ValidationError,
};

export const loanPaths: OpenAPIV3.PathsObject = {
  "/api/loans": {
    get: {
      tags: ["Loans"],
      summary: "List active loans",
      description: "Manager-only. Admins receive 403 because they do not own loans.",
      operationId: "listLoans",
      security: managerSecurity,
      parameters: loanListQuery,
      responses: {
        "200": okResponse({
          type: "object",
          required: ["loans", "pagination"],
          properties: {
            loans: {
              type: "array",
              items: ref("Loan"),
            },
            pagination: ref("Pagination"),
          },
        }),
        ...managerErrors,
      },
    },
    post: {
      tags: ["Loans"],
      summary: "Create a loan",
      operationId: "createLoan",
      security: managerSecurity,
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("CreateLoanRequest"),
          },
        },
      },
      responses: {
        "200": okResponse({
          type: "object",
          required: ["loan", "reopened"],
          properties: {
            loan: ref("Loan"),
            reopened: { type: "boolean" },
          },
        }),
        "201": createdResponse({
          type: "object",
          required: ["loan", "reopened"],
          properties: {
            loan: ref("Loan"),
            reopened: { type: "boolean", enum: [false] },
          },
        }),
        "409": errorResponses.Conflict,
        ...managerErrors,
      },
    },
  },
  "/api/loans/client-lookup": {
    get: {
      tags: ["Loans"],
      summary: "Look up a client name",
      description:
        "Manager-only. Returns whether a normalized client name is new, matches an active loan, or matches a recovered client (eligible for reopen).",
      operationId: "lookupClientName",
      security: managerSecurity,
      parameters: [
        {
          name: "clientName",
          in: "query",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": okResponse({
          type: "object",
          required: ["status"],
          properties: {
            status: { type: "string", enum: ["new", "active", "recovered"] },
            loanId: { type: "string" },
            clientName: { type: "string" },
          },
        }),
        ...managerErrors,
      },
    },
  },
  "/api/loans/deleted": {
    get: {
      tags: ["Loans"],
      summary: "List soft-deleted loans",
      description: "Any authenticated user (manager). Used for the deleted-loans recovery UI.",
      operationId: "listDeletedLoans",
      security: sessionSecurity,
      responses: {
        "200": okResponse({
          type: "object",
          required: ["loans"],
          properties: {
            loans: {
              type: "array",
              items: ref("Loan"),
            },
          },
        }),
        "401": errorResponses.Unauthorized,
      },
    },
  },
  "/api/loans/{id}": {
    get: {
      tags: ["Loans"],
      summary: "Get loan with payment history",
      operationId: "getLoan",
      security: managerSecurity,
      parameters: [loanIdParam],
      responses: {
        "200": okResponse({
          type: "object",
          required: ["loan"],
          properties: {
            loan: ref("Loan"),
          },
        }),
        ...managerErrors,
      },
    },
    put: {
      tags: ["Loans"],
      summary: "Update a loan",
      operationId: "updateLoan",
      security: managerSecurity,
      parameters: [loanIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("UpdateLoanRequest"),
          },
        },
      },
      responses: {
        "200": okResponse({
          type: "object",
          required: ["loan"],
          properties: {
            loan: ref("Loan"),
          },
        }),
        ...managerErrors,
      },
    },
    delete: {
      tags: ["Loans"],
      summary: "Soft-delete a loan",
      operationId: "deleteLoan",
      security: managerSecurity,
      parameters: [loanIdParam],
      responses: {
        "200": okResponse(ref("SuccessFlag")),
        ...managerErrors,
      },
    },
  },
  "/api/loans/{id}/statement": {
    get: {
      tags: ["Loans"],
      summary: "Download loan statement PDF",
      description:
        "Manager-only. Generates a localized PDF loan statement (relevé de prêt) for the owned loan, including payment history.",
      operationId: "downloadLoanStatement",
      security: managerSecurity,
      parameters: [loanIdParam],
      responses: {
        "200": {
          description: "PDF loan statement",
          content: {
            "application/pdf": {
              schema: { type: "string", format: "binary" },
            },
          },
        },
        ...managerErrors,
      },
    },
  },
  "/api/loans/{id}/restore": {
    post: {
      tags: ["Loans"],
      summary: "Restore a soft-deleted loan",
      operationId: "restoreLoan",
      security: sessionSecurity,
      parameters: [loanIdParam],
      responses: {
        "200": okResponse({
          type: "object",
          required: ["loan"],
          properties: {
            loan: ref("Loan"),
          },
        }),
        "401": errorResponses.Unauthorized,
        "404": errorResponses.NotFound,
      },
    },
  },
  "/api/loans/{id}/payments": {
    get: {
      tags: ["Payments"],
      summary: "List payments for a loan",
      operationId: "listLoanPayments",
      security: managerSecurity,
      parameters: [loanIdParam],
      responses: {
        "200": okResponse({
          type: "object",
          required: ["payments", "totalPaid", "outstanding"],
          properties: {
            payments: {
              type: "array",
              items: ref("LoanPayment"),
            },
            totalPaid: { type: "integer" },
            outstanding: { type: "integer" },
          },
        }),
        ...managerErrors,
      },
    },
    post: {
      tags: ["Payments"],
      summary: "Record a payment",
      operationId: "createLoanPayment",
      security: managerSecurity,
      parameters: [loanIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("LoanPaymentRequest"),
          },
        },
      },
      responses: {
        "201": createdResponse({
          type: "object",
          required: ["payment", "amountPaid", "outstanding"],
          properties: {
            payment: ref("LoanPayment"),
            amountPaid: { type: "integer" },
            outstanding: { type: "integer" },
          },
        }),
        ...managerErrors,
      },
    },
  },
  "/api/loans/{id}/payments/{paymentId}": {
    put: {
      tags: ["Payments"],
      summary: "Update a payment",
      operationId: "updateLoanPayment",
      security: managerSecurity,
      parameters: [loanIdParam, paymentIdParam],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: ref("LoanPaymentRequest"),
          },
        },
      },
      responses: {
        "200": okResponse({
          type: "object",
          required: ["payment", "amountPaid", "outstanding"],
          properties: {
            payment: ref("LoanPayment"),
            amountPaid: { type: "integer" },
            outstanding: { type: "integer" },
          },
        }),
        ...managerErrors,
      },
    },
    delete: {
      tags: ["Payments"],
      summary: "Delete a payment",
      operationId: "deleteLoanPayment",
      security: managerSecurity,
      parameters: [loanIdParam, paymentIdParam],
      responses: {
        "200": okResponse({
          type: "object",
          required: ["success", "amountPaid", "outstanding"],
          properties: {
            success: { type: "boolean", enum: [true] },
            amountPaid: { type: "integer" },
            outstanding: { type: "integer" },
          },
        }),
        ...managerErrors,
      },
    },
  },
};
