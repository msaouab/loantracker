"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteAdminUser } from "@/lib/admin-client";
import { notifyError, notifySuccess } from "@/lib/toast";

type DeleteUserDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  fullName?: string;
  onDeleted?: () => void;
};

export function DeleteUserDialog({
  open,
  onOpenChange,
  userId,
  fullName,
  onDeleted,
}: DeleteUserDialogProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const [deleting, setDeleting] = useState(false);

  async function handleConfirm() {
    if (!userId) {
      return;
    }

    setDeleting(true);

    try {
      await deleteAdminUser(userId);
      onOpenChange(false);
      onDeleted?.();
      notifySuccess(fullName ? t("removedNamed", { name: fullName }) : t("userRemoved"));
    } catch (deleteError) {
      notifyError(deleteError, t("failedUpdateUser"));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive">
            <Trash2 />
          </AlertDialogMedia>
          <AlertDialogTitle>{t("deleteUserTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {fullName
              ? t("deleteUserDescriptionNamed", { name: fullName })
              : t("deleteUserDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>{tc("cancel")}</AlertDialogCancel>
          <Button
            variant="destructive"
            disabled={deleting || !userId}
            onClick={handleConfirm}
          >
            {deleting ? tc("removing") : t("removeUser")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
