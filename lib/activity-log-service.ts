import { prisma } from "@/lib/db";
import type { Prisma } from "@/app/generated/prisma/client";
import type { ClientInfo } from "@/lib/client-info";
import {
  clientInfoToDeviceMetadata,
  deviceMetadataFromRecord,
  formatClientInfo,
  getClientInfo,
} from "@/lib/client-info";
import {
  ActivityActions,
  getActionsForTab,
  isSecurityActivity,
  type ActivityTab,
} from "@/lib/activity-log";
import { formatCurrency } from "@/lib/loans";

export type LogActivityInput = {
  userId: string;
  action: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  clientInfo?: ClientInfo;
};

type ActivityLogRecord = {
  id: string;
  userId: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  ipAddress: string | null;
  userAgent: string | null;
  browser: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  user?: { fullName: string; email: string };
};

function asMetadataRecord(value: Prisma.JsonValue | null): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function formatLoanActivitySummary(
  action: string,
  summary: string,
  metadata: Record<string, unknown> | null
) {
  if (
    action !== ActivityActions.LOAN_CREATED &&
    action !== ActivityActions.LOAN_DELETED
  ) {
    return summary;
  }

  const totalAmount = metadata?.totalAmount;
  const clientName = metadata?.clientName;
  if (typeof totalAmount !== "number" || typeof clientName !== "string") {
    return summary;
  }

  const formattedAmount = formatCurrency(totalAmount);
  if (summary.includes(formattedAmount)) {
    return summary;
  }

  const verb = action === ActivityActions.LOAN_CREATED ? "Created" : "Deleted";
  return `${verb} loan for ${clientName} (${formattedAmount})`;
}

function mergeActivityMetadata(
  metadata: Record<string, unknown> | undefined,
  clientInfo?: ClientInfo
): Prisma.InputJsonValue | undefined {
  const device = clientInfo ? clientInfoToDeviceMetadata(clientInfo) : null;
  const hasDevice = device
    ? Object.values(device).some((value) => value != null)
    : false;

  if (!metadata && !hasDevice) {
    return undefined;
  }

  return {
    ...(metadata ?? {}),
    ...(hasDevice ? { device } : {}),
  } as Prisma.InputJsonValue;
}

function buildClientInfoLabel(
  log: Pick<ActivityLogRecord, "ipAddress" | "userAgent" | "browser" | "metadata">
) {
  const device = deviceMetadataFromRecord(asMetadataRecord(log.metadata));

  return formatClientInfo({
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    browser: log.browser ?? device.browser ?? null,
    browserVersion: device.browserVersion ?? null,
    os: device.os ?? null,
    deviceType: device.deviceType ?? null,
    language: device.language ?? null,
  });
}

function buildSecuritySummaryForDisplay(log: ActivityLogRecord) {
  return log.action === ActivityActions.AUTH_LOGIN ? "Signed in" : "Password changed";
}

export function serializeActivity(
  log: ActivityLogRecord,
  loansById?: Map<string, { clientName: string; totalAmount: number }>
) {
  let metadata = asMetadataRecord(log.metadata);

  if (
    log.entityId &&
    loansById &&
    (log.action === ActivityActions.LOAN_CREATED ||
      log.action === ActivityActions.LOAN_DELETED) &&
    typeof metadata?.totalAmount !== "number"
  ) {
    const loan = loansById.get(log.entityId);
    if (loan) {
      metadata = {
        ...metadata,
        clientName: loan.clientName,
        totalAmount: loan.totalAmount,
      };
    }
  }

  const summary = isSecurityActivity(log.action)
    ? buildSecuritySummaryForDisplay(log)
    : formatLoanActivitySummary(log.action, log.summary, metadata);

  return {
    id: log.id,
    userId: log.userId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    summary,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    browser: log.browser,
    clientInfo: buildClientInfoLabel(log),
    metadata,
    createdAt: log.createdAt.toISOString(),
    actorName: log.user?.fullName ?? null,
    actorEmail: log.user?.email ?? null,
  };
}

async function serializeActivities(items: ActivityLogRecord[]) {
  const loanIds = [
    ...new Set(
      items
        .filter(
          (item) =>
            item.entityId &&
            (item.action === ActivityActions.LOAN_CREATED ||
              item.action === ActivityActions.LOAN_DELETED)
        )
        .map((item) => item.entityId as string)
    ),
  ];

  const loansById = new Map<string, { clientName: string; totalAmount: number }>();

  if (loanIds.length > 0) {
    const loans = await prisma.loan.findMany({
      where: { id: { in: loanIds } },
      select: { id: true, clientName: true, totalAmount: true },
    });

    for (const loan of loans) {
      loansById.set(loan.id, {
        clientName: loan.clientName,
        totalAmount: loan.totalAmount,
      });
    }
  }

  return items.map((item) => serializeActivity(item, loansById));
}

export async function logActivity(input: LogActivityInput) {
  await prisma.activityLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      summary: input.summary,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      metadata: mergeActivityMetadata(input.metadata, input.clientInfo),
      ipAddress: input.clientInfo?.ipAddress ?? null,
      userAgent: input.clientInfo?.userAgent ?? null,
      browser: input.clientInfo?.browser ?? null,
    },
  });
}

export async function logActivitySafe(input: LogActivityInput) {
  try {
    await logActivity(input);
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}

export function logActivityFromRequest(
  userId: string,
  req: Request,
  data: Omit<LogActivityInput, "userId" | "clientInfo">
) {
  return logActivitySafe({
    userId,
    ...data,
    clientInfo: getClientInfo(req),
  });
}

export function buildAuthSummary(
  action: typeof ActivityActions.AUTH_LOGIN | typeof ActivityActions.AUTH_PASSWORD_CHANGED
) {
  return action === ActivityActions.AUTH_LOGIN ? "Signed in" : "Password changed";
}

type ListActivitiesOptions = {
  page: number;
  pageSize: number;
  category?: ActivityTab;
};

function buildCategoryFilter(category?: ActivityTab) {
  if (!category || category === "all") {
    return {};
  }

  const actions = getActionsForTab(category);
  if (!actions?.length) {
    return {};
  }

  return { action: { in: actions } };
}

export async function listActivitiesForUser(userId: string, options: ListActivitiesOptions) {
  const where = {
    userId,
    ...buildCategoryFilter(options.category),
  };

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    activities: await serializeActivities(items),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages: Math.ceil(total / options.pageSize),
    },
  };
}

export async function listAllActivities(options: ListActivitiesOptions) {
  const where = buildCategoryFilter(options.category);

  const [items, total] = await Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (options.page - 1) * options.pageSize,
      take: options.pageSize,
      include: {
        user: {
          select: { fullName: true, email: true },
        },
      },
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    activities: await serializeActivities(items),
    pagination: {
      page: options.page,
      pageSize: options.pageSize,
      total,
      totalPages: Math.ceil(total / options.pageSize),
    },
  };
}
