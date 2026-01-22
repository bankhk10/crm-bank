import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Remove images domain config if using Cloudinary
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
