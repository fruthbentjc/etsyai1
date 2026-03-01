import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Key, Store, Globe, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [etsyConnected, setEtsyConnected] = useState(false);
  const [shopName, setShopName] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Check Etsy connection status
  useEffect(() => {
    async function checkConnection() {
      if (!user) return;
      const { data } = await supabase
        .from("etsy_tokens")
        .select("shop_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setEtsyConnected(true);
        setShopName(data.shop_name);
      }
      setLoadingStatus(false);
    }
    checkConnection();
  }, [user]);

  // Handle OAuth callback
  useEffect(() => {
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (code && state) {
      handleCallback(code, state);
      // Clean URL
      setSearchParams({}, { replace: true });
    }
  }, [searchParams]);

  async function handleCallback(code: string, state: string) {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke("etsy-callback", {
        body: { code, state },
      });

      if (error) throw error;
      if (data?.success) {
        setEtsyConnected(true);
        setShopName(data.shop_name);
        toast.success("Boutique Etsy connectée avec succès !");
      }
    } catch (err) {
      console.error("Callback error:", err);
      toast.error("Erreur lors de la connexion Etsy");
    } finally {
      setConnecting(false);
    }
  }

  async function handleConnectEtsy() {
    setConnecting(true);
    try {
      const redirectUri = window.location.origin + "/parametres";
      const { data, error } = await supabase.functions.invoke("etsy-auth", {
        body: { redirect_uri: redirectUri },
      });

      if (error) throw error;
      if (data?.auth_url) {
        window.location.href = data.auth_url;
      }
    } catch (err) {
      console.error("Auth error:", err);
      toast.error("Erreur lors de l'initialisation OAuth");
      setConnecting(false);
    }
  }

  async function handleDisconnectEtsy() {
    if (!user) return;
    const { error } = await supabase
      .from("etsy_tokens")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erreur lors de la déconnexion");
    } else {
      setEtsyConnected(false);
      setShopName(null);
      toast.success("Boutique Etsy déconnectée");
    }
  }

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
          {loadingStatus ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Vérification...</span>
            </div>
          ) : etsyConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-green-500/15 text-green-700 border-green-500/30">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Connecté
                  </Badge>
                  {shopName && <span className="text-sm font-medium">{shopName}</span>}
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnectEtsy}>
                  Déconnecter
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-destructive/15 text-destructive border-destructive/30">
                Non connecté
              </Badge>
              <Button onClick={handleConnectEtsy} disabled={connecting}>
                {connecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Connecter Etsy
                  </>
                )}
              </Button>
            </div>
          )}
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
