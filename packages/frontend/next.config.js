/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fallbacks for Node.js modules
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Enable WebAssembly support for fhEVM SDK
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
    };

    // Optimize for client-side only
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        crypto: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
