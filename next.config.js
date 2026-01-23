/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false; // evita el warning de snapshot en Windows
    }
    return config;
  },
};

module.exports = nextConfig;
