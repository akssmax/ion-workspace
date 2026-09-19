CREATE TABLE IF NOT EXISTS user_preferences (
  user_id text NOT NULL,
  account_id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, account_id)
);
