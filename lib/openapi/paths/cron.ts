import type { OpenAPIV3 } from "openapi-types";
import { cronSecurity, errorResponses, okResponse, ref } from "@/lib/openapi/helpers";

export const cronPaths: OpenAPIV3.PathsObject = {
  "/api/cron/purge-loans": {
    get: {
      tags: ["Cron"],
      summary: "Run retention purge jobs",
      description:
        "Permanently removes expired deleted/recovered loans and prunes old activity logs. Requires `Authorization: Bearer <CRON_SECRET>`. Returns HTTP 207 when one or more sub-tasks fail.",
      operationId: "purgeLoans",
      security: cronSecurity,
      responses: {
        "200": okResponse(ref("CronPurgeResponse"), "All purge tasks succeeded"),
        "207": okResponse(ref("CronPurgeResponse"), "One or more purge tasks failed"),
        "401": errorResponses.Unauthorized,
      },
    },
  },
};
