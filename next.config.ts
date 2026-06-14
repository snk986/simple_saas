import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./config/i18n.ts");

const legacyPricingUnitRedirects = [
  "/mes",
  "/ano",
  "/mo",
  "/yr",
  "/%E6%9C%88",
  "/%E5%B9%B4",
  "/%EC%9B%94",
  "/%EB%85%84",
].map((source) => ({
  source,
  destination: "/pricing",
  permanent: true,
}));

const nextConfig: NextConfig = {
  allowedDevOrigins: ["198.18.0.1"],
  devIndicators: {},
  async redirects() {
    return [
      ...legacyPricingUnitRedirects,
      {
        source: "/create",
        destination: "/ai-song-maker",
        permanent: true,
      },
      {
        source: "/es/lyrics-to-song",
        destination: "/es/ai-lyrics-to-song",
        permanent: true,
      },
      {
        source: "/es/text-to-song",
        destination: "/es/ai-text-to-song",
        permanent: true,
      },
      {
        source: "/es/create",
        destination: "/es/ai-song-maker",
        permanent: true,
      },
      {
        source: "/pt/lyrics-to-song",
        destination: "/pt/ai-lyrics-to-song",
        permanent: true,
      },
      {
        source: "/pt/text-to-song",
        destination: "/pt/ai-text-to-song",
        permanent: true,
      },
      {
        source: "/zh-CN/lyrics-to-song",
        destination: "/zh-CN/ai-lyrics-to-song",
        permanent: true,
      },
      {
        source: "/zh-CN/text-to-song",
        destination: "/zh-CN/ai-text-to-song",
        permanent: true,
      },
      {
        source: "/pt/create",
        destination: "/pt/ai-song-maker",
        permanent: true,
      },
      {
        source: "/ja/create",
        destination: "/ja/ai-song-maker",
        permanent: true,
      },
      {
        source: "/ko/create",
        destination: "/ko/ai-song-maker",
        permanent: true,
      },
      {
        source: "/zh-CN/create",
        destination: "/zh-CN/ai-song-maker",
        permanent: true,
      },
    ];
  },
  turbopack: {
    // 默认开启 Turbopack，添加空配置以消除与 webpack 配置共存时的警告
  },
  // Configure webpack to ignore the external folder
  webpack: (config: any) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**"],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
