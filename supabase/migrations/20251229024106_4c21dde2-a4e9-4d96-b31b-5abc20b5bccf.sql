-- Create enum for asset types
CREATE TYPE public.asset_type AS ENUM ('image', 'video', 'text');

-- Create enum for asset status
CREATE TYPE public.asset_status AS ENUM ('scanning', 'captured', 'minted');

-- Create enum for AI service sources
CREATE TYPE public.ai_service AS ENUM ('midjourney', 'dalle', 'stable', 'runway', 'sora', 'firefly', 'veo', 'chatgpt');

-- Create passports table for storing user's AI assets
CREATE TABLE public.passports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  acp_id TEXT UNIQUE NOT NULL,
  prompt TEXT NOT NULL,
  preview_url TEXT,
  source_ai ai_service NOT NULL,
  asset_type asset_type NOT NULL DEFAULT 'image',
  status asset_status NOT NULL DEFAULT 'captured',
  trust_level INTEGER DEFAULT 85 CHECK (trust_level >= 0 AND trust_level <= 100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  minted_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX idx_passports_user_id ON public.passports(user_id);
CREATE INDEX idx_passports_source_ai ON public.passports(source_ai);
CREATE INDEX idx_passports_status ON public.passports(status);
CREATE INDEX idx_passports_created_at ON public.passports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.passports ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own passports
CREATE POLICY "Users can view their own passports" 
ON public.passports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own passports" 
ON public.passports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own passports" 
ON public.passports 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own passports" 
ON public.passports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow public read for demo purposes (users not logged in can see demo data)
CREATE POLICY "Public can view passports without user_id" 
ON public.passports 
FOR SELECT 
USING (user_id IS NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_passports_updated_at
BEFORE UPDATE ON public.passports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate ACP ID
CREATE OR REPLACE FUNCTION public.generate_acp_id()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := 'ACP-';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create scanned_assets table for temporary scanning queue
CREATE TABLE public.scanned_assets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  preview_url TEXT,
  source_ai ai_service NOT NULL,
  asset_type asset_type NOT NULL DEFAULT 'image',
  status asset_status NOT NULL DEFAULT 'scanning',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for scanned_assets
ALTER TABLE public.scanned_assets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scanned_assets
CREATE POLICY "Users can view their own scanned assets" 
ON public.scanned_assets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create scanned assets" 
ON public.scanned_assets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scanned assets" 
ON public.scanned_assets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scanned assets" 
ON public.scanned_assets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Allow public access for demo (non-logged in users)
CREATE POLICY "Public can view scanned assets without user_id" 
ON public.scanned_assets 
FOR SELECT 
USING (user_id IS NULL);

CREATE POLICY "Public can create scanned assets" 
ON public.scanned_assets 
FOR INSERT 
WITH CHECK (user_id IS NULL);