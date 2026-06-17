"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, Copy, Plus, RefreshCw, ShieldBan, Snowflake } from "lucide-react";
import { notifyError, notifySuccess } from "@/lib/toast";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { PresenceIndicator, PresenceTooltip } from "@/components/admin/presence-indicator";
import { PageHeader, PageHeaderAction } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchAdminUsers,
  updateAdminUser,
  type AdminUser,
} from "@/lib/admin-client";
import { formatDate, formatDateTime } from "@/lib/format";
import type { AppLocale } from "@/lib/locale";

function CopyEmailButton({ email }: { email: string }) {
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      notifySuccess(tc("emailCopied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      notifyError(error, tc("emailCopyFailed"));
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="shrink-0 text-muted-foreground"
          onClick={handleCopy}
          aria-label={tc("copyEmail")}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent sideOffset={6}>
        {copied ? tc("emailCopied") : tc("copyEmail")}
      </TooltipContent>
    </Tooltip>
  );
}

function StatusBadge({
  status,
  labels,
}: {
  status: AdminUser["status"];
  labels: { active: string; frozen: string; pending: string };
}) {
  if (status === "active") {
    return <Badge variant="secondary">{labels.active}</Badge>;
  }
  if (status === "frozen") {
    return <Badge variant="destructive">{labels.frozen}</Badge>;
  }
  return <Badge>{labels.pending}</Badge>;
}

export function UserTable() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const statusLabels = {
    active: t("statusActive"),
    frozen: t("statusFrozen"),
    pending: t("statusPending"),
  };
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<AdminUser | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data);
    } catch (error) {
      notifyError(error, t("failedLoadUsers"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;

    fetchAdminUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((error) => {
        if (!cancelled) {
          notifyError(error, t("failedLoadUsers"));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [t]);

  async function handleAction(
    userId: string,
    action: "approve" | "freeze" | "unfreeze"
  ) {
    setActionUserId(userId);
    try {
      await updateAdminUser(userId, action);
      notifySuccess(
        action === "approve"
          ? t("userApproved")
          : action === "freeze"
            ? t("userFrozen")
            : t("userUnfrozen")
      );
      await loadUsers();
    } catch (error) {
      notifyError(error, t("failedUpdateUser"));
    } finally {
      setActionUserId(null);
    }
  }

  const pendingCount = users.filter((user) => user.status === "pending").length;
  const activeCount = users.filter((user) => user.status === "active").length;
  const frozenCount = users.filter((user) => user.status === "frozen").length;

  return (
    <div className="space-y-4">
      <PageHeader
        title={t("userAccounts")}
        description={
          loading
            ? t("loadingUsers")
            : t("usersSummary", {
                total: users.length,
                pending: pendingCount,
                active: activeCount,
                frozen: frozenCount,
              })
        }
      >
        <PageHeaderAction
          label={tc("refresh")}
          icon={RefreshCw}
          variant="outline"
          onClick={loadUsers}
          disabled={loading}
        />
        <PageHeaderAction
          label={t("createUser")}
          icon={Plus}
          onClick={() => setCreateOpen(true)}
          className="shadow-sm shadow-primary/20"
        />
      </PageHeader>

      <div className="surface-card overflow-hidden">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("columnName")}</TableHead>
                <TableHead>{t("columnEmail")}</TableHead>
                <TableHead>{t("columnStatus")}</TableHead>
                <TableHead>{t("columnRegistered")}</TableHead>
                <TableHead>{t("columnLastLogin")}</TableHead>
                <TableHead>{t("columnLoans")}</TableHead>
                <TableHead className="text-end">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <TableRow key={index}>
                      {Array.from({ length: 7 }).map((__, cellIndex) => (
                        <TableCell key={cellIndex}>
                          <Skeleton className="h-5 w-full max-w-28" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : null}

              {!loading && users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {t("noUsers")}
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading
                ? users.map((user) => {
                    const isBusy = actionUserId === user.id;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <span className="inline-flex items-center gap-2">
                            <PresenceIndicator lastSeenAt={user.lastSeenAt} />
                            <Link
                              href={`/admin/users/${user.id}`}
                              className="hover:text-primary hover:underline"
                            >
                              {user.fullName}
                            </Link>
                          </span>
                          {user.isAdmin ? (
                            <Badge variant="outline" className="ms-2">
                              {t("badgeAdmin")}
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-1">
                            <span className="truncate">{user.email}</span>
                            <CopyEmailButton email={user.email} />
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} labels={statusLabels} />
                        </TableCell>
                        <TableCell>
                          {formatDate(user.createdAt, locale)}
                        </TableCell>
                        <TableCell>
                          <PresenceTooltip lastSeenAt={user.lastSeenAt}>
                            <span className="cursor-default">
                              {user.lastLoginAt
                                ? formatDateTime(user.lastLoginAt, locale)
                                : tc("never")}
                            </span>
                          </PresenceTooltip>
                        </TableCell>
                        <TableCell>{user.loanCount}</TableCell>
                        <TableCell className="text-end">
                          {user.isAdmin ? (
                            <span className="text-sm text-muted-foreground">
                              —
                            </span>
                          ) : (
                            <div className="flex justify-end gap-2">
                              {user.status === "pending" ? (
                                <Button
                                  size="sm"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleAction(user.id, "approve")
                                  }
                                >
                                  <Check className="me-1.5 h-3.5 w-3.5" />
                                  {tc("approve")}
                                </Button>
                              ) : null}

                              {user.status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() => handleAction(user.id, "freeze")}
                                >
                                  <Snowflake className="me-1.5 h-3.5 w-3.5" />
                                  {tc("freeze")}
                                </Button>
                              ) : null}

                              {user.status === "frozen" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() =>
                                    handleAction(user.id, "unfreeze")
                                  }
                                >
                                  <ShieldBan className="me-1.5 h-3.5 w-3.5" />
                                  {tc("unfreeze")}
                                </Button>
                              ) : null}

                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isBusy}
                                onClick={() => setUserToDelete(user)}
                              >
                                {tc("remove")}
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                : null}
            </TableBody>
          </Table>
      </div>

      <DeleteUserDialog
        open={!!userToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setUserToDelete(null);
          }
        }}
        userId={userToDelete?.id ?? null}
        fullName={userToDelete?.fullName}
        onDeleted={loadUsers}
      />

      <CreateUserDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => {
          notifySuccess(t("userCreated"));
          void loadUsers();
        }}
      />
    </div>
  );
}
