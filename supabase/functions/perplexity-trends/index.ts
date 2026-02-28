import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { query, type } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: "La requête de recherche est requise." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    if (!PERPLEXITY_API_KEY) {
      throw new Error("PERPLEXITY_API_KEY is not configured");
    }

    let systemPrompt = "";
    let userPrompt = "";

    switch (type) {
      case "trends":
        systemPrompt = `Tu es un expert en analyse de marché Etsy. Tu fournis des analyses précises et sourcées sur les tendances actuelles.
Réponds en français. Structure ta réponse en sections claires avec des titres en markdown.
Inclus toujours : les produits tendance, les niches en croissance, les catégories populaires et des conseils actionnables.`;
        userPrompt = `Analyse les tendances actuelles sur Etsy pour : ${query}. 
Donne les produits les plus populaires, les niches émergentes, et des recommandations concrètes pour un vendeur.`;
        break;

      case "competition":
        systemPrompt = `Tu es un expert en analyse concurrentielle sur Etsy. Tu fournis des analyses détaillées et sourcées.
Réponds en français. Structure ta réponse en sections claires avec des titres en markdown.
Inclus : positionnement prix, stratégies des concurrents, opportunités de différenciation.`;
        userPrompt = `Fais une analyse concurrentielle sur Etsy pour : ${query}.
Compare les stratégies de prix, les mots-clés utilisés, les forces et faiblesses des concurrents, et identifie des opportunités.`;
        break;

      case "seo":
        systemPrompt = `Tu es un expert SEO Etsy. Tu connais parfaitement l'algorithme de recherche Etsy et les meilleures pratiques de référencement.
Réponds en français. Structure ta réponse en sections claires avec des titres en markdown.
Inclus : mots-clés principaux, mots-clés longue traîne, tags recommandés, conseils d'optimisation.`;
        userPrompt = `Recherche les meilleurs mots-clés et tags SEO Etsy pour : ${query}.
Donne les mots-clés principaux, les variantes longue traîne, les tags recommandés (max 13 tags Etsy), et des conseils d'optimisation du listing.`;
        break;

      default:
        systemPrompt = `Tu es un assistant expert en vente sur Etsy. Réponds en français de manière précise et sourcée.`;
        userPrompt = query;
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Perplexity API error:", response.status, text);
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requêtes Perplexity atteinte. Réessayez dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erreur du service Perplexity" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const citations = data.citations ?? [];

    return new Response(
      JSON.stringify({ content, citations }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("perplexity-trends error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
