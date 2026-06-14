export function computeRecoveredAt(
  amountPaid: number,
  totalAmount: number,
  current: Date | null
): Date | null {
  const isRecovered = amountPaid >= totalAmount;
  if (isRecovered) {
    return current ?? new Date();
  }
  return null;
}
