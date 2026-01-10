export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: January 9, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="text-gray-700 mb-4">
              By accessing or using CronNarc ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of
              the terms, you may not access the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
            <p className="text-gray-700 mb-4">
              CronNarc is a cron job monitoring service that helps you track the health and uptime of your scheduled tasks. The Service provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Monitor creation and management</li>
              <li>Ping endpoints for cron job check-ins</li>
              <li>Alert notifications via email, Slack, Discord, and webhooks</li>
              <li>Public status pages</li>
              <li>Analytics and incident tracking</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
            <p className="text-gray-700 mb-4">You are responsible for:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Maintaining the security of your account and password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>
            <p className="text-gray-700 mb-4">
              We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
            <p className="text-gray-700 mb-4">You agree not to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Attempt to gain unauthorized access to the Service or related systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Use the Service to transmit malware, viruses, or harmful code</li>
              <li>Abuse rate limits or attempt to overwhelm our infrastructure</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Subscription Plans and Billing</h2>
            <p className="text-gray-700 mb-4">
              <strong>Free Plan:</strong> Limited features with no payment required.
            </p>
            <p className="text-gray-700 mb-4">
              <strong>Paid Plans:</strong> Billed monthly or annually via Stripe. By subscribing, you agree to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide accurate billing information</li>
              <li>Automatic renewal unless cancelled</li>
              <li>No refunds for partial months or unused services</li>
              <li>Price changes with 30 days notice</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You may cancel your subscription at any time. Cancellation takes effect at the end of the current billing period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Service Availability</h2>
            <p className="text-gray-700 mb-4">
              We strive to provide reliable service but do not guarantee 100% uptime. The Service is provided "as is" without warranties of any kind.
              We reserve the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Modify or discontinue the Service with or without notice</li>
              <li>Perform scheduled maintenance</li>
              <li>Implement rate limits and usage restrictions</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data and Privacy</h2>
            <p className="text-gray-700 mb-4">
              Your use of the Service is also governed by our Privacy Policy. We collect and process data as described in the Privacy Policy to
              provide and improve the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="text-gray-700 mb-4">
              The Service and its original content, features, and functionality are owned by CronNarc and are protected by international copyright,
              trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              In no event shall CronNarc, its directors, employees, or agents be liable for any indirect, incidental, special, consequential, or
              punitive damages, including loss of profits, data, or other intangible losses, resulting from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Your use or inability to use the Service</li>
              <li>Unauthorized access to your data</li>
              <li>Service interruptions or errors</li>
              <li>Missed alerts or notifications</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless CronNarc from any claims, damages, losses, liabilities, and expenses arising from your use of
              the Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service.
              Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law
              provisions.
            </p>
          </section>

          {/* <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact</h2>
            <p className="text-gray-700 mb-4">
              If you have any questions about these Terms, please contact us at:{" "}
              <a href="mailto:support@cronnarc.com" className="text-purple-600 hover:text-purple-700">
                support@cronnarc.com
              </a>
            </p>
          </section> */}
        </div>
      </div>
    </div>
  )
}
