-- Migration: Create push_subscriptions table
-- Purpose: Segregate push notification subscriptions from settings table

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type VARCHAR(50) NOT NULL,
    user_id UUID NULL,
    subscription JSONB NOT NULL,
    device_info TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_sub_lookup ON public.push_subscriptions (user_type, user_id);
