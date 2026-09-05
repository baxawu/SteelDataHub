"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ThemeProviderProps } from "next-themes/dist/types";

// Dark mode toggle (Section 32). Dùng next-themes, lưu preference trong
// localStorage — đây là "UI setting nhỏ", KHÔNG phải database chính, nên
// việc dùng localStorage ở đây là hợp lệ theo yêu cầu Section 2/24.
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
