/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack(config, { dev }) {
    // Fix unstable local dev cache on Windows that causes
    // "Cannot find module './xxxx.js'" from .next/server/webpack-runtime.js
    if (dev) {
      config.cache = false;
    }
    return config;
  },
  async redirects() {
    return [
      { source: "/order", destination: "/checkout", permanent: true },
      { source: "/chatgpt", destination: "/", permanent: true },
      { source: "/pricing", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
