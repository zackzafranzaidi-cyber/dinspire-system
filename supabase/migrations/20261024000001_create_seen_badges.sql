-- Migration: Create seen_badges table
-- Purpose: Segregate user seen badge counters from settings table

CREATE TABLE IF NOT EXISTS public.seen_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_type VARCHAR(20) NOT NULL,
    user_id UUID NOT NULL,
    badge_type VARCHAR(50) NOT NULL,
    seen_count INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_user_badge UNIQUE (user_type, user_id, badge_type)
);

CREATE INDEX IF NOT EXISTS idx_seen_badges_lookup ON public.seen_badges (user_type, user_id);
