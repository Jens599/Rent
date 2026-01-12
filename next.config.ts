import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
        destination: "/api/proxy",
      },
    ];
  },
};

export default nextConfig;
