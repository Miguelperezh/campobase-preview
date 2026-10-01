import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ message: "Método no permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey || !stripeSecret) {
    return json({ message: "La cancelación todavía no está configurada." }, 503);
  }

  const authorization = req.headers.get("Authorization") || "";
  const authClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await authClient.auth.getUser();
  const user = userData?.user;
  if (userError || !user) return json({ message: "Sesión no válida." }, 401);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const [{ data: profile }, { data: subscription, error: subscriptionError }] = await Promise.all([
    admin.from("perfiles").select("role").eq("id", user.id).maybeSingle(),
    admin.from("suscripciones").select("*").eq("user_id", user.id).maybeSingle(),
  ]);

  if (profile?.role === "delegate") {
    return json({ message: "La suscripción la gestiona el titular del equipo." }, 403);
  }
  if (subscriptionError || !subscription?.stripe_subscription_id) {
    return json({ message: "No hay una suscripción de Stripe que cancelar." }, 404);
  }

  const params = new URLSearchParams({ cancel_at_period_end: "true" });
  const response = await fetch(
    `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscription.stripe_subscription_id)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecret}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );
  const stripeSub = await response.json();
  if (!response.ok) {
    return json({ message: stripeSub?.error?.message || "No se pudo cancelar la renovación." }, 502);
  }

  const expirySeconds = stripeSub.status === "trialing" && Number(stripeSub.trial_end)
    ? Number(stripeSub.trial_end)
    : Number(stripeSub.current_period_end);
  const expiresAt = expirySeconds
    ? new Date(expirySeconds * 1000).toISOString()
    : subscription.expira_en;

  await admin.from("suscripciones").update({
    cancel_at_period_end: true,
    expira_en: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq("user_id", user.id);

  return json({
    success: true,
    status: stripeSub.status,
    expiresAt,
    message: stripeSub.status === "trialing"
      ? "La prueba quedará cancelada al terminar y no se realizará el primer cobro."
      : "La renovación queda cancelada. Mantienes acceso hasta el final del periodo actual.",
  });
});
