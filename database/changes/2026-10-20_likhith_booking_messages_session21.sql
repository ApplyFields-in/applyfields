-- ApplyFields Database Migration: Session 21
-- Two-Way Citizen <-> Partner Real-Time Chat Messages & Audit Desk
-- Created: 2026-10-20 by Likhith

CREATE TABLE IF NOT EXISTS public.booking_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id TEXT NOT NULL,
    sender_user_id UUID,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('citizen', 'partner', 'system')),
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb, -- [{ name, url, file_type, file_size }]
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_booking_messages_req ON public.booking_messages(request_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_booking_messages_unread ON public.booking_messages(request_id, is_read) WHERE is_read = false;

-- Add execution fulfillment columns to service_requests if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_requests') THEN
        ALTER TABLE public.service_requests 
            ADD COLUMN IF NOT EXISTS official_app_number TEXT,
            ADD COLUMN IF NOT EXISTS acknowledgment_slip_url TEXT,
            ADD COLUMN IF NOT EXISTS operator_notes TEXT;
    END IF;
END $$;
