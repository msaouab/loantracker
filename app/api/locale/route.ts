import { NextResponse } from "next/server";
import { setLocaleCookie } from "@/lib/locale-actions";
import { isValidLocale } from "@/lib/locale";
import { z } from "zod";

const bodySchema = z.object({
  locale: z.string().refine(isValidLocale, "Invalid locale"),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  await setLocaleCookie(parsed.data.locale);
  return NextResponse.json({ success: true, locale: parsed.data.locale });
}
