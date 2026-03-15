import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN") || "https://blueribbon-nj.com";
  const origin = req.headers.get("origin") || "";
  return {
    "Access-Control-Allow-Origin": origin === allowedOrigin ? origin : allowedOrigin,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { student_number, last_name } = await req.json();

    if (!student_number || !last_name) {
      return new Response(
        JSON.stringify({ error: "Student ID and last name are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Perform lookup but always return the same generic response
    await supabaseAdmin
      .from("students")
      .select("id")
      .ilike("last_name", last_name.trim())
      .eq("student_number", student_number.trim().toUpperCase())
      .eq("status", "active")
      .eq("account_type", "student")
      .maybeSingle();

    // Always return generic response to prevent enumeration
    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid request." }),
      { status: 400, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } }
    );
  }
});
