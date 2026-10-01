import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const ALLOWED_VIEWS = new Set([
  "delegado","hoy","plantilla","cuerpo-tecnico","asistencia",
  "convocatorias","preparacion","partido","calendario",
  "sesiones","ejercicios","tacticas"
]);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function cleanPermissions(input: unknown) {
  const list = Array.isArray(input) ? input : [];
  const clean = [...new Set(list.map(String).filter((value) => ALLOWED_VIEWS.has(value)))];
  if (!clean.includes("delegado")) clean.push("delegado");
  return clean.sort();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ message: "Método no permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const appUrl = Deno.env.get("APP_URL") || "https://miguelperezh.github.io/campobase/";
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ message: "Servicio no disponible." }, 503);

  const authorization = req.headers.get("Authorization") || "";
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return json({ message: "Sesión no válida." }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data: ownerProfile } = await admin.from("perfiles").select("role").eq("id", user.id).maybeSingle();
  if (!ownerProfile || !["owner","admin","coach"].includes(ownerProfile.role)) {
    return json({ message: "Solo el titular del equipo puede gestionar al delegado." }, 403);
  }

  const { data: team, error: teamError } = await admin
    .from("equipos_cuenta")
    .select("id,nombre,owner_user_id")
    .eq("owner_user_id", user.id)
    .maybeSingle();
  if (teamError || !team) return json({ message: "No se ha encontrado el equipo de esta cuenta." }, 404);

  let body: { email?: string; fullName?: string; permissions?: string[] } = {};
  try { body = await req.json(); } catch {}
  const email = String(body.email || "").trim().toLowerCase();
  const fullName = String(body.fullName || "").trim();
  const permissions = cleanPermissions(body.permissions);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ message: "Introduce un correo válido para el delegado." }, 400);
  }

  const { data: currentDelegate } = await admin
    .from("equipo_miembros")
    .select("user_id")
    .eq("equipo_id", team.id)
    .eq("role", "delegate")
    .maybeSingle();
  if (currentDelegate?.user_id) {
    return json({ message: "Este equipo ya tiene una cuenta de delegado asociada." }, 409);
  }

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: appUrl,
    data: {
      full_name: fullName,
      club_name: team.nombre,
      account_role: "delegate",
      must_set_password: true,
    },
  });
  if (inviteError || !invited?.user?.id) {
    const message = /already|registered|exists/i.test(inviteError?.message || "")
      ? "Ese correo ya pertenece a otra cuenta. Usa otro correo para el delegado."
      : (inviteError?.message || "No se pudo crear la invitación del delegado.");
    return json({ message }, 400);
  }

  const delegateId = invited.user.id;

  try {
    // El trigger general crea cualquier usuario como entrenador con equipo y prueba.
    // Para una invitación de delegado se elimina ese equipo provisional y se asocia
    // únicamente al equipo del titular.
    await admin.from("suscripciones").delete().eq("user_id", delegateId);
    await admin.from("equipos_cuenta").delete().eq("owner_user_id", delegateId);
    await admin.from("perfiles").update({
      role: "delegate",
      club_name: team.nombre,
      full_name: fullName,
      updated_at: new Date().toISOString(),
    }).eq("id", delegateId);

    const { error: memberError } = await admin.from("equipo_miembros").insert({
      equipo_id: team.id,
      user_id: delegateId,
      role: "delegate",
      view_permissions: permissions,
    });
    if (memberError) throw memberError;
  } catch (error) {
    await admin.auth.admin.deleteUser(delegateId).catch(() => {});
    console.error(error);
    return json({ message: "No se pudo asociar la cuenta de delegado al equipo." }, 500);
  }

  return json({
    success: true,
    delegate: {
      user_id: delegateId,
      email,
      full_name: fullName,
      view_permissions: permissions,
    },
  });
});
