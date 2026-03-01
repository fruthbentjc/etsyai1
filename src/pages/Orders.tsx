import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ShoppingCart, ChevronRight, Loader2, RefreshCw } from "lucide-react";
import { useOrders, Order, ORDER_STATUS_CONFIG, OrderStatus } from "@/hooks/use-orders";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function Orders() {
  const { data: orders = [], isLoading } = useOrders();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  async function handleSyncEtsy() {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("etsy-sync-orders");
      if (error) throw error;
      if (data?.success) {
        toast.success(`${data.synced} commande(s) synchronisée(s) depuis Etsy`);
        queryClient.invalidateQueries({ queryKey: ["orders"] });
      } else {
        toast.error(data?.error || "Erreur de synchronisation");
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      toast.error(err?.message || "Erreur lors de la synchronisation");
    } finally {
      setSyncing(false);
    }
  }

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusCounts = orders.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Commandes</h1>
          <p className="text-sm text-muted-foreground">{orders.length} commandes au total</p>
        </div>
        <Button variant="outline" onClick={handleSyncEtsy} disabled={syncing}>
          {syncing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sync Etsy
        </Button>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(Object.entries(ORDER_STATUS_CONFIG) as [OrderStatus, { label: string; className: string }][]).map(
          ([key, cfg]) => (
            <Card key={key} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setStatusFilter(key)}>
              <CardContent className="p-4 text-center">
                <p className="font-display text-2xl font-bold">{statusCounts[key] || 0}</p>
                <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
              </CardContent>
            </Card>
          )
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher par nº ou client…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="expediee">Expédiée</SelectItem>
            <SelectItem value="livree">Livrée</SelectItem>
            <SelectItem value="annulee">Annulée</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders list */}
      <div className="space-y-3">
        {filtered.map((o) => {
          const cfg = ORDER_STATUS_CONFIG[o.status];
          return (
            <Card key={o.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedOrder(o)}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-display text-sm font-semibold">{o.order_number}</p>
                    <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{o.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {o.items.length} article(s) — {new Date(o.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span className="font-display text-lg font-bold">{o.total.toFixed(2)} €</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <ShoppingCart className="mx-auto mb-3 h-10 w-10" />
          <p>Aucune commande trouvée</p>
        </div>
      )}

      {/* Order detail dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-lg">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">Commande {selectedOrder.order_number}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Client</p>
                  <p className="text-sm">{selectedOrder.customer.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.customer.email}</p>
                  <p className="text-xs text-muted-foreground">{selectedOrder.customer.address}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Articles</p>
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex justify-between rounded-lg border p-2 mb-2">
                      <div>
                        <p className="text-sm">{item.productTitle}</p>
                        {item.variant && <p className="text-xs text-muted-foreground">{item.variant}</p>}
                      </div>
                      <div className="text-right text-sm">
                        <p>{item.quantity} × {item.price.toFixed(2)} €</p>
                        <p className="font-semibold">{(item.quantity * item.price).toFixed(2)} €</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between border-t pt-3">
                  <span className="font-medium">Total</span>
                  <span className="font-display text-lg font-bold">{selectedOrder.total.toFixed(2)} €</span>
                </div>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Créée : {new Date(selectedOrder.created_at).toLocaleDateString("fr-FR")}</span>
                  {selectedOrder.shipped_at && <span>Expédiée : {new Date(selectedOrder.shipped_at).toLocaleDateString("fr-FR")}</span>}
                  {selectedOrder.delivered_at && <span>Livrée : {new Date(selectedOrder.delivered_at).toLocaleDateString("fr-FR")}</span>}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
