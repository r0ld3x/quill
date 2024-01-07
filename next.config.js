/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { buildId, dev, defaultLoaders, isServer, webpack }) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;
