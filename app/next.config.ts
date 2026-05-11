import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.resolve.alias["pino-pretty"] = path.resolve(__dirname, "pino-pretty-stub.js");
    return config;
  },
};

export default nextConfig;
