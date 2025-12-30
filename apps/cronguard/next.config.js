/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/auth", "@repo/firebase", "@repo/billing", "@repo/email"],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'undici' on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
