import { apiOk } from "@/lib/api-response";
import { withUser } from "@/lib/api-handler";
import { parseOrThrow } from "@/lib/errors";
import { setLocaleCookie } from "@/lib/locale-actions";
import { isValidLocale } from "@/lib/locale";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateLocaleSchema = z.object({
  locale: z.string().refine(isValidLocale, "Invalid locale"),
});

export const PATCH = withUser(async (req, userId) => {
  const input = parseOrThrow(updateLocaleSchema, await req.json());

  const user = await prisma.user.update({
    where: { id: userId },
    data: { locale: input.locale },
    select: { locale: true },
  });

  await setLocaleCookie(user.locale as "en" | "fr" | "ar");

  return apiOk({ locale: user.locale });
});
