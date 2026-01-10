export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8 md:p-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 9, 2026</p>

        <div className="prose prose-lg max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="text-gray-700 mb-4">
              CronNarc ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you use our cron job monitoring service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.1 Account Information</h3>
            <p className="text-gray-700 mb-4">When you create an account, we collect:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Email address</li>
              <li>Name (optional)</li>
              <li>Password (encrypted)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.2 Monitor Data</h3>
            <p className="text-gray-700 mb-4">When you create monitors, we collect:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Monitor names and descriptions</li>
              <li>Check-in intervals and grace periods</li>
              <li>Alert email addresses</li>
              <li>Ping timestamps and IP addresses</li>
              <li>Incident history and analytics</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.3 Alert Channel Configuration</h3>
            <p className="text-gray-700 mb-4">When you configure alert channels, we collect:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Webhook URLs (Slack, Discord, custom)</li>
              <li>Email addresses for notifications</li>
              <li>Channel names and preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.4 Payment Information</h3>
            <p className="text-gray-700 mb-4">
              Payment processing is handled by Stripe. We do not store your credit card information. We receive from Stripe:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Subscription status</li>
              <li>Plan type</li>
              <li>Billing cycle</li>
              <li>Last 4 digits of card (for display purposes)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">2.5 Usage Data</h3>
            <p className="text-gray-700 mb-4">We automatically collect:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>IP addresses</li>
              <li>Browser type and version</li>
              <li>Pages visited and time spent</li>
              <li>API usage and rate limit data</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">We use your information to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Provide and maintain the Service</li>
              <li>Monitor your cron jobs and send alerts</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send service-related notifications</li>
              <li>Improve and optimize the Service</li>
              <li>Detect and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Storage and Security</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.1 Where We Store Data</h3>
            <p className="text-gray-700 mb-4">Your data is stored using:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Firebase Firestore:</strong> Monitor data, incidents, and user information
              </li>
              <li>
                <strong>Firebase Authentication:</strong> Account credentials (encrypted)
              </li>
              <li>
                <strong>Netlify:</strong> Application hosting and serverless functions
              </li>
              <li>
                <strong>Stripe:</strong> Payment and subscription data
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">4.2 Security Measures</h3>
            <p className="text-gray-700 mb-4">We implement security measures including:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Encryption in transit (HTTPS/TLS)</li>
              <li>Encryption at rest for sensitive data</li>
              <li>Firestore security rules to prevent unauthorized access</li>
              <li>Rate limiting to prevent abuse</li>
              <li>Regular security audits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
            <p className="text-gray-700 mb-4">We do not sell your personal information. We may share data with:</p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.1 Service Providers</h3>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Firebase/Google Cloud:</strong> Database and authentication
              </li>
              <li>
                <strong>Netlify:</strong> Hosting and serverless functions
              </li>
              <li>
                <strong>Stripe:</strong> Payment processing
              </li>
              <li>
                <strong>Resend:</strong> Email delivery
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.2 Legal Requirements</h3>
            <p className="text-gray-700 mb-4">
              We may disclose your information if required by law, court order, or to protect our rights and safety.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">5.3 Public Status Pages</h3>
            <p className="text-gray-700 mb-4">If you enable public status pages, the following information is publicly accessible:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Monitor name (or custom title)</li>
              <li>Current status (Healthy/Down)</li>
              <li>Uptime percentage</li>
              <li>Recent incidents</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="text-gray-700 mb-4">We retain your data:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Account data:</strong> Until you delete your account
              </li>
              <li>
                <strong>Monitor data:</strong> Until you delete the monitor
              </li>
              <li>
                <strong>Ping history:</strong> 90 days
              </li>
              <li>
                <strong>Incident history:</strong> Until monitor deletion
              </li>
              <li>
                <strong>Billing records:</strong> 7 years (legal requirement)
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights</h2>
            <p className="text-gray-700 mb-4">You have the right to:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Access:</strong> Request a copy of your data
              </li>
              <li>
                <strong>Correction:</strong> Update inaccurate information
              </li>
              <li>
                <strong>Deletion:</strong> Delete your account and data
              </li>
              <li>
                <strong>Export:</strong> Download your monitor data
              </li>
              <li>
                <strong>Opt-out:</strong> Unsubscribe from marketing emails
              </li>
            </ul>
            {/* <p className="text-gray-700 mb-4">
              To exercise these rights, contact us at{" "}
              <a href="mailto:privacy@cronnarc.com" className="text-purple-600 hover:text-purple-700">
                privacy@cronnarc.com
              </a>
            </p> */}
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>

            <h3 className="text-xl font-semibold text-gray-900 mb-3">8.1 Essential Cookies</h3>
            <p className="text-gray-700 mb-4">We use essential cookies for:</p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>
                <strong>Authentication:</strong> Session cookies to keep you logged in (required for service functionality)
              </li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">8.2 Analytics and User Experience</h3>
            <p className="text-gray-700 mb-4">
              We use{" "}
              <a
                href="https://clarity.microsoft.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 underline"
              >
                Microsoft Clarity
              </a>
              , a free analytics and session replay tool that helps us understand how users interact with our Service. Microsoft Clarity collects:
            </p>
            <ul className="list-disc pl-6 text-gray-700 mb-4">
              <li>Page views and navigation patterns</li>
              <li>Click, scroll, and mouse movement data</li>
              <li>Session recordings (anonymized)</li>
              <li>Heatmaps of user interactions</li>
              <li>Device and browser information</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Microsoft Clarity uses cookies and may collect personal data. The data is processed in accordance with{" "}
              <a
                href="https://privacy.microsoft.com/en-us/privacystatement"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 hover:text-purple-700 underline"
              >
                Microsoft's Privacy Statement
              </a>
              . You can opt out of Clarity tracking by enabling "Do Not Track" in your browser settings.
            </p>

            <h3 className="text-xl font-semibold text-gray-900 mb-3 mt-6">8.3 Browser Settings</h3>
            <p className="text-gray-700 mb-4">
              You can disable cookies in your browser settings. Note that disabling essential cookies will prevent you from logging in and using the
              Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              The Service is not intended for users under 13 years of age. We do not knowingly collect personal information from children under 13. If
              you become aware that a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your data may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect
              your data in accordance with this Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of material changes via email or through the Service. Your
              continued use after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* <section className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
            <p className="text-gray-700 mb-4">If you have questions about this Privacy Policy or our data practices, contact us at:</p>
            <ul className="list-none text-gray-700 mb-4">
              <li>
                <strong>Email:</strong>{" "}
                <a href="mailto:privacy@cronnarc.com" className="text-purple-600 hover:text-purple-700">
                  privacy@cronnarc.com
                </a>
              </li>
              <li>
                <strong>Support:</strong>{" "}
                <a href="mailto:support@cronnarc.com" className="text-purple-600 hover:text-purple-700">
                  support@cronnarc.com
                </a>
              </li>
            </ul>
          </section> */}
        </div>
      </div>
    </div>
  )
}
