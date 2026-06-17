import { getTranslations } from "next-intl/server";

export type ValidationMessages = {
  fullNameRequired: string;
  invalidEmail: string;
  passwordMin: string;
  passwordRequired: string;
  passwordsMismatch: string;
  clientNameRequired: string;
  totalAmountInt: string;
  totalAmountPositive: string;
  amountPaidInt: string;
  amountPaidNegative: string;
  amountPaidExceedsTotal: string;
  paymentAmountInt: string;
  paymentAmountPositive: string;
  currentPasswordRequired: string;
  currentPasswordIncorrect: string;
  newPasswordDifferent: string;
};

export async function getValidationMessages(): Promise<ValidationMessages> {
  const t = await getTranslations("validation");
  return {
    fullNameRequired: t("fullNameRequired"),
    invalidEmail: t("invalidEmail"),
    passwordMin: t("passwordMin"),
    passwordRequired: t("passwordRequired"),
    passwordsMismatch: t("passwordsMismatch"),
    clientNameRequired: t("clientNameRequired"),
    totalAmountInt: t("totalAmountInt"),
    totalAmountPositive: t("totalAmountPositive"),
    amountPaidInt: t("amountPaidInt"),
    amountPaidNegative: t("amountPaidNegative"),
    amountPaidExceedsTotal: t("amountPaidExceedsTotal"),
    paymentAmountInt: t("paymentAmountInt"),
    paymentAmountPositive: t("paymentAmountPositive"),
    currentPasswordRequired: t("currentPasswordRequired"),
    currentPasswordIncorrect: t("currentPasswordIncorrect"),
    newPasswordDifferent: t("newPasswordDifferent"),
  };
}
