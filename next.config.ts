import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from the server IP and domain
  allowedDevOrigins: ["31.220.31.19", "app.novaracorporation.com"],

  // Disable strict TypeScript checking temporarily
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },

  // Optional: Add headers for CORS if needed
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
