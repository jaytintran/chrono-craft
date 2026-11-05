import { Capacitor } from "@capacitor/core";
import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import { EdgeToEdge } from "@capawesome/capacitor-android-edge-to-edge-support";

const STATUS_BAR_COLORS = {
  light: "#ffffff",
  dark: "#0B0F17",
} as const;

export async function applyNativeTheme(theme: "light" | "dark") {
  if (!Capacitor.isNativePlatform()) return;

  const isDark = theme === "dark";

  try {
    // 1. Set the background first
    await EdgeToEdge.setStatusBarColor({
      color: STATUS_BAR_COLORS[theme],
    });

    // 2. Then set the icon style AFTER the background,
    //    so the plugin can't clobber it.
    //    Dark bg → Light icons; light bg → Dark icons.
    await SystemBars.setStyle({
      style: isDark ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
    });
  } catch (err) {
    console.warn("[nativeTheme] Failed to apply theme", err);
  }
}
