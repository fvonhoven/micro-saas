import Link from 'next/link'
import { Button } from '@repo/ui'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            CronGuard
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Never miss a cron job failure again. Get instant alerts when your scheduled tasks don't check in.
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

        <div className="mt-24 grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Simple Integration</h3>
            <p className="text-gray-600">
              Just add a curl request to your cron job. We'll handle the rest.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Instant Alerts</h3>
            <p className="text-gray-600">
              Get notified via email or Slack when your jobs fail to check in.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Grace Periods</h3>
            <p className="text-gray-600">
              Configure grace periods to avoid false alarms from minor delays.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

