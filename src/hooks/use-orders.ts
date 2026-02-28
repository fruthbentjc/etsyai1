import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type OrderStatus = "en_attente" | "expediee" | "livree" | "annulee";

export interface OrderItem {
  productTitle: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer: {
    name: string;
    email: string;
    address: string;
  };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  created_at: string;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  expediee: { label: "Expédiée", className: "bg-primary/15 text-accent-foreground border-primary/30" },
  livree: { label: "Livrée", className: "bg-success/15 text-success border-success/30" },
  annulee: { label: "Annulée", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

function mapRow(row: any): Order {
  return {
    id: row.id,
    order_number: row.order_number,
    customer: row.customer as Order["customer"],
    items: row.items as OrderItem[],
    total: Number(row.total),
    status: row.status as OrderStatus,
    created_at: row.created_at,
    shipped_at: row.shipped_at,
    delivered_at: row.delivered_at,
  };
}

export function useOrders() {
  return useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map(mapRow);
    },
  });
}
