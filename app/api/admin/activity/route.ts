import { apiOk } from "@/lib/api-response";
import { withAdmin } from "@/lib/api-handler";
import { listAllActivities } from "@/lib/activity-log-service";
import {
  parseActivityCategory,
  parseActivitySearch,
  parseActivityUserIds,
} from "@/lib/activity-query";
import { parsePage, parsePageSize } from "@/lib/pagination";
import { getManagerForAdmin } from "@/lib/users-service";

export const GET = withAdmin(async (req) => {
  const { searchParams } = new URL(req.url);
  const page = parsePage(searchParams.get("page"));
  const pageSize = parsePageSize(searchParams.get("pageSize"));
  const category = parseActivityCategory(searchParams.get("category"));
  const search = parseActivitySearch(searchParams.get("search"));
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const filterUserIds = parseActivityUserIds(searchParams.getAll("userId"));

  if (filterUserIds?.length) {
    await Promise.all(filterUserIds.map((id) => getManagerForAdmin(id)));
  }

  const result = await listAllActivities({
    page,
    pageSize,
    category,
    search,
    dateFrom,
    dateTo,
    userIds: filterUserIds,
    searchUserFields: true,
  });

  return apiOk(result);
});
