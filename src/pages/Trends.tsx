import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, TrendingUp, Users, Tag, Loader2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type SearchType = "trends" | "competition" | "seo";

const searchTypes: { value: SearchType; label: string; icon: React.ElementType; description: string }[] = [
  { value: "trends", label: "Tendances", icon: TrendingUp, description: "Produits populaires et niches en croissance" },
  { value: "competition", label: "Concurrence", icon: Users, description: "Analyse concurrentielle et positionnement" },
  { value: "seo", label: "Mots-clés SEO", icon: Tag, description: "Tags et mots-clés optimisés pour Etsy" },
];

export default function Trends() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<SearchType>("trends");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ content: string; citations: string[] } | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.error("Veuillez entrer un terme de recherche");
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("perplexity-trends", {
        body: { query: query.trim(), type: activeTab },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setResult(data);
    } catch (e: any) {
      console.error("Perplexity error:", e);
      toast.error(e.message || "Erreur lors de la recherche");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMarkdown = (text: string) => {
    // Simple markdown rendering
    return text.split("\n").map((line, i) => {
      if (line.startsWith("### ")) return <h3 key={i} className="text-base font-semibold mt-4 mb-1">{line.slice(4)}</h3>;
      if (line.startsWith("## ")) return <h2 key={i} className="text-lg font-bold mt-5 mb-2">{line.slice(3)}</h2>;
      if (line.startsWith("# ")) return <h1 key={i} className="text-xl font-bold mt-6 mb-2">{line.slice(2)}</h1>;
      if (line.startsWith("- ") || line.startsWith("* ")) return <li key={i} className="ml-4 text-sm text-muted-foreground">{line.slice(2)}</li>;
      if (line.match(/^\d+\.\s/)) return <li key={i} className="ml-4 text-sm text-muted-foreground list-decimal">{line.replace(/^\d+\.\s/, "")}</li>;
      if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-sm mt-2">{line.slice(2, -2)}</p>;
      if (line.trim() === "") return <br key={i} />;
      // Handle inline bold
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={i} className="text-sm text-muted-foreground leading-relaxed">
          {parts.map((part, j) =>
            part.startsWith("**") && part.endsWith("**")
              ? <strong key={j} className="text-foreground">{part.slice(2, -2)}</strong>
              : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Tendances Etsy</h1>
        <p className="text-sm text-muted-foreground">
          Recherche en temps réel powered by Perplexity AI
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as SearchType)}>
            <TabsList className="grid w-full grid-cols-3">
              {searchTypes.map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="gap-2">
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-3">
                {searchTypes.find((t) => t.value === activeTab)?.description}
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder={
                    activeTab === "trends"
                      ? "Ex: bijoux en résine, bougies artisanales..."
                      : activeTab === "competition"
                      ? "Ex: stickers personnalisés, impression 3D..."
                      : "Ex: collier fait main, cadeau personnalisé..."
                  }
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !isLoading && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  <span className="hidden sm:inline ml-2">Rechercher</span>
                </Button>
              </div>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Analyse en cours avec Perplexity AI...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-base">Résultats</CardTitle>
                <CardDescription>Analyse pour « {query} »</CardDescription>
              </div>
              <Badge variant="outline" className="bg-primary/15 text-primary border-primary/30">
                <Search className="mr-1 h-3 w-3" /> Perplexity
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="prose prose-sm max-w-none">
              {renderMarkdown(result.content)}
            </div>

            {result.citations && result.citations.length > 0 && (
              <div className="border-t pt-4 mt-6">
                <p className="text-xs font-medium text-muted-foreground mb-2">Sources ({result.citations.length})</p>
                <div className="flex flex-wrap gap-2">
                  {result.citations.map((url, i) => (
                    <a
                      key={i}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" />
                      {new URL(url).hostname.replace("www.", "")}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
