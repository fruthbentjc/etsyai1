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
  createdAt: string;
}

export type OrderStatus = "en_attente" | "expediee" | "livree" | "annulee";

export interface OrderItem {
  productId: string;
  productTitle: string;
  quantity: number;
  price: number;
  variant?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    address: string;
  };
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  shippedAt?: string;
  deliveredAt?: string;
}

export const mockProducts: Product[] = [
  {
    id: "1",
    title: "Boucles d'oreilles en perles naturelles",
    description: "Magnifiques boucles d'oreilles artisanales en perles d'eau douce montées sur argent 925.",
    price: 34.90,
    stock: 23,
    status: "actif",
    category: "Bijoux",
    tags: ["boucles", "perles", "argent", "artisanal"],
    images: ["/placeholder.svg"],
    variants: [
      { id: "v1", name: "Blanc nacré", price: 34.90, stock: 12, sku: "BO-PN-001" },
      { id: "v2", name: "Rose poudré", price: 34.90, stock: 11, sku: "BO-PN-002" },
    ],
    views: 1240,
    favorites: 89,
    sales: 34,
    createdAt: "2025-12-15",
  },
  {
    id: "2",
    title: "Bougie artisanale cire de soja — Lavande",
    description: "Bougie coulée à la main, 100% cire de soja, parfumée à la lavande de Provence.",
    price: 22.00,
    stock: 45,
    status: "actif",
    category: "Maison",
    tags: ["bougie", "soja", "lavande", "naturel"],
    images: ["/placeholder.svg"],
    variants: [
      { id: "v3", name: "Petit (120g)", price: 16.00, stock: 20, sku: "BG-LAV-S" },
      { id: "v4", name: "Grand (250g)", price: 22.00, stock: 25, sku: "BG-LAV-L" },
    ],
    views: 890,
    favorites: 56,
    sales: 67,
    createdAt: "2025-11-20",
  },
  {
    id: "3",
    title: "Carnet en cuir recyclé A5",
    description: "Carnet relié main en cuir recyclé, papier ivoire 120g, 160 pages lignées.",
    price: 28.50,
    stock: 0,
    status: "inactif",
    category: "Papeterie",
    tags: ["carnet", "cuir", "recyclé", "écriture"],
    images: ["/placeholder.svg"],
    variants: [],
    views: 450,
    favorites: 23,
    sales: 12,
    createdAt: "2026-01-10",
  },
  {
    id: "4",
    title: "Tote bag brodé personnalisable",
    description: "Sac en coton bio avec broderie personnalisée au prénom ou motif de votre choix.",
    price: 19.90,
    stock: 78,
    status: "actif",
    category: "Accessoires",
    tags: ["tote bag", "broderie", "personnalisé", "coton bio"],
    images: ["/placeholder.svg"],
    variants: [
      { id: "v5", name: "Naturel", price: 19.90, stock: 40, sku: "TB-NAT-001" },
      { id: "v6", name: "Noir", price: 19.90, stock: 38, sku: "TB-NOR-001" },
    ],
    views: 2100,
    favorites: 145,
    sales: 89,
    createdAt: "2025-10-05",
  },
  {
    id: "5",
    title: "Savon surgras au lait d'ânesse",
    description: "Savon artisanal saponifié à froid, enrichi en lait d'ânesse bio et beurre de karité.",
    price: 8.50,
    stock: 120,
    status: "actif",
    category: "Beauté",
    tags: ["savon", "lait d'ânesse", "bio", "surgras"],
    images: ["/placeholder.svg"],
    variants: [
      { id: "v7", name: "Sans parfum", price: 8.50, stock: 40, sku: "SAV-SP-001" },
      { id: "v8", name: "Fleur d'oranger", price: 9.00, stock: 40, sku: "SAV-FO-001" },
      { id: "v9", name: "Miel", price: 9.00, stock: 40, sku: "SAV-MI-001" },
    ],
    views: 3200,
    favorites: 210,
    sales: 156,
    createdAt: "2025-09-01",
  },
  {
    id: "6",
    title: "Illustration botanique aquarelle — Eucalyptus",
    description: "Reproduction d'art sur papier Fine Art 300g, signée et numérotée. Format A4.",
    price: 25.00,
    stock: 15,
    status: "brouillon",
    category: "Art",
    tags: ["illustration", "aquarelle", "botanique", "décoration"],
    images: ["/placeholder.svg"],
    variants: [],
    views: 120,
    favorites: 8,
    sales: 0,
    createdAt: "2026-02-20",
  },
];

export const mockOrders: Order[] = [
  {
    id: "o1",
    orderNumber: "ETY-2026-001",
    customer: { name: "Marie Dupont", email: "marie@email.com", address: "12 Rue de la Paix, 75002 Paris" },
    items: [
      { productId: "1", productTitle: "Boucles d'oreilles en perles naturelles", quantity: 1, price: 34.90, variant: "Blanc nacré" },
      { productId: "5", productTitle: "Savon surgras au lait d'ânesse", quantity: 3, price: 8.50, variant: "Fleur d'oranger" },
    ],
    total: 60.40,
    status: "livree",
    createdAt: "2026-02-10",
    shippedAt: "2026-02-12",
    deliveredAt: "2026-02-15",
  },
  {
    id: "o2",
    orderNumber: "ETY-2026-002",
    customer: { name: "Julien Martin", email: "julien.m@email.com", address: "45 Avenue Victor Hugo, 69003 Lyon" },
    items: [
      { productId: "4", productTitle: "Tote bag brodé personnalisable", quantity: 2, price: 19.90, variant: "Noir" },
    ],
    total: 39.80,
    status: "expediee",
    createdAt: "2026-02-18",
    shippedAt: "2026-02-20",
  },
  {
    id: "o3",
    orderNumber: "ETY-2026-003",
    customer: { name: "Sophie Lambert", email: "sophie.l@email.com", address: "8 Rue des Lilas, 33000 Bordeaux" },
    items: [
      { productId: "2", productTitle: "Bougie artisanale cire de soja — Lavande", quantity: 1, price: 22.00, variant: "Grand (250g)" },
      { productId: "1", productTitle: "Boucles d'oreilles en perles naturelles", quantity: 1, price: 34.90, variant: "Rose poudré" },
    ],
    total: 56.90,
    status: "en_attente",
    createdAt: "2026-02-25",
  },
  {
    id: "o4",
    orderNumber: "ETY-2026-004",
    customer: { name: "Pierre Moreau", email: "p.moreau@email.com", address: "22 Boulevard Gambetta, 13001 Marseille" },
    items: [
      { productId: "5", productTitle: "Savon surgras au lait d'ânesse", quantity: 5, price: 8.50, variant: "Miel" },
    ],
    total: 42.50,
    status: "en_attente",
    createdAt: "2026-02-27",
  },
  {
    id: "o5",
    orderNumber: "ETY-2026-005",
    customer: { name: "Camille Roux", email: "camille.r@email.com", address: "3 Place Bellecour, 69002 Lyon" },
    items: [
      { productId: "4", productTitle: "Tote bag brodé personnalisable", quantity: 1, price: 19.90, variant: "Naturel" },
      { productId: "2", productTitle: "Bougie artisanale cire de soja — Lavande", quantity: 2, price: 16.00, variant: "Petit (120g)" },
    ],
    total: 51.90,
    status: "annulee",
    createdAt: "2026-02-22",
  },
];

export const salesData = [
  { month: "Sep", revenue: 1320, orders: 18 },
  { month: "Oct", revenue: 1780, orders: 24 },
  { month: "Nov", revenue: 2450, orders: 32 },
  { month: "Déc", revenue: 3800, orders: 48 },
  { month: "Jan", revenue: 2100, orders: 28 },
  { month: "Fév", revenue: 1950, orders: 25 },
];

export const ORDER_STATUS_CONFIG: Record<OrderStatus, { label: string; className: string }> = {
  en_attente: { label: "En attente", className: "bg-warning/15 text-warning-foreground border-warning/30" },
  expediee: { label: "Expédiée", className: "bg-primary/15 text-accent-foreground border-primary/30" },
  livree: { label: "Livrée", className: "bg-success/15 text-success border-success/30" },
  annulee: { label: "Annulée", className: "bg-destructive/15 text-destructive border-destructive/30" },
};

export const PRODUCT_STATUS_CONFIG: Record<ProductStatus, { label: string; className: string }> = {
  actif: { label: "Actif", className: "bg-success/15 text-success border-success/30" },
  brouillon: { label: "Brouillon", className: "bg-muted text-muted-foreground border-border" },
  inactif: { label: "Inactif", className: "bg-destructive/15 text-destructive border-destructive/30" },
};
