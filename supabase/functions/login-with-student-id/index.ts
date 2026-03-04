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
    const { student_number, password } = await req.json();

    if (!student_number || !password) {
      return new Response(
        JSON.stringify({ error: "Student ID and password are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Look up the student's email by student_number
    const { data: student, error: lookupErr } = await adminClient
      .from("students")
      .select("email, status")
      .eq("student_number", student_number.trim().toUpperCase())
      .eq("account_type", "student")
      .maybeSingle();

    if (lookupErr) {
      console.error("Student lookup error:", lookupErr);
      return new Response(
        JSON.stringify({ error: "An error occurred. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!student || !student.email) {
      return new Response(
        JSON.stringify({ error: "Invalid Student ID or account not yet activated." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (student.status !== "active") {
      return new Response(
        JSON.stringify({ error: "Your account is not active. Please activate your account first or contact PrepHaus administration." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Sign in with the looked-up email
    const { data: signInData, error: signInErr } = await adminClient.auth.signInWithPassword({
      email: student.email,
      password,
    });

    if (signInErr) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        session: signInData.session,
        user: signInData.user,
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
