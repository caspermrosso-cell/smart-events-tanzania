import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: "Unauthorized" }, 401);
    const callerId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify caller is admin
    const { data: adminCheck } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminCheck) return json({ error: "Forbidden" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = body.action as string;

    switch (action) {
      case "list": {
        const { data: users, error } = await admin.auth.admin.listUsers({ perPage: 200 });
        if (error) throw error;
        const ids = users.users.map((u) => u.id);
        const [{ data: roles }, { data: perms }] = await Promise.all([
          admin.from("user_roles").select("user_id, role").in("user_id", ids),
          admin.from("user_module_permissions").select("user_id, module").in("user_id", ids),
        ]);
        return json({
          users: users.users.map((u) => ({
            id: u.id,
            email: u.email,
            full_name: (u.user_metadata as any)?.full_name ?? null,
            created_at: u.created_at,
            last_sign_in_at: u.last_sign_in_at,
            roles: (roles ?? []).filter((r) => r.user_id === u.id).map((r) => r.role),
            modules: (perms ?? []).filter((p) => p.user_id === u.id).map((p) => p.module),
          })),
        });
      }

      case "create": {
        const { email, password, full_name, is_admin, modules } = body;
        if (!email || !password) return json({ error: "email and password required" }, 400);
        const { data: created, error } = await admin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { full_name: full_name ?? null },
        });
        if (error) throw error;
        const uid = created.user!.id;
        if (is_admin) {
          await admin.from("user_roles").insert({ user_id: uid, role: "admin" });
        } else {
          await admin.from("user_roles").insert({ user_id: uid, role: "user" });
        }
        if (Array.isArray(modules) && modules.length > 0) {
          await admin
            .from("user_module_permissions")
            .insert(modules.map((m: string) => ({ user_id: uid, module: m })));
        }
        return json({ ok: true, user_id: uid });
      }

      case "update_permissions": {
        const { user_id, modules, is_admin } = body;
        if (!user_id) return json({ error: "user_id required" }, 400);
        // Reset modules
        await admin.from("user_module_permissions").delete().eq("user_id", user_id);
        if (Array.isArray(modules) && modules.length > 0) {
          await admin
            .from("user_module_permissions")
            .insert(modules.map((m: string) => ({ user_id, module: m })));
        }
        // Toggle admin role
        if (typeof is_admin === "boolean") {
          if (is_admin) {
            await admin
              .from("user_roles")
              .upsert({ user_id, role: "admin" }, { onConflict: "user_id,role" });
          } else {
            await admin.from("user_roles").delete().eq("user_id", user_id).eq("role", "admin");
          }
        }
        return json({ ok: true });
      }

      case "delete": {
        const { user_id } = body;
        if (!user_id) return json({ error: "user_id required" }, 400);
        if (user_id === callerId) return json({ error: "Cannot delete self" }, 400);
        const { error } = await admin.auth.admin.deleteUser(user_id);
        if (error) throw error;
        return json({ ok: true });
      }

      case "reset_password": {
        const { user_id, password } = body;
        if (!user_id || !password) return json({ error: "user_id and password required" }, 400);
        const { error } = await admin.auth.admin.updateUserById(user_id, { password });
        if (error) throw error;
        return json({ ok: true });
      }

      default:
        return json({ error: "Unknown action" }, 400);
    }
  } catch (e) {
    console.error("admin-users error", e);
    const msg = (e as any)?.message ?? "Internal error";
    const status = (e as any)?.status ?? 500;
    return json({ error: msg }, status >= 400 && status < 600 ? status : 500);
  }
});