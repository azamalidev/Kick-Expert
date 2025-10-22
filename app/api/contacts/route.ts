import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role key for insert (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const { name, email, topic, message } = await req.json();

    // Validation
    if (!name || !email || !topic || !message) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Message must be at least 10 characters" },
        { status: 400 }
      );
    }

    // Determine priority based on topic
    let priority = "medium";
    if (topic === "payouts" || topic === "support") {
      priority = "high";
    }

    // Insert contact into database
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .insert({
        name,
        email,
        topic,
        message,
        status: "new",
        priority,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (contactError) {
      console.error("Error saving contact:", contactError);
      return NextResponse.json(
        { success: false, error: "Failed to save contact message" },
        { status: 500 }
      );
    }

    // Send confirmation email (optional - implement email service)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/emails/contact-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          topic,
          contactId: contact.id,
        }),
      });
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your message has been received. We'll get back to you soon!",
        contactId: contact.id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Contact API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch contact by ID (for users to check status)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get("id");

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: "Contact ID is required" },
        { status: 400 }
      );
    }

    const { data: contact, error } = await supabase
      .from("contacts")
      .select("id, name, email, topic, status, priority, response, responded_at, created_at")
      .eq("id", contactId)
      .single();

    if (error || !contact) {
      return NextResponse.json(
        { success: false, error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: contact });
  } catch (error: any) {
    console.error("Contact GET error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
