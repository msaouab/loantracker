import { apiOk } from "@/lib/api-response";
import { withAdmin } from "@/lib/api-handler";
import { listActivitiesForUser } from "@/lib/activity-log-service";
import { parseActivityCategory } from "@/lib/activity-query";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { getManagerForAdmin } from "@/lib/users-service";

export const GET = withAdmin<{ id: string }>(async (req, _adminUserId, { params }) => {
  const { id } = await params;
  await getManagerForAdmin(id);

  const { searchParams } = new URL(req.url);
  const page = parsePage(searchParams.get("page"));
  const pageSize = parsePageSize(searchParams.get("pageSize"));
  const category = parseActivityCategory(searchParams.get("category"));

  const result = await listActivitiesForUser(id, {
    page,
    pageSize,
    category,
    includeIp: true,
  });

  return apiOk(result);
});
