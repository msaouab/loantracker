import type { OpenAPIV3 } from "openapi-types";

export const schemas: Record<string, OpenAPIV3.SchemaObject> = {
  ApiError: {
    type: "object",
    required: ["success", "error"],
    properties: {
      success: { type: "boolean", enum: [false] },
      error: {
        type: "object",
        required: ["message", "code"],
        properties: {
          message: { type: "string" },
          code: {
            type: "string",
            enum: [
              "bad_request",
              "unauthorized",
              "forbidden",
              "not_found",
              "conflict",
              "internal_error",
              "validation_error",
              "error",
            ],
          },
        },
      },
    },
  },
  ApiValidationError: {
    allOf: [
      { $ref: "#/components/schemas/ApiError" },
      {
        type: "object",
        properties: {
          error: {
            type: "object",
            properties: {
              fields: {
                type: "object",
                additionalProperties: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
    ],
  },
  Pagination: {
    type: "object",
    required: ["page", "pageSize", "total", "totalPages"],
    properties: {
      page: { type: "integer", minimum: 1 },
      pageSize: { type: "integer", minimum: 1 },
      total: { type: "integer", minimum: 0 },
      totalPages: { type: "integer", minimum: 0 },
    },
  },
  SuccessFlag: {
    type: "object",
    required: ["success"],
    properties: {
      success: { type: "boolean", enum: [true] },
    },
  },
  RegisterRequest: {
    type: "object",
    required: ["fullName", "email", "password", "confirmPassword"],
    properties: {
      fullName: { type: "string", minLength: 2 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      confirmPassword: { type: "string" },
    },
  },
  Loan: {
    type: "object",
    required: [
      "id",
      "clientName",
      "totalAmount",
      "amountPaid",
      "outstanding",
      "loanDate",
      "clientTrust",
      "createdAt",
      "updatedAt",
      "deletedAt",
      "recoveredAt",
    ],
    properties: {
      id: { type: "string" },
      clientName: { type: "string" },
      totalAmount: { type: "integer", description: "Whole MAD amount" },
      amountPaid: { type: "integer", description: "Whole MAD amount" },
      outstanding: { type: "integer", description: "Whole MAD amount" },
      loanDate: { type: "string", format: "date-time" },
      description: { type: "string", nullable: true },
      clientTrust: { type: "boolean" },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
      deletedAt: { type: "string", format: "date-time", nullable: true },
      recoveredAt: { type: "string", format: "date-time", nullable: true },
      paymentCount: { type: "integer", minimum: 0 },
      payments: {
        type: "array",
        items: { $ref: "#/components/schemas/LoanPayment" },
      },
    },
  },
  CreateLoanRequest: {
    type: "object",
    required: ["clientName", "totalAmount", "amountPaid", "clientTrust"],
    properties: {
      clientName: { type: "string", minLength: 1 },
      totalAmount: { type: "integer", minimum: 1 },
      amountPaid: { type: "integer", minimum: 0 },
      loanDate: { type: "string", format: "date-time" },
      description: { type: "string" },
      clientTrust: { type: "boolean" },
    },
  },
  UpdateLoanRequest: {
    type: "object",
    required: ["clientName", "totalAmount", "clientTrust"],
    properties: {
      clientName: { type: "string", minLength: 1 },
      totalAmount: { type: "integer", minimum: 1 },
      loanDate: { type: "string", format: "date-time" },
      description: { type: "string" },
      clientTrust: { type: "boolean" },
    },
  },
  LoanPayment: {
    type: "object",
    required: ["id", "loanId", "amount", "paidAt", "createdAt", "updatedAt"],
    properties: {
      id: { type: "string" },
      loanId: { type: "string" },
      amount: { type: "integer", minimum: 1 },
      paidAt: { type: "string", format: "date-time" },
      note: { type: "string", nullable: true },
      createdAt: { type: "string", format: "date-time" },
      updatedAt: { type: "string", format: "date-time" },
    },
  },
  LoanPaymentRequest: {
    type: "object",
    required: ["amount"],
    properties: {
      amount: { type: "integer", minimum: 1 },
      paidAt: { type: "string", format: "date-time" },
      note: { type: "string" },
    },
  },
  DashboardStats: {
    type: "object",
    required: [
      "totalClients",
      "totalLoanAmount",
      "amountRecovered",
      "outstanding",
      "activeCount",
      "recoveredCount",
      "ifAllRecovered",
      "recoveryRate",
      "trustDistribution",
      "recoveryProgress",
      "topClients",
      "updatedAt",
    ],
    properties: {
      totalClients: { type: "integer" },
      totalLoanAmount: { type: "integer" },
      amountRecovered: { type: "integer" },
      outstanding: { type: "integer" },
      activeCount: { type: "integer" },
      recoveredCount: { type: "integer" },
      ifAllRecovered: { type: "integer" },
      recoveryRate: { type: "number" },
      trustDistribution: {
        type: "object",
        required: ["trusted", "notTrusted"],
        properties: {
          trusted: { type: "integer" },
          notTrusted: { type: "integer" },
        },
      },
      recoveryProgress: {
        type: "object",
        required: ["recovered", "outstanding"],
        properties: {
          recovered: { type: "integer" },
          outstanding: { type: "integer" },
        },
      },
      topClients: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "amount"],
          properties: {
            name: { type: "string" },
            amount: { type: "integer" },
          },
        },
      },
      updatedAt: { type: "string", format: "date-time" },
      isAdminView: { type: "boolean" },
      activeUserCount: { type: "integer" },
    },
  },
  ActivityItem: {
    type: "object",
    required: ["id", "userId", "action", "summary", "createdAt"],
    properties: {
      id: { type: "string" },
      userId: { type: "string" },
      action: { type: "string" },
      entityType: { type: "string", nullable: true },
      entityId: { type: "string", nullable: true },
      summary: { type: "string" },
      ipAddress: { type: "string", nullable: true },
      userAgent: { type: "string", nullable: true },
      browser: { type: "string", nullable: true },
      clientInfo: { type: "string", nullable: true },
      metadata: {
        type: "object",
        nullable: true,
        additionalProperties: true,
      },
      createdAt: { type: "string", format: "date-time" },
      actorName: { type: "string", nullable: true },
      actorEmail: { type: "string", nullable: true },
    },
  },
  ActivityList: {
    type: "object",
    required: ["activities", "pagination"],
    properties: {
      activities: {
        type: "array",
        items: { $ref: "#/components/schemas/ActivityItem" },
      },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
  },
  UpdateProfileRequest: {
    type: "object",
    required: ["fullName"],
    properties: {
      fullName: { type: "string", minLength: 2 },
    },
  },
  ProfileResponse: {
    type: "object",
    required: ["fullName", "email"],
    properties: {
      fullName: { type: "string" },
      email: { type: "string", format: "email" },
    },
  },
  ChangePasswordRequest: {
    type: "object",
    required: ["currentPassword", "newPassword", "confirmPassword"],
    properties: {
      currentPassword: { type: "string", minLength: 1 },
      newPassword: { type: "string", minLength: 8 },
      confirmPassword: { type: "string" },
    },
  },
  User: {
    type: "object",
    required: [
      "id",
      "fullName",
      "email",
      "isAdmin",
      "isActivated",
      "isFrozen",
      "status",
      "createdAt",
      "lastLoginAt",
      "loanCount",
    ],
    properties: {
      id: { type: "string" },
      fullName: { type: "string" },
      email: { type: "string", format: "email" },
      isAdmin: { type: "boolean" },
      isActivated: { type: "boolean" },
      isFrozen: { type: "boolean" },
      status: { type: "string", enum: ["pending", "active", "frozen"] },
      createdAt: { type: "string", format: "date-time" },
      lastLoginAt: { type: "string", format: "date-time", nullable: true },
      loanCount: { type: "integer", minimum: 0 },
    },
  },
  AdminCreateUserRequest: {
    type: "object",
    required: ["fullName", "email", "password", "isAdmin"],
    properties: {
      fullName: { type: "string", minLength: 2 },
      email: { type: "string", format: "email" },
      password: { type: "string", minLength: 8 },
      isAdmin: { type: "boolean" },
    },
  },
  AdminUserActionRequest: {
    type: "object",
    required: ["action"],
    properties: {
      action: { type: "string", enum: ["approve", "freeze", "unfreeze"] },
    },
  },
  AdminUpdateUserProfileRequest: {
    type: "object",
    required: ["fullName", "email"],
    properties: {
      fullName: { type: "string", minLength: 2 },
      email: { type: "string", format: "email" },
    },
  },
  AdminResetPasswordRequest: {
    type: "object",
    required: ["newPassword", "confirmPassword"],
    properties: {
      newPassword: { type: "string", minLength: 8 },
      confirmPassword: { type: "string" },
    },
  },
  PurgeOutcome: {
    type: "object",
    required: ["task", "status"],
    properties: {
      task: { type: "string" },
      status: { type: "string", enum: ["fulfilled", "rejected"] },
      count: { type: "integer" },
      error: { type: "string" },
    },
  },
  CronPurgeResponse: {
    type: "object",
    required: ["outcomes"],
    properties: {
      purgedDeleted: { type: "integer" },
      purgedRecovered: { type: "integer" },
      purgedActivityLogs: { type: "integer" },
      anonymizedPii: { type: "integer" },
      outcomes: {
        type: "array",
        items: { $ref: "#/components/schemas/PurgeOutcome" },
      },
    },
  },
};
