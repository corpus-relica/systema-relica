-- Migration: Add access_tokens table for API token management
-- Date: 2025-05-26
-- Issue: #74 - Add API Access Token Management to Shutter Service

-- Create access_tokens table
CREATE TABLE IF NOT EXISTS public.access_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    scopes TEXT[], -- Array of permission scopes (read, write)
    last_used_at TIMESTAMP,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_access_tokens_user_id ON public.access_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_access_tokens_token_hash ON public.access_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_access_tokens_is_active ON public.access_tokens(is_active);

-- Grant permissions
ALTER TABLE public.access_tokens OWNER TO postgres;
GRANT ALL ON TABLE public.access_tokens TO postgres;
GRANT USAGE, SELECT ON SEQUENCE public.access_tokens_id_seq TO postgres;

-- Add comment for documentation
COMMENT ON TABLE public.access_tokens IS 'Stores API access tokens for programmatic access to the Relica system';
COMMENT ON COLUMN public.access_tokens.token_hash IS 'Bcrypt hash of the actual token - never store plain tokens';
COMMENT ON COLUMN public.access_tokens.scopes IS 'Array of permission scopes: read, write, admin, websocket';
COMMENT ON COLUMN public.access_tokens.is_active IS 'Soft delete flag - set to false to revoke token';