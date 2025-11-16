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
      '@react-native-async-storage/async-storage': false,
      crypto: false,
    };

    // Enable WebAssembly support for fhevmjs v0.3.2 (v0.8 compatible)
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true,
      topLevelAwait: true,
    };

    // Set moduleIds to named for better WASM module resolution
    config.optimization = {
      ...config.optimization,
      moduleIds: 'named',
    };

    // Add WASM loader rule
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Configure WASM output filename
    if (isServer) {
      config.output.webassemblyModuleFilename = './../static/wasm/[modulehash].wasm';
    } else {
      config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';
      config.output.environment = {
        ...config.output.environment,
        asyncFunction: true,
      };
    }

    // Handle fhevmjs module - mark as external for SSR
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('fhevmjs');
    }

    return config;
  },
};

module.exports = nextConfig;
