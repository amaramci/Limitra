import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { webpack }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(/pino-pretty/, require.resolve("./pino-pretty-stub.js"))
    );
    return config;
  },
};

export default nextConfig;
