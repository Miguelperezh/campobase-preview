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

async function stripeRequest(path: string, secret: string, params: URLSearchParams) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "Stripe rechazó la operación.");
  return data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ message: "Método no permitido." }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const monthlyPrice = Deno.env.get("STRIPE_PRICE_MONTHLY");
  const annualPrice = Deno.env.get("STRIPE_PRICE_ANNUAL");
  const appOrigin = Deno.env.get("APP_ORIGIN") || "https://miguelperezh.github.io";

  if (!supabaseUrl || !anonKey || !serviceKey) return json({ message: "Servicio no disponible." }, 503);
  if (!stripeSecret || !monthlyPrice || !annualPrice) {
    return json({ message: "Los pagos todavía no están configurados." }, 503);
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
  const [{ data: profile }, { data: subscription, error: subError }] = await Promise.all([
    admin.from("perfiles").select("role").eq("id", user.id).maybeSingle(),
    admin.from("suscripciones").select("*").eq("user_id", user.id).maybeSingle(),
  ]);
  if (subError) return json({ message: "No se ha podido comprobar la suscripción." }, 500);
  const giftIsActive = subscription?.estado === "gift_free"
    && (!subscription?.expira_en || new Date(subscription.expira_en).getTime() > Date.now());
  const stripePlanAlreadyActive = Boolean(subscription?.stripe_subscription_id)
    && ["trial", "active"].includes(subscription?.estado || "");
  if (giftIsActive || stripePlanAlreadyActive) {
    return json({ message: "Esta cuenta ya dispone de acceso activo." }, 409);
  }

  let body: { plan?: string; returnUrl?: string } = {};
  try { body = await req.json(); } catch {}
  const plan = body.plan === "annual" ? "annual" : body.plan === "monthly" ? "monthly" : "";
  if (!plan) return json({ message: "Plan no válido." }, 400);

  let returnUrl = "https://miguelperezh.github.io/campobase/";
  try {
    const candidate = new URL(body.returnUrl || returnUrl);
    if (candidate.origin === appOrigin) returnUrl = candidate.href;
  } catch {}

  let customerId = subscription?.stripe_customer_id || "";
  if (!customerId) {
    const customerParams = new URLSearchParams();
    if (user.email) customerParams.set("email", user.email);
    customerParams.set("metadata[user_id]", user.id);
    const customer = await stripeRequest("customers", stripeSecret, customerParams);
    customerId = customer.id;
    await admin
      .from("suscripciones")
      .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
      .eq("user_id", user.id);
  }

  const discount = Math.max(0, Math.min(100, Number(subscription?.pending_discount_percent) || 0));
  let couponId = "";
  if (discount > 0) {
    const couponParams = new URLSearchParams({
      percent_off: String(discount),
      duration: "once",
      name: `Descuento ${discount}%`,
    });
    couponParams.set("metadata[user_id]", user.id);
    couponParams.set("metadata[promo_code]", subscription?.pending_discount_code || "");
    const coupon = await stripeRequest("coupons", stripeSecret, couponParams);
    couponId = coupon.id;
  }

  const priceId = plan === "annual" ? annualPrice : monthlyPrice;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const reservedTrialEnd = subscription?.expira_en
    ? Math.floor(new Date(subscription.expira_en).getTime() / 1000)
    : 0;
  const fallbackTrialEnd = nowSeconds + (14 * 24 * 60 * 60);
  const trialEndSeconds = reservedTrialEnd > nowSeconds ? reservedTrialEnd : fallbackTrialEnd;
  const trialEndsAt = new Date(trialEndSeconds * 1000).toISOString();

  await admin
    .from("suscripciones")
    .update({
      estado: "pending_payment",
      plan: plan === "annual" ? "anual" : "mensual",
      dias_prueba: 14,
      expira_en: trialEndsAt,
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  const sessionParams = new URLSearchParams({
    mode: "subscription",
    customer: customerId,
    payment_method_collection: "always",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    success_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}billing=success`,
    cancel_url: `${returnUrl}${returnUrl.includes("?") ? "&" : "?"}billing=cancel`,
    client_reference_id: user.id,
    "metadata[user_id]": user.id,
    "metadata[plan]": plan === "annual" ? "anual" : "mensual",
    "subscription_data[metadata][user_id]": user.id,
    "subscription_data[metadata][plan]": plan === "annual" ? "anual" : "mensual",
    "subscription_data[metadata][trial_ends_at]": trialEndsAt,
    "subscription_data[trial_end]": String(trialEndSeconds),
    "subscription_data[trial_settings][end_behavior][missing_payment_method]": "cancel",
  });
  if (couponId) sessionParams.set("discounts[0][coupon]", couponId);

  try {
    const session = await stripeRequest("checkout/sessions", stripeSecret, sessionParams);
    return json({ url: session.url, trialEndsAt });
  } catch (error) {
    console.error(error);
    return json({ message: error instanceof Error ? error.message : "No se ha podido iniciar el pago." }, 502);
  }
});
