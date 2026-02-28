import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Search, BarChart3, MessageSquare, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

const aiModules = [
  {
    title: "Lovable AI (Gemini)",
    description: "Génération de contenu : descriptions produits, titres optimisés, traduction multilingue.",
    icon: Sparkles,
    status: "Actif",
    active: true,
    color: "text-primary",
    tasks: ["Rédaction de descriptions", "Suggestions de titres SEO", "Traduction multilingue"],
  },
  {
    title: "Perplexity",
    description: "Recherche & veille marché : tendances Etsy, analyse concurrentielle, mots-clés SEO.",
    icon: Search,
    status: "Actif",
    active: true,
    color: "text-primary",
    tasks: ["Tendances Etsy", "Analyse concurrentielle", "Recherche SEO"],
  },
  {
    title: "OpenAI (GPT)",
    description: "Analyse avancée & stratégie : performance produits, recommandations pricing, prédictions.",
    icon: BarChart3,
    status: "Disponible bientôt",
    active: false,
    tasks: ["Analyse de performance", "Recommandations de prix", "Prédictions de ventes"],
  },
  {
    title: "Claude",
    description: "Assistant conversationnel : réponses à vos questions, rédaction de messages, conseils personnalisés.",
    icon: MessageSquare,
    status: "Disponible bientôt",
    active: false,
    tasks: ["Chat intelligent", "Rédaction de messages clients", "Conseils personnalisés"],
  },
];

export default function AITools() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Outils IA</h1>
        <p className="text-sm text-muted-foreground">
          Chaque modèle IA est spécialisé pour une tâche précise
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {aiModules.map((m) => (
          <Card key={m.title} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <m.icon className={`h-5 w-5 ${m.active ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <Badge variant="outline" className={m.active ? "bg-primary/15 text-primary border-primary/30" : "bg-muted text-muted-foreground"}>
                  {m.active ? <Sparkles className="mr-1 h-3 w-3" /> : <Lock className="mr-1 h-3 w-3" />} {m.status}
                </Badge>
              </div>
              <CardTitle className="font-display text-base">{m.title}</CardTitle>
              <CardDescription>{m.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {m.tasks.map((t) => (
                  <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                    {t}
                  </div>
                ))}
              </div>
              <Button className="mt-4 w-full" variant={m.active ? "default" : "outline"} disabled={!m.active} onClick={() => { if (m.active) window.location.href = m.title === "Perplexity" ? "/tendances" : "/produits"; }}>
                {m.active ? (m.title === "Perplexity" ? "Rechercher des tendances" : "Utiliser dans Produits") : "Bientôt disponible"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
