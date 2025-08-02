-- Supabase SQL Schema for Solar Rooftop Connections
-- Run this in your Supabase SQL Editor

-- Create user_connections table for storing OAuth and manual connections
CREATE TABLE user_connections (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('enphase', 'solaredge', 'tesla', 'sunpower', 'sma', 'other')),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    system_id TEXT,
    api_key TEXT,
    system_size DECIMAL(10,2),
    monthly_generation DECIMAL(10,2),
    country TEXT DEFAULT 'US',
    is_active BOOLEAN DEFAULT true,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Create production_data table for storing daily solar generation data
CREATE TABLE production_data (
    id SERIAL PRIMARY KEY,
    connection_id INTEGER REFERENCES user_connections(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    daily_kwh DECIMAL(10,3),
    monthly_kwh DECIMAL(10,3),
    total_kwh DECIMAL(10,3),
    b3tr_earned DECIMAL(10,6),
    fetched_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(connection_id, date)
);

-- Create b3tr_rewards table for tracking VeWorld/VeBetterDAO reward distributions
CREATE TABLE b3tr_rewards (
    id SERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount DECIMAL(10,6) NOT NULL,
    tx_hash TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed')),
    distributed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX idx_user_connections_provider ON user_connections(provider);
CREATE INDEX idx_production_data_connection_id ON production_data(connection_id);
CREATE INDEX idx_production_data_date ON production_data(date);
CREATE INDEX idx_b3tr_rewards_user_id ON b3tr_rewards(user_id);
CREATE INDEX idx_b3tr_rewards_status ON b3tr_rewards(status);

-- Enable Row Level Security (RLS)
ALTER TABLE user_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE b3tr_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Note: These are basic policies - adjust based on your auth system)
-- Allow users to see their own connections
CREATE POLICY "Users can view own connections" ON user_connections
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Allow users to insert their own connections
CREATE POLICY "Users can insert own connections" ON user_connections
    FOR INSERT WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Allow users to update their own connections
CREATE POLICY "Users can update own connections" ON user_connections
    FOR UPDATE USING (user_id = auth.jwt() ->> 'sub');

-- Allow users to view their production data
CREATE POLICY "Users can view own production data" ON production_data
    FOR SELECT USING (
        connection_id IN (
            SELECT id FROM user_connections WHERE user_id = auth.jwt() ->> 'sub'
        )
    );

-- Allow system to insert production data (for cron jobs)
CREATE POLICY "System can insert production data" ON production_data
    FOR INSERT WITH CHECK (true);

-- Allow users to view their B3TR rewards
CREATE POLICY "Users can view own rewards" ON b3tr_rewards
    FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

-- Allow system to insert B3TR rewards (for cron jobs)
CREATE POLICY "System can insert rewards" ON b3tr_rewards
    FOR INSERT WITH CHECK (true);

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
