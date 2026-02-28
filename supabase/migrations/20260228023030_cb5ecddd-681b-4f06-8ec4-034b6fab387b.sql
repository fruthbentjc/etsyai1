
-- Create product status enum
CREATE TYPE public.product_status AS ENUM ('actif', 'brouillon', 'inactif');

-- Create order status enum
CREATE TYPE public.order_status AS ENUM ('en_attente', 'expediee', 'livree', 'annulee');

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  status public.product_status NOT NULL DEFAULT 'brouillon',
  category TEXT DEFAULT '',
  tags TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  variants JSONB DEFAULT '[]',
  views INTEGER NOT NULL DEFAULT 0,
  favorites INTEGER NOT NULL DEFAULT 0,
  sales INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer JSONB NOT NULL DEFAULT '{}',
  items JSONB NOT NULL DEFAULT '[]',
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'en_attente',
  shipped_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- For now, allow full public access (single-user app, no auth yet)
-- These policies will be tightened when authentication is added
CREATE POLICY "Allow all access to products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all access to orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
