import type { NextConfig } from "next";

const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null;

const nextConfig: NextConfig = {
  typedRoutes: true,
  images: {
    remotePatterns: supabaseHost
      ? [
        {
          protocol: "https",
          hostname: supabaseHost,
          pathname: "/storage/v1/object/**",
        },
        {
          protocol: "https",
          hostname: "tvkvijay.com",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "tvkassets.minsky.studio",
          pathname: "/**",
        },
        {
          protocol: "https",
          hostname: "tvkcovai.com",
          pathname: "/**",
        },
      ]
      : [],
  },
};

export default nextConfig;
