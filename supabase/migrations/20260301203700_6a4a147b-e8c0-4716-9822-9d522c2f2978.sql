
-- Table to store Etsy OAuth tokens per user
CREATE TABLE public.etsy_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  shop_id TEXT,
  shop_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_etsy UNIQUE (user_id)
);

-- Enable RLS
ALTER TABLE public.etsy_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tokens
CREATE POLICY "Users can view their own etsy tokens"
ON public.etsy_tokens FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own tokens
CREATE POLICY "Users can insert their own etsy tokens"
ON public.etsy_tokens FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own tokens
CREATE POLICY "Users can update their own etsy tokens"
ON public.etsy_tokens FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own tokens
CREATE POLICY "Users can delete their own etsy tokens"
ON public.etsy_tokens FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_etsy_tokens_updated_at
BEFORE UPDATE ON public.etsy_tokens
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
