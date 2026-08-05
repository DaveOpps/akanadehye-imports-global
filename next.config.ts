import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.dummyjson.com" },
      { protocol: "https", hostname: "i.dummyjson.com" },
      { protocol: "https", hostname: "dummyjson.com" },
    ],
    // Our product photos are served from our own API route with a
    // ?i=<index> query string — allow that for the optimizer.
    localPatterns: [{ pathname: "/api/products/**" }],
  },
};

export default nextConfig;
