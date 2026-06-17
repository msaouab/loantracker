"use client";

import { DirectionProvider } from "@radix-ui/react-direction";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

export function Providers({
  children,
  dir,
}: {
  children: React.ReactNode;
  dir: "ltr" | "rtl";
}) {
  // Radix primitives (menus, popovers, selects) read direction from this
  // context — not from <html dir> — for positioning and arrow-key navigation.
  return (
    <DirectionProvider dir={dir}>
      <ThemeProvider>
        {children}
        <Toaster />
      </ThemeProvider>
    </DirectionProvider>
  );
}
