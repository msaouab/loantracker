import { getTranslations } from "next-intl/server";

export async function getErrorMessage(
  key:
    | "unauthorized"
    | "forbidden"
    | "notFound"
    | "validationFailed"
    | "internalError"
    | "malformedBody"
    | "conflict"
    | "loanNotFound"
    | "deletedLoanNotFound"
    | "paymentNotFound"
    | "userNotFound"
    | "emailRegistered"
    | "adminCannotModify"
    | "adminCannotView"
    | "adminCannotDelete"
) {
  const t = await getTranslations("errors");
  return t(key);
}
