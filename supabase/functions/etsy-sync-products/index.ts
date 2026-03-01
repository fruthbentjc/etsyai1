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

// ── Map Etsy listing to products row ─────────────────────────────────

function mapEtsyStatus(state: string): string {
  switch (state) {
    case "active":
      return "actif";
    case "draft":
      return "brouillon";
    case "inactive":
    case "expired":
    case "removed":
    default:
      return "inactif";
  }
}

interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  price: { amount: number; divisor: number; currency_code: string };
  quantity: number;
  state: string;
  tags: string[];
  taxonomy_id: number;
  views: number;
  num_favorers: number;
  images?: { url_fullxfull: string }[];
}

function listingToProduct(listing: EtsyListing, userId: string) {
  const images = (listing.images || [])
    .map((img: any) => img.url_fullxfull)
    .filter(Boolean);

  return {
    etsy_listing_id: String(listing.listing_id),
    user_id: userId,
    title: listing.title,
    description: listing.description || "",
    price: listing.price.amount / listing.price.divisor,
    stock: listing.quantity,
    status: mapEtsyStatus(listing.state),
    tags: listing.tags || [],
    images,
    views: listing.views || 0,
    favorites: listing.num_favorers || 0,
  };
}

// ── Sync one shop's products ─────────────────────────────────────────

async function syncShopProducts(
  supabaseAdmin: any,
  tokenRow: any,
  apiKey: string
): Promise<{ synced: number; total: number }> {
  const accessToken = await refreshTokenIfNeeded(supabaseAdmin, tokenRow, apiKey);
  const shopId = tokenRow.shop_id;
  if (!shopId) throw new Error("Shop ID manquant");

  // Fetch active listings (paginated)
  let offset = 0;
  const limit = 100;
  let allListings: EtsyListing[] = [];

  while (true) {
    const url = `https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=${limit}&offset=${offset}&includes=Images&state=active`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": apiKey,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Etsy API ${res.status}: ${errText}`);
    }

    const data = await res.json();
    const results: EtsyListing[] = data.results || [];
    allListings = allListings.concat(results);

    if (results.length < limit) break;
    offset += limit;
  }

  // Also fetch draft listings
  try {
    const draftUrl = `https://openapi.etsy.com/v3/application/shops/${shopId}/listings?limit=100&offset=0&includes=Images&state=draft`;
    const draftRes = await fetch(draftUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-api-key": apiKey,
      },
    });
    if (draftRes.ok) {
      const draftData = await draftRes.json();
      allListings = allListings.concat(draftData.results || []);
    }
  } catch (err) {
    console.error("Error fetching draft listings:", err);
  }

  let synced = 0;
  for (const listing of allListings) {
    const product = listingToProduct(listing, tokenRow.user_id);

    const { error: upsertError } = await supabaseAdmin
      .from("products")
      .upsert(product, { onConflict: "etsy_listing_id" });

    if (upsertError) {
      console.error(`Upsert error for listing ${listing.listing_id}:`, upsertError);
    } else {
      synced++;
    }
  }

  return { synced, total: allListings.length };
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

      const result = await syncShopProducts(supabaseAdmin, tokenRow, ETSY_API_KEY);
      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Mode 2: No user auth (cron) → sync ALL connected shops ──
    console.log("Cron mode: syncing all shop products…");

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
        const result = await syncShopProducts(supabaseAdmin, tokenRow, ETSY_API_KEY);
        totalSynced += result.synced;
        console.log(`User ${tokenRow.user_id}: synced ${result.synced}/${result.total} products`);
      } catch (err) {
        errors++;
        console.error(`Error syncing products for user ${tokenRow.user_id}:`, err);
      }
    }

    return new Response(
      JSON.stringify({ success: true, synced: totalSynced, users: allTokens.length, errors }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("etsy-sync-products error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
