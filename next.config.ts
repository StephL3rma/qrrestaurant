import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow cross-origin requests from the server IP
  allowedDevOrigins: ["31.220.31.19"],

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
