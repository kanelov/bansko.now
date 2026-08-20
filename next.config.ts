import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/art-studio/gallery/category/nay-prodavani-8915ae7d",
        destination: "/art-studio/gallery/category/nay-haresvani-teniski",
        permanent: true
      },
      {
        source: "/bg/art-studio/gallery/category/nay-prodavani-8915ae7d",
        destination: "/bg/art-studio/gallery/category/nay-haresvani-teniski",
        permanent: true
      }
    ];
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "90mb"
    }
  },
  images: {
    minimumCacheTTL: 2592000,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org"
      },
      {
        protocol: "https",
        hostname: "*.supabase.co"
      },
      {
        protocol: "https",
        hostname: "app.kanelov.com",
        pathname: "/api/catalog-image"
      }
    ]
  }
};

export default nextConfig;
