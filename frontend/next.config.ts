import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  reactCompiler: true,
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: (process.env.INTERNAL_API_URL 
          ? `${process.env.INTERNAL_API_URL}/:path*` 
          : 'http://backend:8080/api/:path*').replace('//api', '/api'), // Fix double slash
      },
    ];
  },
};

export default nextConfig;
