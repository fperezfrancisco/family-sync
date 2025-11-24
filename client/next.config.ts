import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bettertogether-media.s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/**",
      },
      // Also allow the generic S3 format in case AWS changes the URL structure
      {
        protocol: "https",
        hostname: "s3.us-east-1.amazonaws.com",
        port: "",
        pathname: "/bettertogether-media/**",
      },
    ],
  },
};

export default nextConfig;
