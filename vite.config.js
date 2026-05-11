import { defineConfig } from "vite";
import { portfolioAdminAuthPlugin } from "./scripts/admin-auth-plugin.js";

export default defineConfig({
  root: "web",
  plugins: [portfolioAdminAuthPlugin()],
  server: {
    host: "127.0.0.1",
    port: 8878,
    strictPort: true,
    allowedHosts: ["portfolio.lawdigest.cloud", "lawdigest.cloud"],
    hmr: {
      protocol: "wss",
      host: "portfolio.lawdigest.cloud",
      clientPort: 443,
    },
  },
});
