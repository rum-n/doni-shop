import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // /gallery was folded into /shop, which now covers the whole collection
      // behind an availability filter. 308 so the move is permanent for search
      // engines and anything that has the old URL saved.
      { source: "/gallery", destination: "/shop", permanent: true },
      {
        source: "/:locale/gallery",
        destination: "/:locale/shop",
        permanent: true,
      },
      // /contact was folded into /about, which now carries the email, the
      // social links and the Instagram strip.
      { source: "/contact", destination: "/about", permanent: true },
      {
        source: "/:locale/contact",
        destination: "/:locale/about",
        permanent: true,
      },
    ];
  },
  images: {
    // `domains` is deprecated as of Next 15; remotePatterns is the replacement
    // and is narrower, since it pins the path as well as the host.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
