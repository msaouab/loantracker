"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, type AppLocale } from "@/lib/locale";

export async function setLocaleCookie(locale: AppLocale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
}
