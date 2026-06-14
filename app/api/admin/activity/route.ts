import { NextResponse } from "next/server";
import { withAdmin } from "@/lib/api-handler";
import { listAllActivities } from "@/lib/activity-log-service";
import { parseActivityCategory } from "@/lib/activity-query";
import { parsePage, parsePageSize } from "@/lib/pagination";

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const page = parsePage(searchParams.get("page"));
  const pageSize = parsePageSize(searchParams.get("pageSize"));
  const category = parseActivityCategory(searchParams.get("category"));

  const result = await listAllActivities({ page, pageSize, category });

  return NextResponse.json(result);
});
