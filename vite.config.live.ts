import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/wui/',
  define: {
    'import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_URL': JSON.stringify(process.env.VITE_NEXT_PUBLIC_SUPABASE_URL),
    'import.meta.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_NEXT_PUBLIC_SUPABASE_ANON_KEY)
  },
  build: {
    outDir: "live",
    emptyOutDir: true,
    sourcemap: false
  },
});
