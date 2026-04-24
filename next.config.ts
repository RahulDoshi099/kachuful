import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['172.17.1.109'],
  devIndicators: {
    appIsrStatus: true,
  },
};

export default nextConfig;
