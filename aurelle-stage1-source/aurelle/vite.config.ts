import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// BASE_PATH is only needed when the app is served from a sub-folder, for example
// GitHub Pages project sites (BASE_PATH=/your-repo-name/ npm run build).
// On a custom domain or on Netlify / Cloudflare Pages / Vercel, leave it unset.
export default defineConfig({
  base: process.env.BASE_PATH ?? "/",
  plugins: [react()],
});
