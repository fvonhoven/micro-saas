#!/usr/bin/env node

/**
 * Debug User Subscription Data
 * 
 * This script checks what's stored in Firestore for your user
 * to help debug why the UI shows "Free" plan.
 */

require('dotenv').config({ path: '.env.local' })
const admin = require('firebase-admin')

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const db = admin.firestore()

async function debugUser(email) {
  try {
    console.log('\n🔍 Searching for user:', email)
    
    // Get user by email
    const usersSnapshot = await db.collection('users').where('email', '==', email).get()
    
    if (usersSnapshot.empty) {
      console.log('❌ No user found with that email')
      return
    }
    
    const userDoc = usersSnapshot.docs[0]
    const userData = userDoc.data()
    
    console.log('\n✅ User found!')
    console.log('User ID:', userDoc.id)
    console.log('\n📊 Subscription Data:')
    console.log('-------------------')
    console.log('Email:', userData.email)
    console.log('Stripe Customer ID:', userData.stripeCustomerId || '❌ NOT SET')
    console.log('Stripe Subscription ID:', userData.stripeSubscriptionId || '❌ NOT SET')
    console.log('Stripe Price ID:', userData.stripePriceId || '❌ NOT SET')
    console.log('Current Period End:', userData.stripeCurrentPeriodEnd?.toDate?.() || '❌ NOT SET')
    
    // Determine plan from price ID
    const priceId = userData.stripePriceId
    let detectedPlan = 'Free (no price ID)'
    
    if (priceId) {
      const priceMap = {
        [process.env.STRIPE_CRONGUARD_STARTER_MONTHLY_PRICE_ID]: 'Starter (Monthly)',
        [process.env.STRIPE_CRONGUARD_STARTER_ANNUAL_PRICE_ID]: 'Starter (Annual)',
        [process.env.STRIPE_CRONGUARD_PRO_MONTHLY_PRICE_ID]: 'Pro (Monthly)',
        [process.env.STRIPE_CRONGUARD_PRO_ANNUAL_PRICE_ID]: 'Pro (Annual)',
        [process.env.STRIPE_CRONGUARD_TEAM_MONTHLY_PRICE_ID]: 'Team (Monthly)',
        [process.env.STRIPE_CRONGUARD_TEAM_ANNUAL_PRICE_ID]: 'Team (Annual)',
      }
      
      detectedPlan = priceMap[priceId] || `Unknown (${priceId})`
    }
    
    console.log('\n🎯 Detected Plan:', detectedPlan)
    
    // Check if price ID matches environment variables
    if (priceId && !detectedPlan.includes('Unknown')) {
      console.log('✅ Price ID matches environment variables')
    } else if (priceId) {
      console.log('⚠️  Price ID does NOT match any environment variables!')
      console.log('   This means the plan lookup will fail and default to Free.')
      console.log('\n   Expected Price IDs:')
      console.log('   Starter Monthly:', process.env.STRIPE_CRONGUARD_STARTER_MONTHLY_PRICE_ID)
      console.log('   Starter Annual:', process.env.STRIPE_CRONGUARD_STARTER_ANNUAL_PRICE_ID)
      console.log('   Pro Monthly:', process.env.STRIPE_CRONGUARD_PRO_MONTHLY_PRICE_ID)
      console.log('   Pro Annual:', process.env.STRIPE_CRONGUARD_PRO_ANNUAL_PRICE_ID)
      console.log('   Team Monthly:', process.env.STRIPE_CRONGUARD_TEAM_MONTHLY_PRICE_ID)
      console.log('   Team Annual:', process.env.STRIPE_CRONGUARD_TEAM_ANNUAL_PRICE_ID)
    }
    
    console.log('\n')
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    process.exit(0)
  }
}

// Get email from command line argument
const email = process.argv[2]

if (!email) {
  console.log('Usage: node debug-user.js <email>')
  console.log('Example: node debug-user.js user@example.com')
  process.exit(1)
}

debugUser(email)

