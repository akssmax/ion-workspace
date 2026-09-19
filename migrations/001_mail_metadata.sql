-- Only app-owned metadata lives here; JMAP remains the source of truth for mail.
CREATE TABLE IF NOT EXISTS mail_templates (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  account_id text NOT NULL,
  name text NOT NULL,
  subject text NOT NULL DEFAULT '',
  html_body text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mail_templates_owner ON mail_templates (user_id, account_id, name);

CREATE TABLE IF NOT EXISTS mail_saved_searches (
  id uuid PRIMARY KEY,
  user_id text NOT NULL,
  account_id text NOT NULL,
  name text NOT NULL,
  query text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mail_saved_searches_owner ON mail_saved_searches (user_id, account_id, name);
