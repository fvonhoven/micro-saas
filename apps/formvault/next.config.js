/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@repo/ui",
    "@repo/auth",
    "@repo/firebase",
    "@repo/billing",
    "@repo/email",
    "firebase",
    "@firebase/auth",
    "@firebase/app",
    "@firebase/firestore",
    "@firebase/storage",
  ],
  experimental: {
    serverComponentsExternalPackages: ["firebase-admin"],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Force webpack to prefer browser builds over node builds
      config.resolve.conditionNames = ["browser", "import", "module", "require", "default"]

      // Don't bundle Node.js-only modules on the client
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
        net: false,
        tls: false,
        fs: false,
        child_process: false,
        http2: false,
      }
    }
    return config
  },
}

module.exports = nextConfig
