import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    // @ts-expect-error allowedDevOrigins is not yet in the type definition
    allowedDevOrigins: ["9fc391f6677b.ngrok-free.app"],
  },
};

export default nextConfig;
