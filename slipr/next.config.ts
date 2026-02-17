import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["cheerio", "pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
