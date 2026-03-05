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
    const { first_name, last_name, email, password, student_number, student_last_name } = await req.json();

    if (!first_name || !last_name || !email || !password || !student_number || !student_last_name) {
      return new Response(
        JSON.stringify({ error: "All fields are required." }),
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

    // 1. Verify the student exists, is active, and is a student account
    const { data: student, error: studentErr } = await adminClient
      .from("students")
      .select("id")
      .ilike("last_name", student_last_name.trim())
      .eq("student_number", student_number.trim().toUpperCase())
      .eq("status", "active")
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
        JSON.stringify({ error: "No active student found with that last name and Student ID. Your child must activate their account first." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check no parent is already linked to that student
    const { data: existingParent } = await adminClient
      .from("students")
      .select("id")
      .eq("linked_student_id", student.id)
      .eq("account_type", "parent")
      .maybeSingle();

    if (existingParent) {
      return new Response(
        JSON.stringify({ error: "A parent account is already linked to this student. Please contact PrepHaus administration." }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Create auth user
    const trimmedEmail = email.trim().toLowerCase();
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email: trimmedEmail,
      password,
      email_confirm: true,
      user_metadata: {
        first_name: first_name.trim(),
        last_name: last_name.trim(),
      },
    });

    if (createErr) {
      if (createErr.message?.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "An account with this email already exists. Please sign in instead." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("Auth user creation error:", createErr);
      return new Response(
        JSON.stringify({ error: "Failed to create account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Insert parent student record
    const { error: insertErr } = await adminClient.from("students").insert({
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      email: trimmedEmail,
      user_id: newUser.user.id,
      account_type: "parent",
      linked_student_id: student.id,
      status: "active",
    });

    if (insertErr) {
      console.error("Parent record insert error:", insertErr);
      // Rollback: delete the auth user
      await adminClient.auth.admin.deleteUser(newUser.user.id);
      return new Response(
        JSON.stringify({ error: "Failed to create parent account. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Account created! You can now sign in." }),
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
