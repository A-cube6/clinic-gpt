import type { NextConfig } from "next";

const nextConfig: NextConfig = {
env: {
    NEXT_PUBLIC_BUILD_VERSION: new Date().toLocaleString("en-AU", {
      timeZone: "Australia/Sydney",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }),
  },
};

export default nextConfig;
