-- Supabase SQL Schema for Solar Rooftop Connections
-- Run this in your Supabase SQL Editor

-- Create user_connections table
CREATE TABLE public.user_connections (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL DEFAULT gen_random_uuid(),
    provider VARCHAR(50) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    system_id VARCHAR(255),
    api_key TEXT,
    system_size DECIMAL(10,2),
    monthly_generation INTEGER,
    country VARCHAR(100),
    connected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_sync TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create production_data table for storing fetched solar data
CREATE TABLE public.production_data (
    id BIGSERIAL PRIMARY KEY,
    connection_id BIGINT REFERENCES public.user_connections(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    daily_kwh DECIMAL(10,2),
    monthly_kwh INTEGER,
    total_kwh INTEGER,
    b3tr_earned INTEGER,
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(connection_id, date)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.production_data ENABLE ROW LEVEL SECURITY;

-- Create policies for user_connections
CREATE POLICY "Users can view their own connections" ON public.user_connections
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own connections" ON public.user_connections
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own connections" ON public.user_connections
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Create policies for production_data
CREATE POLICY "Users can view their own production data" ON public.production_data
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_connections 
            WHERE id = production_data.connection_id 
            AND auth.uid()::text = user_id::text
        )
    );

CREATE POLICY "System can insert production data" ON public.production_data
    FOR INSERT WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_user_connections_user_id ON public.user_connections(user_id);
CREATE INDEX idx_user_connections_provider ON public.user_connections(provider);
CREATE INDEX idx_production_data_connection_date ON public.production_data(connection_id, date);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER handle_user_connections_updated_at
    BEFORE UPDATE ON public.user_connections
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
