import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type ProductStatus = "actif" | "brouillon" | "inactif";

export interface ProductVariant {
  id: string;
  name: string;
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  status: ProductStatus;
  category: string;
  tags: string[];
  images: string[];
  variants: ProductVariant[];
  views: number;
  favorites: number;
  sales: number;
  created_at: string;
  updated_at: string;
}

export const PRODUCT_STATUS_CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  actif: { label: "Actif", className: "bg-success/15 text-success border-success/30" },
  brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground border-border" },
  inactif: { label: "Inactif", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function mapRow(row: any): Product {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    price: Number(row.price),
    stock: row.stock,
    status: row.status as ProductStatus,
    category: row.category ?? "",
    tags: row.tags ?? [],
    images: row.images ?? [],
    variants: (row.variants as ProductVariant[]) ?? [],
    views: row.views,
    favorites: row.favorites,
    sales: row.sales,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (product: {
      title: string;
      description?: string;
      price: number;
      stock: number;
      category?: string;
      status?: ProductStatus;
      images?: string[];
    }) => {
      const { data, error } = await supabase
        .from("products")
        .insert({
          title: product.title,
          description: product.description ?? "",
          price: product.price,
          stock: product.stock,
          category: product.category ?? "",
          status: product.status ?? "brouillon",
          images: product.images ?? [],
          user_id: user?.id,
        })
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Product> & { id: string }) => {
      const { variants, ...rest } = updates;
      const payload: Record<string, unknown> = { ...rest };
      if (variants !== undefined) payload.variants = JSON.parse(JSON.stringify(variants));
      const { data, error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}
