import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, ShoppingCart, Euro, TrendingUp, Eye, Heart } from "lucide-react";
import { mockProducts, mockOrders, salesData, ORDER_STATUS_CONFIG } from "@/data/mock-data";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const stats = [
  {
    label: "Produits actifs",
    value: mockProducts.filter((p) => p.status === "actif").length,
    icon: Package,
    change: "+2 ce mois",
  },
  {
    label: "Commandes",
    value: mockOrders.length,
    icon: ShoppingCart,
    change: "+3 cette semaine",
  },
  {
    label: "Chiffre d'affaires",
    value: `${mockOrders.reduce((s, o) => s + o.total, 0).toFixed(0)} €`,
    icon: Euro,
    change: "+12%",
  },
  {
    label: "Vues totales",
    value: mockProducts.reduce((s, p) => s + p.views, 0).toLocaleString("fr-FR"),
    icon: Eye,
    change: "+8%",
  },
];

export default function Dashboard() {
  const recentOrders = [...mockOrders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  ).slice(0, 4);

  const topProducts = [...mockProducts].sort((a, b) => b.sales - a.sales).slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold">Tableau de bord</h1>
        <p className="text-sm text-muted-foreground">Vue d'ensemble de votre boutique Etsy</p>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="font-display text-xl font-bold">{s.value}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-success" /> {s.change}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chart */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="font-display text-base">Chiffre d'affaires (6 mois)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                    }}
                    formatter={(value: number) => [`${value} €`, "Revenus"]}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top products */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-display text-base">Produits populaires</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-lg bg-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Heart className="h-3 w-3" /> {p.favorites}</span>
                    <span>{p.sales} ventes</span>
                  </div>
                </div>
                <span className="font-display text-sm font-semibold">{p.price.toFixed(2)} €</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-base">Commandes récentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.map((o) => {
              const cfg = ORDER_STATUS_CONFIG[o.status];
              return (
                <div key={o.id} className="flex items-center gap-4 rounded-lg border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{o.orderNumber}</p>
                    <p className="text-xs text-muted-foreground">{o.customer.name} — {o.items.length} article(s)</p>
                  </div>
                  <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>
                  <span className="font-display text-sm font-semibold">{o.total.toFixed(2)} €</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
