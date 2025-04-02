import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/wui/',
  build: {
    outDir: "live",
    emptyOutDir: true,
    sourcemap: false
  },
});
