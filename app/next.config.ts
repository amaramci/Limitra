import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.plugins.push(
      new webpack.IgnorePlugin({ resourceRegExp: /^pino-pretty$/ })
    );
    return config;
  },
};

export default nextConfig;
