-- Drop tables in reverse order of dependency to avoid foreign key constraint errors
DROP TABLE IF EXISTS bids;
DROP TABLE IF EXISTS companies;
DROP TABLE IF EXISTS ministries;
DROP TABLE IF EXISTS bid_methods;

-- Enable pg_trgm for faster text search. Must be done before creating indexes that use it.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create tables
CREATE TABLE ministries (
    "コード" VARCHAR(10) PRIMARY KEY,
    "名称" VARCHAR(255) NOT NULL
);

CREATE TABLE bid_methods (
    "コード" VARCHAR(20) PRIMARY KEY,
    "名称" VARCHAR(255) NOT NULL
);

CREATE TABLE companies (
    "法人番号" VARCHAR(20) PRIMARY KEY,
    "商号又は名称" TEXT
);

CREATE TABLE bids (
    "調達案件番号" VARCHAR(50) PRIMARY KEY,
    "調達案件名称" TEXT,
    "落札決定日" DATE,
    "落札価格" BIGINT,
    "府省コード" VARCHAR(10) REFERENCES ministries("コード"),
    "入札方式コード" VARCHAR(20) REFERENCES bid_methods("コード"),
    "法人番号" VARCHAR(20) REFERENCES companies("法人番号")
);

-- Create indexes for faster queries on foreign keys and frequently filtered columns
CREATE INDEX idx_bids_法人番号 ON bids("法人番号");
CREATE INDEX idx_bids_府省コード ON bids("府省コード");
CREATE INDEX idx_bids_落札決定日 ON bids("落札決定日");
CREATE INDEX idx_companies_商号又は名称_gin ON companies USING gin ("商号又は名称" gin_trgm_ops);
-- Grant usage on the schema to the user role
GRANT USAGE ON SCHEMA public TO "user";

-- Set ownership of all tables to the anonymous user for PostgREST
ALTER TABLE public.ministries OWNER TO "user";
ALTER TABLE public.bid_methods OWNER TO "user";
ALTER TABLE public.companies OWNER TO "user";
ALTER TABLE public.bids OWNER TO "user";

-- RPC function to get the total count for a search query
CREATE OR REPLACE FUNCTION public.search_bids_count(
    query text DEFAULT '',
    company text DEFAULT '',
    ministry text DEFAULT '',
    start_date date DEFAULT NULL,
    end_date date DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
    total integer;
BEGIN
    SELECT COUNT(*)
    INTO total
    FROM public.bids AS b
    JOIN public.companies AS c ON b."法人番号" = c."法人番号"
    JOIN public.ministries AS m ON b."府省コード" = m."コード"
    WHERE
        (query = '' OR b."調達案件名称" ILIKE ('%' || query || '%')) AND
        (company = '' OR c."商号又は名称" ILIKE ('%' || company || '%')) AND
        (ministry = '' OR m."名称" = ministry) AND
        (start_date IS NULL OR b."落札決定日" >= start_date) AND
        (end_date IS NULL OR b."落札決定日" <= end_date);
    RETURN total;
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.search_bids_count(text, text, text, date, date) OWNER TO "user";

-- Create a read-only role for anonymous access
CREATE ROLE anon_user NOLOGIN;
GRANT USAGE ON SCHEMA public TO anon_user;
-- Grant select permissions on all tables in the public schema to the anonymous user
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon_user;
GRANT EXECUTE ON FUNCTION public.search_bids_count(text, text, text, date, date) TO anon_user;