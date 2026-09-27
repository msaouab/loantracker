import { z } from "zod";
import { formatClientNameForStorage } from "@/lib/client-name";
import {
  getValidationMessages,
  type ValidationMessages,
} from "@/lib/validation-messages";

const defaultMessages: ValidationMessages = {
  fullNameRequired: "Full name is required",
  invalidEmail: "Invalid email address",
  passwordMin: "Password must be at least 8 characters",
  passwordRequired: "Password is required",
  passwordsMismatch: "Passwords do not match",
  clientNameRequired: "Client name is required",
  clientNameDuplicateActive: "You already have an active loan for this client.",
  clientNameTaken: "A client with this name already exists.",
  totalAmountInt: "Total amount must be a whole number",
  totalAmountPositive: "Total amount must be greater than 0",
  amountPaidInt: "Amount paid must be a whole number",
  amountPaidNegative: "Amount paid cannot be negative",
  amountPaidExceedsTotal: "Amount paid cannot exceed total amount",
  paymentAmountInt: "Payment amount must be a whole number",
  paymentAmountPositive: "Payment amount must be greater than 0",
  currentPasswordRequired: "Current password is required",
  currentPasswordIncorrect: "Current password is incorrect",
  newPasswordDifferent: "New password must be different from your current password",
};

export function createRegisterSchema(m: ValidationMessages) {
  return z
    .object({
      fullName: z.string().min(2, m.fullNameRequired),
      email: z.string().email(m.invalidEmail),
      password: z.string().min(8, m.passwordMin),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: m.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export function createLoginSchema(m: ValidationMessages) {
  return z.object({
    email: z.string().email(m.invalidEmail),
    password: z.string().min(1, m.passwordRequired),
    rememberMe: z.boolean().optional(),
  });
}

export function createLoanFieldsSchema(m: ValidationMessages) {
  return z.object({
    clientName: z
      .string()
      .transform((value) => formatClientNameForStorage(value))
      .pipe(z.string().min(1, m.clientNameRequired)),
    totalAmount: z.coerce
      .number()
      .int(m.totalAmountInt)
      .positive(m.totalAmountPositive),
    loanDate: z.coerce.date().optional(),
    description: z.string().optional(),
    clientTrust: z.boolean(),
  });
}

function optionalAmountPaid(m: ValidationMessages) {
  return z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? 0 : val),
    z.coerce.number().int(m.amountPaidInt).min(0, m.amountPaidNegative)
  );
}

export function createCreateLoanSchema(m: ValidationMessages) {
  return createLoanFieldsSchema(m)
    .extend({
      amountPaid: optionalAmountPaid(m),
    })
    .refine((data) => data.amountPaid <= data.totalAmount, {
      message: m.amountPaidExceedsTotal,
      path: ["amountPaid"],
    });
}

export function createUpdateLoanSchema(m: ValidationMessages) {
  return createLoanFieldsSchema(m);
}

export function createLoanPaymentSchema(m: ValidationMessages) {
  return z.object({
    amount: z.coerce
      .number()
      .int(m.paymentAmountInt)
      .positive(m.paymentAmountPositive),
    paidAt: z.coerce.date().optional(),
    note: z.string().optional(),
  });
}

export function createAdminCreateUserSchema(m: ValidationMessages) {
  return z.object({
    fullName: z.string().min(2, m.fullNameRequired),
    email: z.string().email(m.invalidEmail),
    password: z.string().min(8, m.passwordMin),
    isAdmin: z.boolean(),
  });
}

export function createAdminUpdateUserProfileSchema(m: ValidationMessages) {
  return z.object({
    fullName: z.string().min(2, m.fullNameRequired),
    email: z.string().email(m.invalidEmail),
  });
}

export function createAdminResetPasswordSchema(m: ValidationMessages) {
  return z
    .object({
      newPassword: z.string().min(8, m.passwordMin),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: m.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export function createUpdateProfileSchema(m: ValidationMessages) {
  return z.object({
    fullName: z.string().min(2, m.fullNameRequired),
  });
}

export function createChangePasswordSchema(m: ValidationMessages) {
  return z
    .object({
      currentPassword: z.string().min(1, m.currentPasswordRequired),
      newPassword: z.string().min(8, m.passwordMin),
      confirmPassword: z.string(),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: m.passwordsMismatch,
      path: ["confirmPassword"],
    });
}

export const adminUserActionSchema = z.object({
  action: z.enum(["approve", "freeze", "unfreeze"]),
});

export const registerSchema = createRegisterSchema(defaultMessages);
export const loginSchema = createLoginSchema(defaultMessages);
export const loanFieldsSchema = createLoanFieldsSchema(defaultMessages);
export const createLoanSchema = createCreateLoanSchema(defaultMessages);
export const updateLoanSchema = createUpdateLoanSchema(defaultMessages);
export const loanPaymentSchema = createLoanPaymentSchema(defaultMessages);
export const adminCreateUserSchema = createAdminCreateUserSchema(defaultMessages);
export const adminUpdateUserProfileSchema =
  createAdminUpdateUserProfileSchema(defaultMessages);
export const adminResetPasswordSchema = createAdminResetPasswordSchema(defaultMessages);
export const updateProfileSchema = createUpdateProfileSchema(defaultMessages);
export const changePasswordSchema = createChangePasswordSchema(defaultMessages);

export async function getRegisterSchema() {
  return createRegisterSchema(await getValidationMessages());
}
export async function getLoginSchema() {
  return createLoginSchema(await getValidationMessages());
}
export async function getCreateLoanSchema() {
  return createCreateLoanSchema(await getValidationMessages());
}
export async function getUpdateLoanSchema() {
  return createUpdateLoanSchema(await getValidationMessages());
}
export async function getLoanPaymentSchema() {
  return createLoanPaymentSchema(await getValidationMessages());
}
export async function getAdminCreateUserSchema() {
  return createAdminCreateUserSchema(await getValidationMessages());
}
export async function getAdminUpdateUserProfileSchema() {
  return createAdminUpdateUserProfileSchema(await getValidationMessages());
}
export async function getAdminResetPasswordSchema() {
  return createAdminResetPasswordSchema(await getValidationMessages());
}
export async function getUpdateProfileSchema() {
  return createUpdateProfileSchema(await getValidationMessages());
}
export async function getChangePasswordSchema() {
  return createChangePasswordSchema(await getValidationMessages());
}

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type LoanPaymentInput = z.infer<typeof loanPaymentSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUserAction = z.infer<typeof adminUserActionSchema>["action"];
export type AdminUpdateUserProfileInput = z.infer<typeof adminUpdateUserProfileSchema>;
export type AdminResetPasswordInput = z.infer<typeof adminResetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
