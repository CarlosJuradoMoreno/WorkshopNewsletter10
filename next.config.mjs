import { PHASE_DEVELOPMENT_SERVER } from "next/constants.js";

/** @type {import('next').NextConfig} */
export default function nextConfig(phase) {
  const isPagesBuild = process.env.GITHUB_ACTIONS === "true";
  return {
    // Keep development assets isolated so a production build cannot invalidate
    // the CSS and JavaScript of an already-running local server.
    distDir: phase === PHASE_DEVELOPMENT_SERVER ? ".next-dev" : ".next",
    output: "export",
    trailingSlash: true,
    basePath: isPagesBuild ? "/WorkshopNewsletter10" : "",
    assetPrefix: isPagesBuild ? "/WorkshopNewsletter10/" : "",
  };
}
