export const INITIAL_PAYMENT_NOTE = "__initial_balance__";
export const LEGACY_INITIAL_PAYMENT_NOTE = "Initial balance";

export function isInitialPaymentNote(note: string | null | undefined) {
  return note === INITIAL_PAYMENT_NOTE || note === LEGACY_INITIAL_PAYMENT_NOTE;
}

export function formatPaymentNote(
  note: string | null | undefined,
  initialBalanceLabel: string
) {
  if (!note) {
    return null;
  }

  if (isInitialPaymentNote(note)) {
    return initialBalanceLabel;
  }

  return note;
}
