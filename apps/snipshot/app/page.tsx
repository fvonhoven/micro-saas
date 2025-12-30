import Link from 'next/link'
import { Button } from '@repo/ui'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            SnipShot
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Capture website screenshots via API. Fast, reliable, and CDN-hosted.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">Sign In</Button>
            </Link>
          </div>
        </div>

        <div className="mt-16 bg-gray-900 text-white p-6 rounded-lg max-w-2xl mx-auto">
          <p className="text-sm text-gray-400 mb-2">Example API Request:</p>
          <code className="text-green-400">
            curl -H "X-API-Key: your_key" \<br />
            &nbsp;&nbsp;"https://snipshot.app/api/screenshot?url=https://example.com"
          </code>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Lightning Fast</h3>
            <p className="text-gray-600">
              Screenshots are cached and served from CDN for instant delivery.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Simple API</h3>
            <p className="text-gray-600">
              Just pass a URL and get back a screenshot. No complex configuration.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Rate Limited</h3>
            <p className="text-gray-600">
              Built-in rate limiting with Upstash Redis for fair usage.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

