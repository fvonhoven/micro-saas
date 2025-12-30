/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@repo/ui', '@repo/auth', '@repo/firebase', '@repo/billing', '@repo/email'],
}

module.exports = nextConfig

