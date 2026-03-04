import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student_number, email, password } = await req.json();

    if (!student_number || !email || !password) {
      return new Response(
        JSON.stringify({ error: "Student ID, email, and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "Password must be at least 6 characters." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Find the student record matching student_number + email + status = 'pending'
    const { data: student, error: studentErr } = await adminClient
      .from("students")
      .select("id, first_name, last_name, email, student_number, status, user_id")
      .eq("student_number", student_number.trim().toUpperCase())
      .eq("email", email.trim().toLowerCase())
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

    if (!student) {
      return new Response(
        JSON.stringify({
          error:
            "No pending student found with that Student ID and email. Please check your information or contact PrepHaus administration.",
        }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (student.user_id) {
      return new Response(
        JSON.stringify({ error: "This account has already been activated. Please sign in." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create the auth user
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: email.trim().toLowerCase(),
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
            error: "An account with this email already exists. Please sign in or contact admin.",
          }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Auth user creation error:", createErr);
      return new Response(
        JSON.stringify({ error: "Failed to create account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Link user_id to student record and set status to active
    const { error: updateErr } = await adminClient
      .from("students")
      .update({ user_id: newUser.user.id, status: "active", active: true })
      .eq("id", student.id);

    if (updateErr) {
      console.error("Student update error:", updateErr);
      // Try to clean up the auth user
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
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
