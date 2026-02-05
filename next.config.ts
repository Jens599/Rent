import { withSerwist } from "@serwist/turbopack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Exclude serwist, api/auth, _next/static, _next/image, favicon.ico from proxy
        source: "/((?!api|_next/static|_next/image|favicon.ico|serwist).*)",
        destination: "/api/proxy",
      },
    ];
  },
};

export default withSerwist({
  ...nextConfig,
  cacheComponents: true,
});
