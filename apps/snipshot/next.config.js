/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/auth", "@repo/firebase", "@repo/billing", "@repo/email", "undici"],
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin", "undici"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve Node.js modules on the client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
        net: false,
        tls: false,
        fs: false,
      }
      // Force Firebase Auth to use browser version
      config.resolve.alias = {
        ...config.resolve.alias,
        "@firebase/auth": "@firebase/auth/dist/esm2017/index.js",
      }
    }
    return config
  },
}

module.exports = nextConfig
