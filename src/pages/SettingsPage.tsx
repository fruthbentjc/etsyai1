import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Key, Store, Globe } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display text-2xl font-bold">Paramètres</h1>
        <p className="text-sm text-muted-foreground">Configuration de votre boutique et des clés API</p>
      </div>

      {/* Etsy Connection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Connexion Etsy</CardTitle>
              <CardDescription>Connectez votre boutique Etsy via OAuth 2.0</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">Non connecté</Badge>
            <Button disabled>Connecter Etsy</Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Nécessite Lovable Cloud pour les edge functions sécurisées.</p>
        </CardContent>
      </Card>

      {/* API Keys */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Key className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Clés API (IA)</CardTitle>
              <CardDescription>Vos propres clés API pour les modèles IA (optionnel)</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openai">OpenAI (GPT)</Label>
            <Input id="openai" type="password" placeholder="sk-..." disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="anthropic">Anthropic (Claude)</Label>
            <Input id="anthropic" type="password" placeholder="sk-ant-..." disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="perplexity">Perplexity</Label>
            <Input id="perplexity" type="password" placeholder="pplx-..." disabled />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <p className="text-sm font-medium">Mode BYOK</p>
              <p className="text-xs text-muted-foreground">Utiliser vos propres clés API</p>
            </div>
            <Switch disabled />
          </div>
          <p className="text-xs text-muted-foreground">Les clés API seront stockées de manière sécurisée via Lovable Cloud.</p>
        </CardContent>
      </Card>

      {/* General */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Globe className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="font-display text-base">Général</CardTitle>
              <CardDescription>Préférences de l'application</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shopName">Nom de la boutique</Label>
            <Input id="shopName" defaultValue="Ma Boutique Créative" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="currency">Devise</Label>
            <Input id="currency" defaultValue="EUR (€)" disabled />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
