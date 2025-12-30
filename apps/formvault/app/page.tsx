import Link from 'next/link'
import { Button } from '@repo/ui'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">
            FormVault
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Collect documents from clients securely. Send magic links, receive files. No client accounts needed.
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
            <h3 className="text-xl font-semibold mb-3">Magic Links</h3>
            <p className="text-gray-600">
              Send secure, time-limited upload links to your clients via email.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">No Client Accounts</h3>
            <p className="text-gray-600">
              Clients can upload files without creating accounts or remembering passwords.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-xl font-semibold mb-3">Secure Storage</h3>
            <p className="text-gray-600">
              All files are encrypted and stored securely in Firebase Storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

