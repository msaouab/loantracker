import { apiOk } from "@/lib/api-response";
import { apiError } from "@/lib/error-response";
import { ActivityActions } from "@/lib/activity-log";
import {
  anonymizeStaleActivityPii,
  purgeExpiredActivityLogs,
} from "@/lib/activity-retention";
import { logActivitySafe } from "@/lib/activity-log-service";
import { prisma } from "@/lib/db";
import {
  purgeExpiredDeletedLoans,
  purgeExpiredRecoveredLoans,
} from "@/lib/loans-service";

async function getSystemActivityUserId() {
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return admin?.id ?? null;
}

type PurgeOutcome = {
  task: string;
  status: "fulfilled" | "rejected";
  count?: number;
  error?: string;
};

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return apiError("Unauthorized", 401);
  }

  const tasks = [
    { name: "purgedDeleted", run: purgeExpiredDeletedLoans },
    { name: "purgedRecovered", run: purgeExpiredRecoveredLoans },
    { name: "purgedActivityLogs", run: purgeExpiredActivityLogs },
    { name: "anonymizedPii", run: anonymizeStaleActivityPii },
  ] as const;

  const results = await Promise.allSettled(tasks.map((task) => task.run()));
  const outcomes: PurgeOutcome[] = [];
  const counts: Record<string, number> = {};

  for (let index = 0; index < tasks.length; index += 1) {
    const task = tasks[index];
    const result = results[index];

    if (result.status === "fulfilled") {
      counts[task.name] = result.value;
      outcomes.push({ task: task.name, status: "fulfilled", count: result.value });
    } else {
      const error =
        result.reason instanceof Error
          ? result.reason.message
          : "Unknown purge failure";
      outcomes.push({ task: task.name, status: "rejected", error });
    }
  }

  const userId = await getSystemActivityUserId();

  if (userId) {
    if ((counts.purgedDeleted ?? 0) > 0) {
      await logActivitySafe({
        userId,
        action: ActivityActions.LOANS_PURGED,
        summary: `Permanently removed ${counts.purgedDeleted} expired deleted loan${counts.purgedDeleted === 1 ? "" : "s"}`,
        entityType: "system",
        metadata: { count: counts.purgedDeleted, type: "deleted" },
      });
    }

    if ((counts.purgedRecovered ?? 0) > 0) {
      await logActivitySafe({
        userId,
        action: ActivityActions.RECOVERED_LOANS_PURGED,
        summary: `Permanently removed ${counts.purgedRecovered} expired recovered loan${counts.purgedRecovered === 1 ? "" : "s"}`,
        entityType: "system",
        metadata: { count: counts.purgedRecovered, type: "recovered" },
      });
    }
  }

  const hasFailures = outcomes.some((outcome) => outcome.status === "rejected");

  return apiOk(
    {
      ...counts,
      outcomes,
    },
    { status: hasFailures ? 207 : 200 }
  );
}
