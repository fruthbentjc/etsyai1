import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ETSY_API_KEY = Deno.env.get("ETSY_API_KEY");
    if (!ETSY_API_KEY) throw new Error("ETSY_API_KEY is not configured");

    const { code, state } = await req.json();

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: "Code et state sont requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Decode state to get userId and codeVerifier
    let userId: string;
    let codeVerifier: string;
    try {
      const decoded = JSON.parse(atob(state));
      userId = decoded.userId;
      codeVerifier = decoded.codeVerifier;
    } catch {
      return new Response(
        JSON.stringify({ error: "State invalide" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Exchange code for tokens
    const tokenResponse = await fetch("https://api.etsy.com/v3/public/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: ETSY_API_KEY,
        redirect_uri: req.headers.get("origin") + "/parametres" || "",
        code,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      console.error("Etsy token exchange error:", tokenResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "Échec de l'échange de token Etsy" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    const expiresAt = new Date(Date.now() + expires_in * 1000).toISOString();

    // Get shop info
    let shopId = null;
    let shopName = null;
    try {
      const meResponse = await fetch("https://openapi.etsy.com/v3/application/users/me", {
        headers: {
          Authorization: `Bearer ${access_token}`,
          "x-api-key": ETSY_API_KEY,
        },
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        const etsyUserId = meData.user_id;

        const shopResponse = await fetch(
          `https://openapi.etsy.com/v3/application/users/${etsyUserId}/shops`,
          {
            headers: {
              Authorization: `Bearer ${access_token}`,
              "x-api-key": ETSY_API_KEY,
            },
          }
        );
        if (shopResponse.ok) {
          const shopData = await shopResponse.json();
          if (shopData.results?.length > 0) {
            shopId = String(shopData.results[0].shop_id);
            shopName = shopData.results[0].shop_name;
          }
        }
      }
    } catch (err) {
      console.error("Error fetching shop info:", err);
    }

    // Store tokens using service role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { error: upsertError } = await supabase
      .from("etsy_tokens")
      .upsert(
        {
          user_id: userId,
          access_token,
          refresh_token,
          expires_at: expiresAt,
          shop_id: shopId,
          shop_name: shopName,
        },
        { onConflict: "user_id" }
      );

    if (upsertError) {
      console.error("DB upsert error:", upsertError);
      return new Response(
        JSON.stringify({ error: "Erreur de sauvegarde des tokens" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, shop_name: shopName }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("etsy-callback error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
