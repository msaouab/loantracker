import { z } from "zod";

export const registerSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

export const loanFieldsSchema = z.object({
  clientName: z.string().min(1, "Client name is required"),
  totalAmount: z.coerce
    .number()
    .int("Total amount must be a whole number")
    .positive("Total amount must be greater than 0"),
  loanDate: z.coerce.date().optional(),
  description: z.string().optional(),
  clientTrust: z.boolean(),
});

export const createLoanSchema = loanFieldsSchema.extend({
  amountPaid: z.coerce
    .number()
    .int("Amount paid must be a whole number")
    .min(0, "Amount paid cannot be negative"),
});

export const updateLoanSchema = loanFieldsSchema;

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;

export const loanPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .int("Payment amount must be a whole number")
    .positive("Payment amount must be greater than 0"),
  paidAt: z.coerce.date().optional(),
  note: z.string().optional(),
});

export type LoanPaymentInput = z.infer<typeof loanPaymentSchema>;

export const adminUserActionSchema = z.object({
  action: z.enum(["approve", "freeze", "unfreeze"]),
});

export const adminCreateUserSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isAdmin: z.boolean(),
});

export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUserAction = z.infer<typeof adminUserActionSchema>["action"];

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
