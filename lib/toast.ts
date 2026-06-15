import { toast } from "sonner";

export { toast };

export function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

export function notifyError(error: unknown, fallback: string) {
  toast.error(getErrorMessage(error, fallback));
}

export function notifySuccess(message: string) {
  toast.success(message);
}

export function notifyInfo(message: string) {
  toast.info(message);
}
