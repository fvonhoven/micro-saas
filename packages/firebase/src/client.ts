"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let app: FirebaseApp
let auth: Auth
let db: Firestore
let storage: FirebaseStorage

if (typeof window !== "undefined") {
  app = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig)
  auth = getAuth(app)

  // Set persistence to LOCAL (persists across browser sessions)
  setPersistence(auth, browserLocalPersistence).catch(error => {
    console.error("Error setting auth persistence:", error)
  })

  db = getFirestore(app)
  storage = getStorage(app)
}

// @ts-ignore - These are initialized on the client side
export { app, auth, db, storage }
