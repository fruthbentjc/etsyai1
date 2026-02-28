import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Eye, Heart, ShoppingCart, Pencil, Trash2, Package, Loader2, Sparkles } from "lucide-react";
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct, Product, PRODUCT_STATUS_CONFIG, ProductStatus } from "@/hooks/use-products";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  const filtered = products.filter((p) => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleDelete = (id: string) => {
    deleteProduct.mutate(id, { onSuccess: () => toast({ title: "Produit supprimé" }) });
  };

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = {
      title: fd.get("title") as string,
      description: fd.get("description") as string,
      price: parseFloat(fd.get("price") as string) || 0,
      stock: parseInt(fd.get("stock") as string) || 0,
      category: fd.get("category") as string,
      status: (fd.get("status") as ProductStatus) || "brouillon",
    };

    if (editProduct) {
      updateProduct.mutate({ id: editProduct.id, ...data }, {
        onSuccess: () => { toast({ title: "Produit modifié" }); setDialogOpen(false); setEditProduct(null); },
      });
    } else {
      createProduct.mutate(data, {
        onSuccess: () => { toast({ title: "Produit créé" }); setDialogOpen(false); },
      });
    }
  };

  const openEdit = (p: Product) => { setEditProduct(p); setDialogOpen(true); };
  const openCreate = () => { setEditProduct(null); setDialogOpen(true); };

  const handleGenerateDescription = async (form: HTMLFormElement) => {
    const fd = new FormData(form);
    const title = fd.get("title") as string;
    if (!title) {
      toast({ title: "Entrez un titre d'abord", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-description", {
        body: { title, category: fd.get("category") as string, price: fd.get("price") as string },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const textarea = form.querySelector<HTMLTextAreaElement>("#description");
      if (textarea && data?.description) {
        // Use native setter to update the value properly
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
        nativeSetter?.call(textarea, data.description);
        textarea.dispatchEvent(new Event("input", { bubbles: true }));
      }
      toast({ title: "Description générée ✨" });
    } catch (e: any) {
      toast({ title: "Erreur IA", description: e.message, variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Produits</h1>
          <p className="text-sm text-muted-foreground">{products.length} produits au total</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditProduct(null); }}>
          <DialogTrigger asChild>
            <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editProduct ? "Modifier le produit" : "Nouveau produit"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" name="title" defaultValue={editProduct?.title ?? ""} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="description">Description</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1 text-xs"
                    disabled={isGenerating}
                    onClick={(e) => {
                      const form = (e.target as HTMLElement).closest("form");
                      if (form) handleGenerateDescription(form);
                    }}
                  >
                    {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                    {isGenerating ? "Génération…" : "Générer avec l'IA"}
                  </Button>
                </div>
                <Textarea id="description" name="description" defaultValue={editProduct?.description ?? ""} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€)</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editProduct?.price ?? ""} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock</Label>
                  <Input id="stock" name="stock" type="number" defaultValue={editProduct?.stock ?? ""} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Catégorie</Label>
                  <Input id="category" name="category" defaultValue={editProduct?.category ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <select name="status" id="status" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={editProduct?.status ?? "brouillon"}>
                    <option value="brouillon">Brouillon</option>
                    <option value="actif">Actif</option>
                    <option value="inactif">Inactif</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button type="submit" disabled={createProduct.isPending || updateProduct.isPending}>
                  {(createProduct.isPending || updateProduct.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editProduct ? "Enregistrer" : "Créer"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Rechercher un produit…" className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="actif">Actif</SelectItem>
            <SelectItem value="brouillon">Brouillon</SelectItem>
            <SelectItem value="inactif">Inactif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const cfg = PRODUCT_STATUS_CONFIG[p.status];
          return (
            <Card key={p.id} className="group overflow-hidden">
              <div className="aspect-[4/3] bg-muted relative">
                <img src={p.images[0] || "/placeholder.svg"} alt={p.title} className="h-full w-full object-cover" />
                <Badge variant="outline" className={`absolute right-2 top-2 ${cfg.className}`}>{cfg.label}</Badge>
              </div>
              <CardContent className="p-4">
                <h3 className="truncate font-display text-sm font-semibold">{p.title}</h3>
                <p className="text-xs text-muted-foreground">{p.category}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-display text-lg font-bold text-primary">{p.price.toFixed(2)} €</span>
                  <span className="text-xs text-muted-foreground">Stock : {p.stock}</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> {p.views}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {p.favorites}</span>
                  <span className="flex items-center gap-1"><ShoppingCart className="h-3 w-3" /> {p.sales}</span>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                    <Pencil className="mr-1 h-3 w-3" /> Modifier
                  </Button>
                  <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          <Package className="mx-auto mb-3 h-10 w-10" />
          <p>Aucun produit trouvé</p>
        </div>
      )}
    </div>
  );
}
