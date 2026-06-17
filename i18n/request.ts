import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  isValidLocale,
  LOCALE_COOKIE,
  negotiateLocale,
  type AppLocale,
} from "@/lib/locale";

async function resolveLocale(): Promise<AppLocale> {
  const session = await auth();
  if (session?.user?.id) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { locale: true },
      });
      if (user && isValidLocale(user.locale)) {
        return user.locale;
      }
    } catch {
      // Stale Prisma client in dev can lack new fields until server restart.
    }
  }

  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  if (isValidLocale(cookieLocale)) {
    return cookieLocale;
  }

  const acceptLanguage = (await headers()).get("accept-language");
  return negotiateLocale(acceptLanguage);
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
