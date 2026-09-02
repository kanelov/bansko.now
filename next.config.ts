import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders
      }
    ];
  },
  async redirects() {
    return [
      // Articles that used to live under the "art-studio" blog category (shadowed by the shop route).
      {
        source: "/art-studio/izkustvo-ritama-dzhaza-galeriya-art-ideya",
        destination: "/now/izkustvo-ritama-dzhaza-galeriya-art-ideya",
        permanent: true
      },
      {
        source: "/en/art-studio/art-rhythm-jazz-art-idea-gallery",
        destination: "/en/now/art-rhythm-jazz-art-idea-gallery",
        permanent: true
      },
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
