import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.chronofocus.app",
  appName: "Chrono Focus",
  webDir: "dist",
  plugins: {
    SystemBars: {
      insetsHandling: "disable", // Disable built-in handling, let the plugin take over
    },
    EdgeToEdge: {
      // Set according to the header's light mode background color (your header is bg-white/90)
      // Or switch dynamically in code (see below)
    },
  },
};

export default config;
