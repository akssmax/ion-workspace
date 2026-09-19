CREATE TABLE IF NOT EXISTS calendar_feeds (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  account_id text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#64748b',
  url_ciphertext text NOT NULL,
  etag text,
  last_modified text,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  refreshed_at timestamptz,
  next_refresh_at timestamptz NOT NULL DEFAULT now(),
  error text,
  fail_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS calendar_feeds_due ON calendar_feeds (next_refresh_at);
CREATE INDEX IF NOT EXISTS calendar_feeds_owner ON calendar_feeds (user_id, account_id);
