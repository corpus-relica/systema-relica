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




-- Permissions

GRANT ALL ON SCHEMA public TO postgres;
