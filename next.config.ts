import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  outputFileTracingIncludes: {
    "/**/*": [
      "node_modules/.prisma/client/**/*",
      "node_modules/@prisma/client-runtime-utils/**/*",
    ],
  },
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/client-runtime-utils",
    "@prisma/adapter-pg",
  ],
};

export default nextConfig;
