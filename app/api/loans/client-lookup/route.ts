import { apiOk } from "@/lib/api-response";
import { withManager } from "@/lib/api-handler";
import { lookupClientByName } from "@/lib/loans-service";

export const GET = withManager(async (req, userId) => {
  const clientName = new URL(req.url).searchParams.get("clientName") ?? "";
  const result = await lookupClientByName(userId, clientName);
  return apiOk(result);
});
