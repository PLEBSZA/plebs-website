import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prefer Cache Components + `'use cache'` for shared catalogue data (PLEBS-PERF-002).
  cacheComponents: true,
  trailingSlash: true,
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/green-dungarees",
        destination: "/products/cotton-corduroy-dungarees/",
        permanent: true,
      },
      {
        source: "/green-dungarees/",
        destination: "/products/cotton-corduroy-dungarees/",
        permanent: true,
      },
      {
        source: "/dungarees",
        destination: "/products/cotton-corduroy-dungarees/",
        permanent: true,
      },
      {
        source: "/dungarees/",
        destination: "/products/cotton-corduroy-dungarees/",
        permanent: true,
      },
      {
        source: "/shop",
        destination: "/products/cotton-corduroy-dungarees/",
        permanent: true,
      },
      {
        source: "/shop/",
        destination: "/products/cotton-corduroy-dungarees/",
        permanent: true,
      },
      {
        source: "/index",
        destination: "/",
        permanent: true,
      },
      {
        source: "/index/",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
        ],
      },
    ];
  },
};

export default nextConfig;
