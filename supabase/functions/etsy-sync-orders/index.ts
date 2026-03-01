import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function refreshTokenIfNeeded(
  supabase: any,
  tokenRow: any,
  apiKey: string
): Promise<string> {
  const expiresAt = new Date(tokenRow.expires_at).getTime();
  // Refresh if expiring within 5 minutes
  if (Date.now() < expiresAt - 5 * 60 * 1000) {
    return tokenRow.access_token;
  }

  console.log("Refreshing Etsy token…");
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

function mapEtsyStatus(status: string): string {
  switch (status) {
    case "paid":
    case "open":
      return "en_attente";
    case "completed":
      return "livree";
    case "canceled":
      return "annulee";
    default:
      // If the receipt has shipped info, we handle it below
      return "en_attente";
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ETSY_API_KEY = Deno.env.get("ETSY_API_KEY");
    if (!ETSY_API_KEY) throw new Error("ETSY_API_KEY is not configured");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    // Get Etsy tokens
    const { data: tokenRow, error: tokenError } = await supabaseAdmin
      .from("etsy_tokens")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (tokenError || !tokenRow) {
      return new Response(
        JSON.stringify({ error: "Boutique Etsy non connectée" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const shopId = tokenRow.shop_id;
    if (!shopId) {
      return new Response(
        JSON.stringify({ error: "Shop ID manquant" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Refresh token if needed
    const accessToken = await refreshTokenIfNeeded(supabaseAdmin, tokenRow, ETSY_API_KEY);

    // Fetch receipts from Etsy (last 100)
    const receiptsUrl = `https://openapi.etsy.com/v3/application/shops/${shopId}/receipts?limit=100&includes=Transactions`;
    const receiptsRes = await fetch(receiptsUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": ETSY_API_KEY,
      },
    });

    if (!receiptsRes.ok) {
      const errText = await receiptsRes.text();
      console.error("Etsy receipts error:", receiptsRes.status, errText);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la récupération des commandes Etsy" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const receiptsData = await receiptsRes.json();
    const receipts: EtsyReceipt[] = receiptsData.results || [];

    // Map and upsert orders
    let synced = 0;
    for (const receipt of receipts) {
      const orderNumber = `ETSY-${receipt.receipt_id}`;
      const items = (receipt.transactions || []).map((t: EtsyTransaction) => ({
        productTitle: t.title,
        quantity: t.quantity,
        price: t.price.amount / t.price.divisor,
        variant: t.variations?.map((v) => v.formatted_value).join(", ") || undefined,
      }));

      const total = receipt.grandtotal.amount / receipt.grandtotal.divisor;

      let status = mapEtsyStatus(receipt.status);
      // Override with shipped if we have shipped_timestamp but not delivered
      if (receipt.shipped_timestamp && !receipt.delivered_timestamp && status === "en_attente") {
        status = "expediee";
      }

      const createdAt = new Date(receipt.create_timestamp * 1000).toISOString();
      const shippedAt = receipt.shipped_timestamp
        ? new Date(receipt.shipped_timestamp * 1000).toISOString()
        : null;
      const deliveredAt = receipt.delivered_timestamp
        ? new Date(receipt.delivered_timestamp * 1000).toISOString()
        : null;

      const { error: upsertError } = await supabaseAdmin
        .from("orders")
        .upsert(
          {
            order_number: orderNumber,
            user_id: userId,
            customer: {
              name: receipt.name || "Client Etsy",
              email: receipt.buyer_email || "",
              address: receipt.formatted_address || "",
            },
            items,
            total,
            status,
            created_at: createdAt,
            shipped_at: shippedAt,
            delivered_at: deliveredAt,
          },
          { onConflict: "order_number" }
        );

      if (upsertError) {
        console.error(`Upsert error for ${orderNumber}:`, upsertError);
      } else {
        synced++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced, total: receipts.length }),
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
