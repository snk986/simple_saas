import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./config/i18n.ts");

const nextConfig: NextConfig = {
  devIndicators: {
  },
  turbopack: {
    // 默认开启 Turbopack，添加空配置以消除与 webpack 配置共存时的警告
  },
  // Configure webpack to ignore the external folder
  webpack: (config: any) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ['**/node_modules/**'],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
