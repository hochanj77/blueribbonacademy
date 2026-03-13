import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const fallbackProjectId = env.VITE_SUPABASE_PROJECT_ID || "xjdrfivpoakwzwmpdqfi";
  const resolvedSupabaseUrl =
    env.VITE_SUPABASE_URL || (fallbackProjectId ? `https://${fallbackProjectId}.supabase.co` : "");
  const resolvedPublishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqZHJmaXZwb2Frd3p3bXBkcWZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNzA0MjEsImV4cCI6MjA4NTc0NjQyMX0.v1lgAxbsIooRPaBxdFM8v-9wwpzp9yGWjuRMeLXwrDE";

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(resolvedSupabaseUrl),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(resolvedPublishableKey),
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});