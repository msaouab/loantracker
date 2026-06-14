import { NextResponse } from "next/server";
import { withUser } from "@/lib/api-handler";
import { getDashboardStats } from "@/lib/dashboard";

export const GET = withUser(async (_req, userId) => {
  const stats = await getDashboardStats(userId);
  return NextResponse.json(stats);
});
