"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { Check, Plus, RefreshCw, ShieldBan, Snowflake } from "lucide-react";
import { toast } from "sonner";
import { CreateUserDialog } from "@/components/admin/create-user-dialog";
import { DeleteUserDialog } from "@/components/admin/delete-user-dialog";
import { PageHeader, PageHeaderAction } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
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
import { ACCOUNT_STATUS_LABELS } from "@/lib/users";

function StatusBadge({ status }: { status: AdminUser["status"] }) {
  if (status === "active") {
    return <Badge variant="secondary">{ACCOUNT_STATUS_LABELS.active}</Badge>;
  }
  if (status === "frozen") {
    return <Badge variant="destructive">{ACCOUNT_STATUS_LABELS.frozen}</Badge>;
  }
  return <Badge>{ACCOUNT_STATUS_LABELS.pending}</Badge>;
}

export function UserTable() {
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
      toast.error(
        error instanceof Error ? error.message : "Failed to load users"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchAdminUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((error) => {
        if (!cancelled) {
          toast.error(
            error instanceof Error ? error.message : "Failed to load users"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleAction(
    userId: string,
    action: "approve" | "freeze" | "unfreeze"
  ) {
    setActionUserId(userId);
    try {
      await updateAdminUser(userId, action);
      toast.success(
        action === "approve"
          ? "User approved"
          : action === "freeze"
            ? "User frozen"
            : "User unfrozen"
      );
      await loadUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update user"
      );
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
        title="User accounts"
        description={
          loading
            ? "Loading users..."
            : `${users.length} user${users.length === 1 ? "" : "s"} · ${pendingCount} pending · ${activeCount} active · ${frozenCount} frozen`
        }
      >
        <PageHeaderAction
          label="Refresh"
          icon={RefreshCw}
          variant="outline"
          onClick={loadUsers}
          disabled={loading}
        />
        <PageHeaderAction
          label="Create user"
          icon={Plus}
          onClick={() => setCreateOpen(true)}
          className="shadow-sm shadow-primary/20"
        />
      </PageHeader>

      <div className="surface-card overflow-hidden">
        <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead>Loans</TableHead>
                <TableHead className="text-right">Actions</TableHead>
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
                    No users found.
                  </TableCell>
                </TableRow>
              ) : null}

              {!loading
                ? users.map((user) => {
                    const isBusy = actionUserId === user.id;

                    return (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="hover:text-primary hover:underline"
                          >
                            {user.fullName}
                          </Link>
                          {user.isAdmin ? (
                            <Badge variant="outline" className="ml-2">
                              Admin
                            </Badge>
                          ) : null}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <StatusBadge status={user.status} />
                        </TableCell>
                        <TableCell>
                          {format(new Date(user.createdAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          {user.lastLoginAt
                            ? format(
                                new Date(user.lastLoginAt),
                                "MMM d, yyyy h:mm a"
                              )
                            : "Never"}
                        </TableCell>
                        <TableCell>{user.loanCount}</TableCell>
                        <TableCell className="text-right">
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
                                  <Check className="mr-1.5 h-3.5 w-3.5" />
                                  Approve
                                </Button>
                              ) : null}

                              {user.status === "active" ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={isBusy}
                                  onClick={() => handleAction(user.id, "freeze")}
                                >
                                  <Snowflake className="mr-1.5 h-3.5 w-3.5" />
                                  Freeze
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
                                  <ShieldBan className="mr-1.5 h-3.5 w-3.5" />
                                  Unfreeze
                                </Button>
                              ) : null}

                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isBusy}
                                onClick={() => setUserToDelete(user)}
                              >
                                Remove
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
          toast.success("User created");
          void loadUsers();
        }}
      />
    </div>
  );
}
