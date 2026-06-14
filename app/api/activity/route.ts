import { NextResponse } from "next/server";
import { withUser } from "@/lib/api-handler";
import { listActivitiesForUser } from "@/lib/activity-log-service";
import { parseActivityCategory } from "@/lib/activity-query";
import { parsePage, parsePageSize } from "@/lib/pagination";

export const GET = withUser(async (req, userId) => {
  const { searchParams } = new URL(req.url);
  const page = parsePage(searchParams.get("page"));
  const pageSize = parsePageSize(searchParams.get("pageSize"));
  const category = parseActivityCategory(searchParams.get("category"));

  const result = await listActivitiesForUser(userId, { page, pageSize, category });

  return NextResponse.json(result);
});
