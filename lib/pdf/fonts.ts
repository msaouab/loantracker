import path from "node:path";
import { Font } from "@react-pdf/renderer";
import type { AppLocale } from "@/lib/locale";

let registered = false;

export function ensurePdfFonts() {
  if (registered) {
    return;
  }

  Font.register({
    family: "NotoSans",
    src: path.join(process.cwd(), "assets/fonts/NotoSans-Regular.ttf"),
  });

  Font.register({
    family: "NotoSansArabic",
    src: path.join(process.cwd(), "assets/fonts/NotoSansArabic-Regular.ttf"),
  });

  registered = true;
}

export function getPdfFontFamily(locale: AppLocale) {
  return locale === "ar" ? "NotoSansArabic" : "NotoSans";
}
