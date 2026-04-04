import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "https://www.blueribbon-nj.com";
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? origin : allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student_number, last_name, email, password } = await req.json();

    if (!student_number || !last_name || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Student ID, last name, email, and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!PASSWORD_REGEX.test(password)) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 8 characters with uppercase, lowercase, number, and special character." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Find the student record matching student_number + last_name + status = 'pending'
    const { data: student, error: studentErr } = await adminClient
      .from("students")
      .select("id, first_name, last_name, email, student_number, status, user_id")
      .eq("student_number", student_number.trim().toUpperCase())
      .ilike("last_name", last_name.trim())
      .eq("status", "pending")
      .eq("account_type", "student")
      .maybeSingle();

    if (studentErr) {
      console.error("Student lookup error:", studentErr);
      return new Response(
        JSON.stringify({ error: "An error occurred. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!student || student.user_id) {
      return new Response(
        JSON.stringify({
          error: "Unable to activate. Please check your information or contact Blue Ribbon Academy administration.",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use existing email on file if available, otherwise use client-provided email
    const finalEmail = (student.email || email).trim().toLowerCase();

    // Create the auth user
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: finalEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: student.first_name,
        last_name: student.last_name,
      },
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({
            error: "Unable to activate. Please check your information or contact Blue Ribbon Academy administration.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Auth user creation error:", createErr);
      return new Response(
        JSON.stringify({ error: "Failed to create account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link user_id to student record, save email, and set status to active
    const { error: updateErr } = await adminClient
      .from("students")
      .update({
        user_id: newUser.user.id,
        status: "active",
        active: true,
        email: finalEmail,
      })
      .eq("id", student.id);

    if (updateErr) {
      console.error("Student update error:", updateErr);
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to activate account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Account activated successfully! You can now sign in.",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const corsHeaders = getCorsHeaders(req);
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
