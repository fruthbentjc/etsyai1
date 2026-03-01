-- Add etsy_listing_id column for sync deduplication
ALTER TABLE public.products ADD COLUMN etsy_listing_id text;

-- Add unique constraint for upsert
CREATE UNIQUE INDEX idx_products_etsy_listing_id ON public.products (etsy_listing_id) WHERE etsy_listing_id IS NOT NULL;

-- Allow service role to upsert synced products (existing RLS uses auth.uid(), 
-- service role bypasses RLS so no policy needed)