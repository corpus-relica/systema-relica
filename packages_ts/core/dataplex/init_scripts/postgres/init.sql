-- DROP SCHEMA public;

-- CREATE SCHEMA public AUTHORIZATION postgres;

COMMENT ON SCHEMA public IS 'standard public schema';

-- DROP SEQUENCE public.chat_history_id_seq;

CREATE SEQUENCE public.chat_history_id_seq
	INCREMENT BY 1
	MINVALUE 1
	MAXVALUE 2147483647
	START 1
	CACHE 1
	NO CYCLE;

-- Permissions

ALTER SEQUENCE public.chat_history_id_seq OWNER TO postgres;
GRANT ALL ON SEQUENCE public.chat_history_id_seq TO postgres;
-- public.chat_history definition

-- Drop table

-- DROP TABLE public.chat_history;

CREATE TABLE public.chat_history (
	id serial4 NOT NULL,
	"role" varchar(10) NULL,
	"content" text NULL,
	"time" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
	search_vector tsvector NULL,
	CONSTRAINT chat_history_pkey PRIMARY KEY (id),
	CONSTRAINT chat_history_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[])))
);
CREATE INDEX chat_history_vector_idx ON public.chat_history USING gin (search_vector);

-- Permissions

ALTER TABLE public.chat_history OWNER TO postgres;
GRANT ALL ON TABLE public.chat_history TO postgres;


-- public.env_fact definition

-- Drop table

-- DROP TABLE public.env_fact;

CREATE TABLE public.env_fact (
	uid int8 NOT NULL,
	fact json NOT NULL
);

-- Permissions

ALTER TABLE public.env_fact OWNER TO postgres;
GRANT ALL ON TABLE public.env_fact TO postgres;


-- public.env_model definition

-- Drop table

-- DROP TABLE public.env_model;

CREATE TABLE public.env_model (
	uid int8 NOT NULL,
	model json NULL
);

-- Permissions

ALTER TABLE public.env_model OWNER TO postgres;
GRANT ALL ON TABLE public.env_model TO postgres;


-- public.env_selected_entity definition

-- Drop table

-- DROP TABLE public.env_selected_entity;

CREATE TYPE entity_fact_enum AS ENUM ('entity', 'fact', 'none');

CREATE TABLE public.env_selected_entity (
    id int4 NOT NULL DEFAULT 1,
    uid int8 NULL DEFAULT 0,
    type entity_fact_enum NOT NULL DEFAULT 'none'
);

INSERT INTO public.env_selected_entity DEFAULT VALUES;

-- Permissions

ALTER TABLE public.env_selected_entity OWNER TO postgres;
GRANT ALL ON TABLE public.env_selected_entity TO postgres;

-- Create the vector store table

CREATE TABLE public.vector_store (
    uid bigint PRIMARY KEY,
    embedding vector(4096)  -- Adjust the dimension (4096) based on your embedding model
);

-- Create an index on the embedding column for faster similarity search
-- CREATE INDEX ON public.vector_store USING hnsw (embedding vector_cosine_ops);
-- NEED TO CHOOSE A DIFFERENT EMBEDDING MODEL TO USE THIS INDEX, NEED FEWER THAN 2000 DIMENSIONS
-- CURRENTLY USING 4096 DIMENSIONS; https://huggingface.co/nvidia/NV-Embed-v2

-- Permissions

ALTER TABLE public.vector_store OWNER TO postgres;
GRANT ALL ON TABLE public.vector_store TO postgres;

-- Permissions

GRANT ALL ON SCHEMA public TO postgres;

-- Users table for authentication
CREATE TABLE public.users (
    id serial PRIMARY KEY,
    username varchar(50) UNIQUE NOT NULL,
    email varchar(255) UNIQUE NOT NULL,
    password_hash varchar(255) NOT NULL,
    first_name varchar(255) NOT NULL,
    last_name varchar(255) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    last_login timestamp,
    is_active boolean DEFAULT true,
    is_admin boolean DEFAULT false
);

-- Add indexes for faster lookups
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_username ON public.users(username);

-- Table to store refresh tokens
CREATE TABLE public.refresh_tokens (
    id serial PRIMARY KEY,
    user_id integer REFERENCES users(id) ON DELETE CASCADE,
    token varchar(255) UNIQUE NOT NULL,
    expires_at timestamp NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    revoked boolean DEFAULT false,
    revoked_at timestamp,
    CONSTRAINT fk_user
        FOREIGN KEY(user_id)
        REFERENCES users(id)
);

-- Add indexes for faster token lookups
CREATE INDEX idx_refresh_tokens_token ON public.refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens(user_id);

-- Permissions
ALTER TABLE public.users OWNER TO postgres;
GRANT ALL ON TABLE public.users TO postgres;
ALTER TABLE public.refresh_tokens OWNER TO postgres;
GRANT ALL ON TABLE public.refresh_tokens TO postgres;

-- Sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;

------------------------------------------------------------------------
-- User environments table
CREATE TABLE public.user_environments (
    id serial PRIMARY KEY,
    user_id integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    selected_entity_id bigint,  -- As column because frequently accessed
    selected_entity_type entity_fact_enum,  -- As column because enumerated type
    facts jsonb DEFAULT '[]'::jsonb,  -- As JSONB because variable collection
    models jsonb DEFAULT '[]'::jsonb,  -- As JSONB because variable collection
    lisp_env jsonb,  -- As JSONB because complex state
    last_accessed timestamp DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_environment UNIQUE (user_id)
);

-- Add indexes for common queries
CREATE INDEX idx_user_environments_user_id ON public.user_environments(user_id);
CREATE INDEX idx_user_environments_last_accessed ON public.user_environments(last_accessed);

-- Index for JSON querying if needed
CREATE INDEX idx_user_environments_facts ON public.user_environments USING gin (facts jsonb_path_ops);
CREATE INDEX idx_user_environments_models ON public.user_environments USING gin (models jsonb_path_ops);

-- Permissions
ALTER TABLE public.user_environments OWNER TO postgres;
GRANT ALL ON TABLE public.user_environments TO postgres;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_environments_updated_at
    BEFORE UPDATE ON user_environments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
------------------------------------------------------------------------
