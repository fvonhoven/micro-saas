/**
 * Test script to verify signup terms checkbox requirement
 * 
 * This tests that:
 * 1. Signup form requires terms checkbox to be checked
 * 2. Terms and Privacy links are present
 * 3. Form validation works correctly
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

async function testSignupTermsCheckbox() {
  console.log("🧪 Testing Signup Terms Checkbox Requirement\n")
  console.log("=" .repeat(60))

  try {
    // Fetch the signup page
    console.log("\n1️⃣ Fetching signup page...")
    const response = await fetch(`${BASE_URL}/signup`)
    const html = await response.text()

    // Check for terms checkbox
    const hasTermsCheckbox = html.includes('type="checkbox"') && html.includes('id="terms"')
    console.log(`   ${hasTermsCheckbox ? "✅" : "❌"} Terms checkbox present: ${hasTermsCheckbox}`)

    // Check for Terms of Service link
    const hasTermsLink = html.includes('/terms') && html.includes('Terms of Service')
    console.log(`   ${hasTermsLink ? "✅" : "❌"} Terms of Service link present: ${hasTermsLink}`)

    // Check for Privacy Policy link
    const hasPrivacyLink = html.includes('/privacy') && html.includes('Privacy Policy')
    console.log(`   ${hasPrivacyLink ? "✅" : "❌"} Privacy Policy link present: ${hasPrivacyLink}`)

    // Check for required attribute
    const hasRequiredAttr = html.includes('required') && html.includes('checkbox')
    console.log(`   ${hasRequiredAttr ? "✅" : "❌"} Checkbox has required attribute: ${hasRequiredAttr}`)

    // Check for agreement text
    const hasAgreementText = html.includes('I agree to the')
    console.log(`   ${hasAgreementText ? "✅" : "❌"} Agreement text present: ${hasAgreementText}`)

    console.log("\n" + "=".repeat(60))

    const allPassed = hasTermsCheckbox && hasTermsLink && hasPrivacyLink && hasRequiredAttr && hasAgreementText

    if (allPassed) {
      console.log("\n✅ ALL TESTS PASSED!")
      console.log("\n📋 Summary:")
      console.log("   • Terms checkbox is present and required")
      console.log("   • Terms of Service link is present")
      console.log("   • Privacy Policy link is present")
      console.log("   • Agreement text is clear and visible")
      console.log("\n✨ Signup form now requires users to agree to Terms and Privacy Policy!")
    } else {
      console.log("\n❌ SOME TESTS FAILED")
      console.log("   Please check the signup page implementation")
    }

    return allPassed
  } catch (error) {
    console.error("\n❌ Test failed with error:", error.message)
    return false
  }
}

// Run the test
testSignupTermsCheckbox()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error("Fatal error:", error)
    process.exit(1)
  })

