import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

function getCorsHeaders(req: Request) {
  const allowedOrigins = [
    Deno.env.get("ALLOWED_ORIGIN") || "https://www.blueribbon-nj.com",
    "https://blueribbon-nj.vercel.app",
  ];
  const origin = req.headers.get("origin") || "";
  const matched = allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return {
    "Access-Control-Allow-Origin": matched,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  };
}

// Rate limiting for password verification
const verifyRateLimitMap = new Map<string, { count: number; resetAt: number }>();
const VERIFY_RATE_LIMIT_MAX = 5;
const VERIFY_RATE_LIMIT_WINDOW_MS = 60_000;

function checkVerifyRateLimit(userId: string): boolean {
  const now = Date.now();
  for (const [key, val] of verifyRateLimitMap) {
    if (val.resetAt <= now) verifyRateLimitMap.delete(key);
  }
  const entry = verifyRateLimitMap.get(userId);
  if (!entry || entry.resetAt <= now) {
    verifyRateLimitMap.set(userId, { count: 1, resetAt: now + VERIFY_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  entry.count++;
  return entry.count <= VERIFY_RATE_LIMIT_MAX;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    // LIST admin users only
    if (action === "list") {
      const { data: adminRoles, error: rolesError } = await adminClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      console.log("admin roles query:", { adminRoles, rolesError });

      if (rolesError) throw new Error(`Failed to query roles: ${rolesError.message}`);

      const adminUserIds = (adminRoles || []).map((r: any) => r.user_id);

      const users = [];
      for (const uid of adminUserIds) {
        const { data, error } = await adminClient.auth.admin.getUserById(uid);
        console.log("getUserById:", uid, { found: !!data?.user, error: error?.message });
        if (data?.user) {
          users.push({
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at,
            last_sign_in_at: data.user.last_sign_in_at,
            roles: ["admin"],
          });
        }
      }

      return new Response(JSON.stringify({ users }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // VERIFY PASSWORD (with rate limiting)
    if (action === "verify_password") {
      if (!checkVerifyRateLimit(caller.id)) {
        return new Response(
          JSON.stringify({ error: "Too many attempts. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { password } = body;
      if (!password || !caller.email) {
        return new Response(JSON.stringify({ error: "Password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: signInErr } = await adminClient.auth.signInWithPassword({
        email: caller.email,
        password,
      });

      if (signInErr) {
        return new Response(JSON.stringify({ error: "Incorrect password" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ verified: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // CREATE user
    if (action === "create") {
      const { email, password, role } = body;
      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Email and password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: {
          created_via_admin_users: true,
          created_by_admin_id: caller.id,
        },
      });
      if (createErr) throw createErr;

      if (role && newUser.user) {
        await adminClient.from("user_roles").insert({
          user_id: newUser.user.id,
          role,
        });
      }

      return new Response(JSON.stringify({ user: { id: newUser.user.id, email: newUser.user.email } }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE email
    if (action === "update_email") {
      const { user_id, email } = body;
      if (!user_id || !email) {
        return new Response(JSON.stringify({ error: "user_id and email required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await adminClient.auth.admin.updateUserById(user_id, { email });
      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE password
    if (action === "update_password") {
      const { user_id, password } = body;
      if (!user_id || !password) {
        return new Response(JSON.stringify({ error: "user_id and password required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: updateErr } = await adminClient.auth.admin.updateUserById(user_id, { password });
      if (updateErr) throw updateErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // UPDATE role
    if (action === "update_role") {
      const { user_id, role, remove } = body;
      if (!user_id || !role) {
        return new Response(JSON.stringify({ error: "user_id and role required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (remove) {
        await adminClient.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      } else {
        await adminClient.from("user_roles").upsert({ user_id, role }, { onConflict: "user_id,role" });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE user
    if (action === "delete") {
      const { user_id } = body;
      if (!user_id) {
        return new Response(JSON.stringify({ error: "user_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (user_id === caller.id) {
        return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id);
      if (delErr) throw delErr;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("Admin-users error:", err);
    return new Response(JSON.stringify({ error: "An internal error occurred." }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
