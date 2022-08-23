import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    "process.env": process.env,
  },
  resolve: {
    alias: {
      'Peer': "simple-peer/simplepeer.min.js",
    },
  },
  server: {
    hmr: true,
  },
});
