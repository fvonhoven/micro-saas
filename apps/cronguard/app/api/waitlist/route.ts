import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@repo/firebase/admin"
import { z } from "zod"

const waitlistSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const validation = waitlistSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { email, name } = validation.data

    // Check if email already exists in waitlist
    const existingEntry = await adminDb
      .collection("waitlist")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get()

    if (!existingEntry.empty) {
      return NextResponse.json(
        { error: "This email is already on the waitlist" },
        { status: 400 }
      )
    }

    // Add to waitlist
    await adminDb.collection("waitlist").add({
      email: email.toLowerCase(),
      name,
      createdAt: new Date(),
      notified: false,
    })

    return NextResponse.json(
      { success: true, message: "Successfully joined the waitlist" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error adding to waitlist:", error)
    return NextResponse.json(
      { error: "Failed to join waitlist. Please try again." },
      { status: 500 }
    )
  }
}

