import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hex(bytes: Uint8Array) {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function validStripeSignature(payload: string, header: string, secret: string) {
  const parts = header.split(",").map((item) => item.trim());
  const timestamp = parts.find((item) => item.startsWith("t="))?.slice(2);
  const signatures = parts.filter((item) => item.startsWith("v1=")).map((item) => item.slice(3));
  if (!timestamp || !signatures.length) return false;
  const age = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(age) || age > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${payload}`),
  );
  const expected = hex(new Uint8Array(signature));
  return signatures.some((value) => timingSafeEqual(expected, value));
}

async function stripeGet(path: string, secret: string) {
  const response = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { Authorization: `Bearer ${secret}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data?.error?.message || "No se pudo consultar Stripe.");
  return data;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ message: "Método no permitido." }, 405);

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const stripeSecret = Deno.env.get("STRIPE_SECRET_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!webhookSecret || !stripeSecret || !supabaseUrl || !serviceKey) {
    return json({ message: "Webhook no configurado." }, 503);
  }

  const payload = await req.text();
  const signature = req.headers.get("stripe-signature") || "";
  if (!await validStripeSignature(payload, signature, webhookSecret)) {
    return json({ message: "Firma no válida." }, 401);
  }

  let event: any;
  try { event = JSON.parse(payload); } catch { return json({ message: "JSON no válido." }, 400); }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const object = event?.data?.object || {};

  async function updateFromSubscription(subscriptionId: string, fallbackUserId = "", fallbackPlan = "") {
    const stripeSub = await stripeGet(`subscriptions/${encodeURIComponent(subscriptionId)}`, stripeSecret);
    let userId = stripeSub?.metadata?.user_id || fallbackUserId;
    const plan = stripeSub?.metadata?.plan || fallbackPlan || "mensual";
    if (!userId) {
      const { data } = await admin
        .from("suscripciones")
        .select("user_id")
        .eq("stripe_subscription_id", subscriptionId)
        .maybeSingle();
      userId = data?.user_id || "";
    }
    if (!userId) return;

    const status = stripeSub.status === "trialing"
      ? "trial"
      : stripeSub.status === "active"
        ? "active"
        : stripeSub.status === "canceled"
          ? "inactive"
          : stripeSub.status;
    const expirySeconds = stripeSub.status === "trialing" && Number(stripeSub.trial_end)
      ? Number(stripeSub.trial_end)
      : Number(stripeSub.current_period_end);
    const expires = expirySeconds
      ? new Date(expirySeconds * 1000).toISOString()
      : null;

    await admin.from("suscripciones").update({
      estado: status,
      plan: plan === "anual" ? "anual" : "mensual",
      stripe_customer_id: typeof stripeSub.customer === "string" ? stripeSub.customer : stripeSub.customer?.id || null,
      stripe_subscription_id: stripeSub.id,
      expira_en: expires,
      cancel_at_period_end: Boolean(stripeSub.cancel_at_period_end),
      updated_at: new Date().toISOString(),
    }).eq("user_id", userId);
  }

  try {
    if (event.type === "checkout.session.completed" && object.subscription) {
      const userId = object.metadata?.user_id || object.client_reference_id || "";
      const plan = object.metadata?.plan || "mensual";
      await updateFromSubscription(String(object.subscription), userId, plan);
      if (userId) {
        await admin.from("suscripciones").update({
          pending_discount_code: null,
          pending_discount_percent: 0,
          promo_code: null,
          updated_at: new Date().toISOString(),
        }).eq("user_id", userId);
      }
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      if (object.id) await updateFromSubscription(String(object.id), object.metadata?.user_id || "", object.metadata?.plan || "");
    } else if (event.type === "customer.subscription.deleted") {
      const userId = object.metadata?.user_id || "";
      const query = admin.from("suscripciones").update({
        estado: "inactive",
        expira_en: object.current_period_end ? new Date(Number(object.current_period_end) * 1000).toISOString() : new Date().toISOString(),
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      });
      if (userId) await query.eq("user_id", userId);
      else if (object.id) await query.eq("stripe_subscription_id", object.id);
    } else if (event.type === "invoice.payment_failed" && object.subscription) {
      await admin.from("suscripciones").update({
        estado: "past_due",
        updated_at: new Date().toISOString(),
      }).eq("stripe_subscription_id", String(object.subscription));
    }
  } catch (error) {
    console.error("Webhook error", error);
    return json({ message: "No se pudo procesar el evento." }, 500);
  }

  return json({ received: true });
});
