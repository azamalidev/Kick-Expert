import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const { name, email, topic, message } = await req.json();

    console.log("📨 Contact form received:", { name, email, topic, message });

    // Validation
    if (!name || !email || !topic || !message) {
      console.error("❌ Missing fields");
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.error("❌ Invalid email:", email);
      return NextResponse.json(
        { success: false, error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.trim().length < 10) {
      console.error("❌ Message too short");
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

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("🔌 Connecting to Supabase...");

    // Insert contact into database
    const { data: contact, error: contactError } = await supabaseAdmin
      .from("contacts")
      .insert({
        name: name.trim(),
        email: email.trim(),
        topic: topic.trim(),
        message: message.trim(),
        status: "new",
        priority: priority,
      })
      .select()
      .single();

    if (contactError) {
      console.error("❌ Database error:", contactError);
      console.error("Error code:", contactError.code);
      console.error("Error message:", contactError.message);
      return NextResponse.json(
        { 
          success: false, 
          error: `Database error: ${contactError.message}`,
          details: contactError
        },
        { status: 500 }
      );
    }

    console.log("✅ Contact saved successfully:", contact.id);

    // Send confirmation email to user
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/email/contact-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim(),
          topic: topic.trim(),
          contactId: contact.id,
        }),
      });
      console.log("✅ Confirmation email sent to:", email);
    } catch (emailError) {
      console.error("⚠️ Failed to send confirmation email:", emailError);
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
    console.error("❌ API error:", error);
    console.error("Error message:", error.message);
    console.error("Error stack:", error.stack);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || "Internal server error",
        details: process.env.NODE_ENV === "development" ? error : undefined
      },
      { status: 500 }
    );
  }
}
