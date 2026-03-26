import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
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
