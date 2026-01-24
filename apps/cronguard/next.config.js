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
  // Security Headers
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://www.clarity.ms https://c.clarity.ms https://hcaptcha.com https://*.hcaptcha.com",
              "style-src 'self' 'unsafe-inline' https://hcaptcha.com https://*.hcaptcha.com",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.firebaseio.com https://*.googleapis.com https://api.stripe.com https://www.clarity.ms https://hcaptcha.com https://*.hcaptcha.com wss://*.firebaseio.com",
              "frame-src 'self' https://js.stripe.com https://hcaptcha.com https://*.hcaptcha.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ]
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
