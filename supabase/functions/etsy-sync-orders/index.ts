import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Helpers ──────────────────────────────────────────────────────────

async function refreshTokenIfNeeded(
  supabase: any,
  tokenRow: any,
  apiKey: string
): Promise<string> {
  const expiresAt = new Date(tokenRow.expires_at).getTime();
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return tokenRow.access_token;
  }

  console.log(`Refreshing Etsy token for user ${tokenRow.user_id}…`);
  const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: apiKey,
      refresh_token: tokenRow.refresh_token,
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Token refresh failed: ${res.status} ${txt}`);
  }

  const data = await res.json();
  const newExpiresAt = new Date(Date.now() + data.expires_in * 1000).toISOString();

  await supabase
    .from("etsy_tokens")
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: newExpiresAt,
    })
    .eq("user_id", tokenRow.user_id);

  return data.access_token;
}

interface EtsyTransaction {
  title: string;
  quantity: number;
  price: { amount: number; divisor: number; currency_code: string };
  variations: { formatted_value: string }[];
}

interface EtsyReceipt {
  receipt_id: number;
  buyer_email: string;
  name: string;
  formatted_address: string;
  grandtotal: { amount: number; divisor: number; currency_code: string };
  status: string;
  create_timestamp: number;
  shipped_timestamp?: number | null;
  delivered_timestamp?: number | null;
  transactions: EtsyTransaction[];
}

function mapEtsyStatus(receipt: EtsyReceipt): string {
  switch (receipt.status) {
    case "paid":
    case "open":
      if (receipt.shipped_timestamp && !receipt.delivered_timestamp) return "expediee";
      return "en_attente";
    case "completed":
      return "livree";
    case "canceled":
      return "annulee";
    default:
      if (receipt.shipped_timestamp && !receipt.delivered_timestamp) return "expediee";
      return "en_attente";
  }
}

// ── Sync one shop ────────────────────────────────────────────────────

async function syncShop(
  supabaseAdmin: any,
  tokenRow: any,
  apiKey: string
): Promise<{ synced: number; total: number }> {
  const accessToken = await refreshTokenIfNeeded(supabaseAdmin, tokenRow, apiKey);
  const shopId = tokenRow.shop_id;
  if (!shopId) throw new Error("Shop ID manquant");

  const receiptsUrl = `https://openapi.etsy.com/v3/application/shops/${shopId}/receipts?limit=100&includes=Transactions`;
  const receiptsRes = await fetch(receiptsUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-api-key": apiKey,
    },
  });

  if (!receiptsRes.ok) {
    const errText = await receiptsRes.text();
    throw new Error(`Etsy API ${receiptsRes.status}: ${errText}`);
  }

  const receiptsData = await receiptsRes.json();
  const receipts: EtsyReceipt[] = receiptsData.results || [];

  let synced = 0;
  for (const receipt of receipts) {
    const orderNumber = `ETSY-${receipt.receipt_id}`;
    const items = (receipt.transactions || []).map((t: EtsyTransaction) => ({
      productTitle: t.title,
      quantity: t.quantity,
      price: t.price.amount / t.price.divisor,
      variant: t.variations?.map((v) => v.formatted_value).join(", ") || undefined,
    }));

    const { error: upsertError } = await supabaseAdmin.from("orders").upsert(
      {
        order_number: orderNumber,
        user_id: tokenRow.user_id,
        customer: {
          name: receipt.name || "Client Etsy",
          email: receipt.buyer_email || "",
          address: receipt.formatted_address || "",
        },
        items,
        total: receipt.grandtotal.amount / receipt.grandtotal.divisor,
        status: mapEtsyStatus(receipt),
        created_at: new Date(receipt.create_timestamp * 1000).toISOString(),
        shipped_at: receipt.shipped_timestamp
          ? new Date(receipt.shipped_timestamp * 1000).toISOString()
          : null,
        delivered_at: receipt.delivered_timestamp
          ? new Date(receipt.delivered_timestamp * 1000).toISOString()
          : null,
      },
      { onConflict: "order_number" }
    );

    if (upsertError) {
      console.error(`Upsert error for ${orderNumber}:`, upsertError);
    } else {
      synced++;
    }
  }

  return { synced, total: receipts.length };
}

// ── Main handler ─────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ETSY_API_KEY = Deno.env.get("ETSY_API_KEY");
    if (!ETSY_API_KEY) throw new Error("ETSY_API_KEY is not configured");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");

    // ── Mode 1: Authenticated user → sync only their shop ──
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseUser = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
      if (userError || !user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: tokenRow } = await supabaseAdmin
        .from("etsy_tokens")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!tokenRow) {
        return new Response(
          JSON.stringify({ error: "Boutique Etsy non connectée" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await syncShop(supabaseAdmin, tokenRow, ETSY_API_KEY);
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Mode 2: No user auth (cron) → sync ALL connected shops ──
    console.log("Cron mode: syncing all connected Etsy shops…");

    const { data: allTokens, error: tokensError } = await supabaseAdmin
      .from("etsy_tokens")
      .select("*");

    if (tokensError) throw tokensError;
    if (!allTokens || allTokens.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No connected shops", synced: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let totalSynced = 0;
    let errors = 0;
    for (const tokenRow of allTokens) {
      try {
        const result = await syncShop(supabaseAdmin, tokenRow, ETSY_API_KEY);
        totalSynced += result.synced;
        console.log(`User ${tokenRow.user_id}: synced ${result.synced}/${result.total}`);
      } catch (err) {
        errors++;
        console.error(`Error syncing user ${tokenRow.user_id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: totalSynced, users: allTokens.length, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("etsy-sync-orders error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
