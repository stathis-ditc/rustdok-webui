/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove the experimental.appDir flag as it's no longer needed
  reactStrictMode: true,
  // Specify the pages directory explicitly
  pageExtensions: ['js', 'jsx', 'ts', 'tsx'],
  // Enable standalone output mode for smaller Docker images
  output: 'standalone',
  // Fix version compatibility issues
  webpack: (config, { isServer }) => {
    // Add support for PDF.js
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        stream: false,
        canvas: false,
        zlib: false,
      };
    }
    
    // Add a rule to handle PDF.js worker
    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/chunks/[name].[hash][ext]',
      },
    });
    
    return config;
  }
}

module.exports = nextConfig 