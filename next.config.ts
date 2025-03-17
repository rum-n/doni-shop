import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ['res.cloudinary.com'],
  },
  i18n: {
    locales: ['en', 'bg', 'de'],
    defaultLocale: 'en',
  },
};

export default nextConfig;
